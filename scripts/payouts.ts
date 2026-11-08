// Review and send evaluator withdrawals. Run with: npm run payouts -- <command>
//
//   list [all]                 open withdrawals (or the last 50 of any status) with risk notes
//   approve <id> [<id> ...]    approve requested withdrawals
//   reject <id> <reason>       decline; the amount goes back to the evaluator's balance
//   wallet                     hot wallet address and balances (fund it with USDT and some TON)
//   send [--limit N] [--dry-run]
//                              send approved withdrawals in USDT, one transfer at a time
//   mark-sent <id> [txHash]    resolve a SENDING withdrawal you confirmed on chain
//   mark-failed <id> <reason>  resolve a SENDING withdrawal that never went out (refunds it)
//
// Environment: DATABASE_URL, TON_NETWORK (mainnet | testnet), PAYOUT_WALLET_MNEMONIC (12 or 24
// words of a W5 wallet used only for payouts), optional TONCENTER_API_KEY and USDT_JETTON_MASTER, and
// BOT_TOKEN to tell evaluators when their payout is sent or declined.
//
// Safety: `send` marks a withdrawal SENDING before broadcasting and never resends a SENDING one.
// If the script stops mid-way, check the hot wallet on tonviewer.com and resolve it by hand.
import { PrismaClient } from '@prisma/client';
import { Address, beginCell, internal, JettonMaster, JettonWallet, SendMode, toNano, TonClient, WalletContractV5R1 } from '@ton/ton';
import { deriveEd25519Path, keyPairFromSeed, mnemonicToPrivateKey, mnemonicValidate, pbkdf2_sha512 } from '@ton/crypto';
import {
  approveWithdrawal,
  markWithdrawalFailed,
  markWithdrawalSending,
  markWithdrawalSent,
  OPEN_WITHDRAWAL_STATUSES,
  rejectWithdrawal,
} from '../src/server/withdrawals';

const prisma = new PrismaClient();

const network = process.env.TON_NETWORK === 'testnet' ? 'testnet' : 'mainnet';
const testOnly = network === 'testnet';
/** Tether's USDT on TON mainnet. On testnet, set USDT_JETTON_MASTER to a test jetton. */
const MAINNET_USDT = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
const USDT_DECIMALS = BigInt(6);
/** TON attached to each jetton transfer for gas; the unused part comes back to the hot wallet. */
const TRANSFER_TON = toNano('0.05');
const JETTON_TRANSFER_OP = 0x0f8a7ea5;

const centsToUsdtUnits = (cents: number) => BigInt(cents) * BigInt(10) ** (USDT_DECIMALS - BigInt(2));
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const friendly = (raw: string) => Address.parseRaw(raw).toString({ bounceable: false, testOnly });

// ---------- review ----------

async function list(all: boolean) {
  const withdrawals = await prisma.withdrawal.findMany({
    where: all ? {} : { status: { in: OPEN_WITHDRAWAL_STATUSES } },
    orderBy: { createdAt: all ? 'desc' : 'asc' },
    take: 50,
    include: {
      user: {
        select: {
          username: true,
          telegramId: true,
          trust: true,
          goldAnswered: true,
          createdAt: true,
          _count: { select: { votes: true, withdrawals: true } },
        },
      },
    },
  });
  if (withdrawals.length === 0) return console.log(all ? 'No withdrawals yet.' : 'Nothing waiting. 🎉');

  const dayMs = 24 * 60 * 60 * 1000;
  console.table(
    withdrawals.map((w) => {
      const notes = [
        w.user.trust < 0.75 && 'low trust',
        w.user.goldAnswered < 10 && 'few check answers',
        Date.now() - w.user.createdAt.getTime() < 7 * dayMs && 'new account',
        w.user._count.withdrawals === 1 && 'first payout',
      ].filter(Boolean);
      return {
        id: w.id,
        status: w.status,
        amount: usd(w.amountCents),
        user: w.user.username ? `@${w.user.username}` : w.user.telegramId,
        trust: w.user.trust.toFixed(2),
        answers: w.user._count.votes,
        to: friendly(w.address),
        requested: w.createdAt.toISOString().slice(0, 16).replace('T', ' '),
        notes: notes.join(', '),
      };
    }),
  );
  console.log('Tip: npm run quality:report shows who answers too fast or copies answers.');
}

async function notify(userId: string, text: string) {
  const token = process.env.BOT_TOKEN;
  if (!token) return;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { telegramId: true, allowsWriteToPm: true } });
  if (!user?.telegramId || !user.allowsWriteToPm) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: user.telegramId, text }),
    });
  } catch (error) {
    console.warn(`  (could not message the evaluator: ${(error as Error).message})`);
  }
}

