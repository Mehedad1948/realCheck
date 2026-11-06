import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Address, Cell, contractAddress, loadStateInit, type StateInit } from '@ton/core';
import { signVerify } from '@ton/crypto';

// TON Connect ton_proof: proves the person linking a wallet holds its private key.
// https://docs.ton.org/applications/ton-connect/how-to/verify-ton-proof
//
// 1. The server issues a payload bound to the user and a short expiry (no storage needed).
// 2. The wallet signs (address, app domain, timestamp, payload) with its key.
// 3. The server checks the signature against the public key stored in the wallet's own
//    StateInit, after checking that StateInit really derives the claimed address.

export const TON_NETWORKS = { mainnet: '-239', testnet: '-3' } as const;
const PAYLOAD_TTL_SECONDS = 15 * 60;

function payloadSignature(secret: string, userId: string, body: string) {
  return createHmac('sha256', secret).update(`${userId}.${body}`).digest('base64url').slice(0, 22);
}

/** A short-lived, user-bound nonce for the wallet to sign. */
export function createProofPayload(userId: string, secret: string, now = new Date()) {
  const expires = Math.floor(now.getTime() / 1000) + PAYLOAD_TTL_SECONDS;
  const body = `${expires.toString(36)}.${randomBytes(8).toString('hex')}`;
  return `${body}.${payloadSignature(secret, userId, body)}`;
}

export function isValidProofPayload(payload: string, userId: string, secret: string, now = new Date()) {
  const parts = payload.split('.');
  if (parts.length !== 3) return false;
  const body = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(payloadSignature(secret, userId, body));
  const actual = Buffer.from(parts[2]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
  return parseInt(parts[0], 36) >= Math.floor(now.getTime() / 1000);
}

export type TonProofInput = {
  /** Raw address, "<workchain>:<hex>". */
  address: string;
  /** TON Connect chain id: "-239" mainnet, "-3" testnet. */
  network: string;
  /** Base64 BoC of the wallet's StateInit. */
  walletStateInit: string;
  proof: {
    timestamp: number;
    domain: { lengthBytes: number; value: string };
    payload: string;
    signature: string;
  };
};

export class TonProofError extends Error {}

/** Where wallet contracts keep their public key in their data cell, by wallet version. */
const PUBLIC_KEY_OFFSETS = [
  64, // v3, v4: seqno(32) subwallet(32) publicKey(256)
  65, // v5: isSignatureAllowed(1) seqno(32) walletId(32) publicKey(256)
  32, // v1, v2: seqno(32) publicKey(256)
];

function publicKeyCandidates(init: StateInit) {
  if (!init.data) return [];
  const keys: Buffer[] = [];
  for (const offset of PUBLIC_KEY_OFFSETS) {
    try {
      const slice = init.data.beginParse();
      slice.skip(offset);
      keys.push(slice.loadBuffer(32));
    } catch {
      // Data too short for this layout.
    }
  }
  return keys;
}

/** The exact bytes a TON Connect wallet signs for ton_proof. */
export function tonProofMessage(address: Address, proof: TonProofInput['proof']) {
  const workchain = Buffer.alloc(4);
  workchain.writeInt32BE(address.workChain);
  const domainLength = Buffer.alloc(4);
  domainLength.writeUInt32LE(proof.domain.lengthBytes);
  const timestamp = Buffer.alloc(8);
  timestamp.writeBigUInt64LE(BigInt(proof.timestamp));

  const message = Buffer.concat([
    Buffer.from('ton-proof-item-v2/'),
    workchain,
    address.hash,
    domainLength,
    Buffer.from(proof.domain.value),
    timestamp,
    Buffer.from(proof.payload),
  ]);
  const messageHash = createHash('sha256').update(message).digest();
  const full = Buffer.concat([Buffer.from([0xff, 0xff]), Buffer.from('ton-connect'), messageHash]);
  return createHash('sha256').update(full).digest();
}

/**
 * Verifies a ton_proof and returns the wallet's raw address. Throws TonProofError when
 * the proof is for another app, network or wallet, is stale, or the signature is wrong.
 */
export function verifyTonProof(
  input: TonProofInput,
  expected: { domain: string; network: string; now?: Date; maxAgeSeconds?: number },
) {
  const now = expected.now ?? new Date();
  const { proof } = input;

  if (input.network !== expected.network) throw new TonProofError('This wallet is on a different TON network.');
  if (proof.domain.value !== expected.domain || proof.domain.lengthBytes !== Buffer.byteLength(proof.domain.value)) {
    throw new TonProofError('The wallet signed for a different app.');
  }
  if (Math.abs(now.getTime() / 1000 - proof.timestamp) > (expected.maxAgeSeconds ?? PAYLOAD_TTL_SECONDS)) {
    throw new TonProofError('The wallet signature has expired. Try connecting again.');
  }

  let address: Address;
  let init: StateInit;
  try {
    address = Address.parseRaw(input.address);
    init = loadStateInit(Cell.fromBase64(input.walletStateInit).beginParse());
  } catch {
    throw new TonProofError('The wallet sent an unreadable address or contract.');
  }
  if (!contractAddress(address.workChain, init).equals(address)) {
    throw new TonProofError('The wallet contract does not match its address.');
  }

  const signed = tonProofMessage(address, proof);
  const signature = Buffer.from(proof.signature, 'base64');
  if (!publicKeyCandidates(init).some((key) => signVerify(signed, signature, key))) {
    throw new TonProofError('The wallet signature is not valid.');
  }
  return address.toRawString();
}
