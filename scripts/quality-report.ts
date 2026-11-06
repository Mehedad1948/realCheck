// Read-only report on evaluator quality and likely fraud. Changes nothing.
// Run with: npm run quality:report [-- --days=30]
//
// Flags, per evaluator over the period:
//   LOW_TRUST     trust below MIN_TRUST (they are already blocked from new work)
//   TOO_FAST      over 20% of answers faster than MIN_RESPONSE_MS
//   ONE_ANSWER    over 85% of answers are the same option (answering without reading)
//   DISAGREES     under 60% agreement with consensus on resolved items
// Pairs that picked the same WRONG answer on several of the same check questions are
// the strongest sign of shared answers or one person running several accounts.
import { PrismaClient } from '@prisma/client';
import { GOLD_MAX_EXPOSURES, MIN_RESPONSE_MS, MIN_TRUST } from '../src/lib/constants';

const prisma = new PrismaClient();

const days = Number(process.argv.find((arg) => arg.startsWith('--days='))?.split('=')[1] ?? 30);
const MIN_VOTES = 20;
const MIN_SHARED_WRONG_GOLD = 3;

type EvaluatorRow = {
  userId: string;
  username: string | null;
  trust: number;
  goldAnswered: number;
  votes: number;
  fast: number;
  medianMs: number | null;
  topShare: number;
  resolved: number;
  matched: number;
};

async function evaluators(since: Date) {
  return prisma.$queryRaw<EvaluatorRow[]>`
    WITH v AS (
      SELECT v.*, t."isValidation", t.status AS "taskStatus", t."consensusLabel"
      FROM "Vote" v JOIN "Task" t ON t.id = v."taskId"
      WHERE v."createdAt" >= ${since}
    ),
    per_option AS (
      SELECT "userId", MAX(n)::float / SUM(n) AS "topShare"
      FROM (SELECT "userId", selection, COUNT(*) AS n FROM v GROUP BY 1, 2) x
      GROUP BY 1
    )
    SELECT u.id AS "userId", u.username, u.trust, u."goldAnswered",
      COUNT(*)::int AS votes,
      (COUNT(*) FILTER (WHERE v."responseMs" < ${MIN_RESPONSE_MS}))::int AS fast,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY v."responseMs") AS "medianMs",
      p."topShare",
      (COUNT(*) FILTER (WHERE NOT v."isValidation" AND v."taskStatus" = 'COMPLETED'))::int AS resolved,
      (COUNT(*) FILTER (WHERE NOT v."isValidation" AND v."taskStatus" = 'COMPLETED' AND v."consensusLabel" = v.selection))::int AS matched
    FROM v
    JOIN "User" u ON u.id = v."userId"
    JOIN per_option p ON p."userId" = v."userId"
    GROUP BY u.id, p."topShare"
    HAVING COUNT(*) >= ${MIN_VOTES}
    ORDER BY u.trust ASC`;
}

type PairRow = { a: string; b: string; sharedWrong: number; sharedGold: number };

async function suspiciousPairs(since: Date) {
  return prisma.$queryRaw<PairRow[]>`
    SELECT x."userId" AS a, y."userId" AS b,
      (COUNT(*) FILTER (WHERE NOT x."isCorrect" AND x.selection = y.selection))::int AS "sharedWrong",
      COUNT(*)::int AS "sharedGold"
    FROM "Vote" x
    JOIN "Vote" y ON y."taskId" = x."taskId" AND y."userId" > x."userId"
    WHERE x."isCorrect" IS NOT NULL AND x."createdAt" >= ${since}
    GROUP BY 1, 2
    HAVING COUNT(*) FILTER (WHERE NOT x."isCorrect" AND x.selection = y.selection) >= ${MIN_SHARED_WRONG_GOLD}
    ORDER BY 3 DESC
    LIMIT 50`;
}

type DatasetRow = {
  title: string;
  status: string;
  items: number;
  disputed: number;
  done: number;
  doneVotes: number;
  liveGold: number;
};

async function datasets() {
  return prisma.$queryRaw<DatasetRow[]>`
    SELECT d.title, d.status::text AS status,
      (COUNT(t.id) FILTER (WHERE NOT t."isValidation"))::int AS items,
      (COUNT(t.id) FILTER (WHERE t.status = 'DISPUTED'))::int AS disputed,
      (COUNT(t.id) FILTER (WHERE NOT t."isValidation" AND t.status <> 'ACTIVE'))::int AS done,
      COALESCE(SUM(t."collectedVotes") FILTER (WHERE NOT t."isValidation" AND t.status <> 'ACTIVE'), 0)::int AS "doneVotes",
      (COUNT(t.id) FILTER (WHERE t."isValidation" AND t."collectedVotes" < ${GOLD_MAX_EXPOSURES}))::int AS "liveGold"
    FROM "Dataset" d LEFT JOIN "Task" t ON t."datasetId" = d.id
    WHERE d.status <> 'PAUSED'
    GROUP BY d.id
    ORDER BY d."createdAt" DESC`;
}

const pct = (value: number) => `${Math.round(value * 100)}%`;

async function main() {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [people, pairs, sets] = await Promise.all([evaluators(since), suspiciousPairs(since), datasets()]);

  console.log(`\nEvaluators with ${MIN_VOTES}+ answers in the last ${days} days (lowest trust first)`);
  console.table(
    people.map((row) => {
      const agreement = row.resolved > 0 ? row.matched / row.resolved : null;
      const flags = [
        row.trust < MIN_TRUST && 'LOW_TRUST',
        row.fast / row.votes > 0.2 && 'TOO_FAST',
        row.topShare > 0.85 && 'ONE_ANSWER',
        agreement !== null && row.resolved >= 10 && agreement < 0.6 && 'DISAGREES',
      ].filter(Boolean);
      return {
        user: row.username ?? row.userId,
        trust: row.trust.toFixed(2),
        gold: row.goldAnswered,
        answers: row.votes,
        agreement: agreement === null ? '—' : pct(agreement),
        medianSec: row.medianMs === null ? '—' : (row.medianMs / 1000).toFixed(1),
        fast: pct(row.fast / row.votes),
        topOption: pct(row.topShare),
        flags: flags.join(' '),
      };
    }),
  );

  console.log(`\nPairs that chose the same wrong answer on ${MIN_SHARED_WRONG_GOLD}+ shared check questions`);
  if (pairs.length === 0) console.log('  none');
  else console.table(pairs);

  console.log('\nLive datasets');
  console.table(
    sets.map((row) => ({
      title: row.title,
      status: row.status,
      items: row.items,
      finished: pct(row.items > 0 ? row.done / row.items : 0),
      disputed: row.done > 0 ? pct(row.disputed / row.done) : '—',
      answersPerItem: row.done > 0 ? (row.doneVotes / row.done).toFixed(2) : '—',
      liveCheckQuestions: row.liveGold,
    })),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