async function approve(ids: string[]) {
  if (ids.length === 0) throw new Error('Usage: approve <id> [<id> ...]');
  for (const id of ids) {
    const w = await approveWithdrawal(prisma, id);
    console.log(`Approved ${id} (${usd(w.amountCents)})`);
  }
}

async function reject(id: string | undefined, reason: string) {
  if (!id || !reason) throw new Error('Usage: reject <id> <reason>');
  const w = await rejectWithdrawal(prisma, id, reason);
  console.log(`Rejected ${id}; ${usd(w.amountCents)} returned to the evaluator.`);
  await notify(w.userId, `Your RealCheck withdrawal of ${usd(w.amountCents)} was declined: ${reason}\nThe amount is back in your balance.`);
}

// ---------- sending ----------

/**
 * Keys from a TON-native phrase (usually 24 words) or a 12/24-word BIP39 phrase from a
 * multi-chain wallet app, which uses the standard TON path m/44'/607'/0'.
 */
async function keyFromMnemonic(words: string[]) {
  if (await mnemonicValidate(words)) return mnemonicToPrivateKey(words);
  const seed = await pbkdf2_sha512(words.join(' ').normalize('NFKD'), 'mnemonic', 2048, 64);
  return keyPairFromSeed(await deriveEd25519Path(seed, [44, 607, 0]));
}

async function hotWallet() {
  const mnemonic = process.env.PAYOUT_WALLET_MNEMONIC?.trim().split(/\s+/);
  if (!mnemonic || (mnemonic.length !== 12 && mnemonic.length !== 24)) {
    throw new Error('Set PAYOUT_WALLET_MNEMONIC to the 12 or 24 words of the payout wallet.');
  }
  const usdtMaster = process.env.USDT_JETTON_MASTER ?? (testOnly ? undefined : MAINNET_USDT);
  if (!usdtMaster) throw new Error('On testnet, set USDT_JETTON_MASTER to the test jetton you pay out.');

  const client = new TonClient({
    endpoint: `https://${testOnly ? 'testnet.' : ''}toncenter.com/api/v2/jsonRPC`,
    apiKey: process.env.TONCENTER_API_KEY,
  });
  const key = await keyFromMnemonic(mnemonic);
  const contract = WalletContractV5R1.create({
    publicKey: key.publicKey,
    walletId: { networkGlobalId: testOnly ? -3 : -239, context: { walletVersion: 'v5r1', workchain: 0, subwalletNumber: 0 } },
  });
  const wallet = client.open(contract);
  const master = Address.parse(usdtMaster);
  if (Address.isFriendly(usdtMaster) && Address.parseFriendly(usdtMaster).isTestOnly !== testOnly) {
    throw new Error(`USDT_JETTON_MASTER ${usdtMaster} is a ${testOnly ? 'mainnet' : 'testnet'} address, but TON_NETWORK is ${network}.`);
  }
  let jettonWalletAddress: Address;
  try {
    jettonWalletAddress = await client.open(JettonMaster.create(master)).getWalletAddress(contract.address);
  } catch (error) {
    throw new Error(
      `Could not read the USDT contract ${usdtMaster} on ${network} (is USDT_JETTON_MASTER right for this network?)`,
      { cause: error },
    );
  }
  const jettonWallet = client.open(JettonWallet.create(jettonWalletAddress));
  return { client, key, wallet, address: contract.address, jettonWalletAddress, jettonWallet };
}

async function usdtBalance(jettonWallet: Awaited<ReturnType<typeof hotWallet>>['jettonWallet']) {
  try {
    return await jettonWallet.getBalance();
  } catch {
    return BigInt(0); // The jetton wallet doesn't exist until it first receives USDT.
  }
}

