import { randomBytes } from 'node:crypto';
import { beginCell, storeStateInit } from '@ton/core';
import { keyPairFromSeed, sign } from '@ton/crypto';
import { WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import { describe, expect, it } from 'vitest';
import {
  createProofPayload,
  isValidProofPayload,
  TON_NETWORKS,
  TonProofError,
  tonProofMessage,
  verifyTonProof,
  type TonProofInput,
} from './proof';

const DOMAIN = 'realcheck.example.com';
const NOW = new Date('2026-11-07T12:00:00Z');
const expected = { domain: DOMAIN, network: TON_NETWORKS.mainnet, now: NOW };

function newKey() {
  return keyPairFromSeed(randomBytes(32));
}

/** A ton_proof exactly as a wallet would produce it. */
function signedProof(wallet: WalletContractV4 | WalletContractV5R1, secretKey: Buffer, overrides: Partial<TonProofInput['proof']> = {}): TonProofInput {
  const proof = {
    timestamp: Math.floor(NOW.getTime() / 1000) - 5,
    domain: { lengthBytes: Buffer.byteLength(DOMAIN), value: DOMAIN },
    payload: 'nonce',
    signature: '',
    ...overrides,
  };
  proof.signature = sign(tonProofMessage(wallet.address, proof), secretKey).toString('base64');
  return {
    address: wallet.address.toRawString(),
    network: TON_NETWORKS.mainnet,
    walletStateInit: beginCell().store(storeStateInit(wallet.init)).endCell().toBoc().toString('base64'),
    proof,
  };
}

describe('verifyTonProof', () => {
  it('accepts a v4 wallet proof', () => {
    const key = newKey();
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
    expect(verifyTonProof(signedProof(wallet, key.secretKey), expected)).toBe(wallet.address.toRawString());
  });

  it('accepts a v5 wallet proof', () => {
    const key = newKey();
    const wallet = WalletContractV5R1.create({ publicKey: key.publicKey });
    expect(verifyTonProof(signedProof(wallet, key.secretKey), expected)).toBe(wallet.address.toRawString());
  });

  it('rejects someone signing for a wallet that is not theirs', () => {
    const victim = WalletContractV4.create({ workchain: 0, publicKey: newKey().publicKey });
    const attacker = newKey();
    expect(() => verifyTonProof(signedProof(victim, attacker.secretKey), expected)).toThrow(TonProofError);
  });

  it('rejects a StateInit that does not derive the claimed address', () => {
    const key = newKey();
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
    const other = WalletContractV4.create({ workchain: 0, publicKey: newKey().publicKey });
    const input = signedProof(wallet, key.secretKey);
    expect(() => verifyTonProof({ ...input, address: other.address.toRawString() }, expected)).toThrow('does not match');
  });

  it('rejects proofs for another domain, network or time', () => {
    const key = newKey();
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
    const evil = 'evil.example.com';
    expect(() =>
      verifyTonProof(signedProof(wallet, key.secretKey, { domain: { lengthBytes: evil.length, value: evil } }), expected),
    ).toThrow('different app');
    expect(() => verifyTonProof({ ...signedProof(wallet, key.secretKey), network: TON_NETWORKS.testnet }, expected)).toThrow(
      'different TON network',
    );
    expect(() =>
      verifyTonProof(signedProof(wallet, key.secretKey, { timestamp: Math.floor(NOW.getTime() / 1000) - 3600 }), expected),
    ).toThrow('expired');
  });

  it('rejects a tampered payload', () => {
    const key = newKey();
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
    const input = signedProof(wallet, key.secretKey);
    expect(() => verifyTonProof({ ...input, proof: { ...input.proof, payload: 'other' } }, expected)).toThrow('not valid');
  });
});

describe('proof payloads', () => {
  it('are bound to the user and expire', () => {
    const payload = createProofPayload('user-1', 'secret', NOW);
    expect(isValidProofPayload(payload, 'user-1', 'secret', NOW)).toBe(true);
    expect(isValidProofPayload(payload, 'user-2', 'secret', NOW)).toBe(false);
    expect(isValidProofPayload(payload, 'user-1', 'other-secret', NOW)).toBe(false);
    expect(isValidProofPayload(payload, 'user-1', 'secret', new Date(NOW.getTime() + 16 * 60 * 1000))).toBe(false);
    expect(isValidProofPayload(`${payload}x`, 'user-1', 'secret', NOW)).toBe(false);
  });
});