async function showWallet() {
  const hot = await hotWallet();
  const [ton, usdt] = await Promise.all([hot.client.getBalance(hot.address), usdtBalance(hot.jettonWallet)]);
  console.log(`Network:  ${network}`);
  console.log(`Address:  ${hot.address.toString({ bounceable: false, testOnly })}`);
  console.log(`TON:      ${(Number(ton) / 1e9).toFixed(3)}  (gas, about 0.05 per payout)`);
  console.log(`USDT:     ${(Number(usdt) / 1e6).toFixed(2)}`);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The hot wallet's transaction that sent the jetton transfer with this query id. */
async function findTransferHash(client: TonClient, address: Address, queryId: bigint) {
  const transactions = await client.getTransactions(address, { limit: 15 });
  for (const tx of transactions) {
    for (const message of tx.outMessages.values()) {
      const body = message.body.beginParse();
      if (body.remainingBits < 96) continue;
      if (body.loadUint(32) === JETTON_TRANSFER_OP && body.loadUintBig(64) === queryId) return tx.hash().toString('hex');
    }
  }
  return undefined;
}

async function send(limit: number, dryRun: boolean) {
  const approved = await prisma.withdrawal.findMany({ where: { status: 'APPROVED' }, orderBy: { createdAt: 'asc' }, take: limit });
  if (approved.length === 0) return console.log('No approved withdrawals to send.');

  const hot = await hotWallet();
  const [ton, usdt] = await Promise.all([hot.client.getBalance(hot.address), usdtBalance(hot.jettonWallet)]);
  const neededUsdt = approved.reduce((sum, w) => sum + centsToUsdtUnits(w.amountCents), BigInt(0));
  const neededTon = TRANSFER_TON * BigInt(approved.length);
  console.log(`${approved.length} payout(s), ${(Number(neededUsdt) / 1e6).toFixed(2)} USDT. Hot wallet has ${(Number(usdt) / 1e6).toFixed(2)} USDT, ${(Number(ton) / 1e9).toFixed(3)} TON.`);
  if (usdt < neededUsdt) throw new Error('Not enough USDT in the hot wallet. Top it up, or use --limit.');
  if (ton < neededTon) throw new Error('Not enough TON for gas in the hot wallet.');
  if (dryRun) return console.log('Dry run: nothing sent.');

  for (const w of approved) {
    const units = centsToUsdtUnits(w.amountCents);
    const body = beginCell()
      .storeUint(JETTON_TRANSFER_OP, 32)
      .storeUint(w.queryId, 64)
      .storeCoins(units)
      .storeAddress(Address.parseRaw(w.address)) // recipient
      .storeAddress(hot.address) // leftover gas comes back here
      .storeBit(0) // no custom payload
      .storeCoins(1) // a nanoton forwarded so the recipient's wallet shows the comment
      .storeBit(1)
      .storeRef(beginCell().storeUint(0, 32).storeStringTail('RealCheck payout').endCell())
      .endCell();

    const seqno = await hot.wallet.getSeqno();
    await markWithdrawalSending(prisma, w.id);
    try {
      await hot.wallet.sendTransfer({
        seqno,
        secretKey: hot.key.secretKey,
        sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
        messages: [internal({ to: hot.jettonWalletAddress, value: TRANSFER_TON, bounce: true, body })],
      });
    } catch (error) {
      console.error(`Broadcast of ${w.id} failed: ${(error as Error).message}`);
      console.error('It is left SENDING. Check the hot wallet, then run mark-sent or mark-failed.');
      process.exitCode = 1;
      return;
    }

    // Wait for the wallet to accept the message before sending the next one (seqno must advance).
    let confirmed = false;
    for (let i = 0; i < 40 && !confirmed; i++) {
      await sleep(3000);
      confirmed = (await hot.wallet.getSeqno().catch(() => seqno)) > seqno;
    }
    if (!confirmed) {
      console.error(`${w.id} was broadcast but not confirmed within 2 minutes. It is left SENDING; check the hot wallet.`);
      process.exitCode = 1;
      return;
    }

    const txHash = await findTransferHash(hot.client, hot.address, w.queryId).catch(() => undefined);
    await markWithdrawalSent(prisma, w.id, txHash);
    console.log(`Sent ${usd(w.amountCents)} to ${friendly(w.address)}${txHash ? ` (tx ${txHash.slice(0, 12)}…)` : ''}`);
    await notify(w.userId, `Your RealCheck payout of ${(Number(units) / 1e6).toFixed(2)} USDT is on its way to ${friendly(w.address)}.`);
  }
}

async function markSent(id: string | undefined, txHash: string | undefined) {
  if (!id) throw new Error('Usage: mark-sent <id> [txHash]');
  const w = await markWithdrawalSent(prisma, id, txHash);
  console.log(`Marked ${id} as sent.`);
  await notify(w.userId, `Your RealCheck payout of ${usd(w.amountCents)} is on its way to ${friendly(w.address)}.`);
}

async function markFailed(id: string | undefined, reason: string) {
  if (!id || !reason) throw new Error('Usage: mark-failed <id> <reason>');
  const w = await markWithdrawalFailed(prisma, id, reason);
  console.log(`Marked ${id} as failed; ${usd(w.amountCents)} returned to the evaluator.`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const flag = (name: string) => args.includes(name);
  const option = (name: string) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };

  switch (command) {
    case 'list':
      return list(args[0] === 'all');
    case 'approve':
      return approve(args);
    case 'reject':
      return reject(args[0], args.slice(1).join(' '));
    case 'wallet':
      return showWallet();
    case 'send':
      return send(Number(option('--limit') ?? 20), flag('--dry-run'));
    case 'mark-sent':
      return markSent(args[0], args[1]);
    case 'mark-failed':
      return markFailed(args[0], args.slice(1).join(' '));
    default:
      console.log('Commands: list [all] | approve <id...> | reject <id> <reason> | wallet | send [--limit N] [--dry-run] | mark-sent <id> [tx] | mark-failed <id> <reason>');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
