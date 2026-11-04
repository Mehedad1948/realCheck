# RealCheck

Clients upload datasets on the web dashboard. Evaluators label them in a Telegram Mini App and are paid per accepted answer. Each item is answered by several evaluators until it reaches consensus. Hidden check questions with known answers score evaluators' accuracy.

## Architecture

```
src/
  app/
    (site)/            website + client dashboard (own root layout, cookie session)
    (tma)/app/         Telegram Mini App (own root layout, Telegram theme, React Query)
    api/               BFF route handlers
      public/          viewer-independent, served from the shared cache
      tma/             Mini App: authenticated per request with Telegram initData
      datasets/        dashboard export (cookie session)
      bot/             Telegram webhook
  features/tma/        Mini App client code: Telegram provider, React Query hooks, UI
  lib/                 code shared by client and server: zod schemas, DTO types, API client
  server/              server-only
    auth/              web session (JWT cookie), DAL, Telegram initData auth
    queries/           cached reads ('use cache' + cacheTag)
    services/          labeling engine (task batches, votes, payouts, consensus)
    actions/           dashboard Server Actions
    telegram/          bot, commands, initData validation
  proxy.ts             optimistic redirects only; real checks live in server/auth/dal.ts
```

**Two kinds of requests**

| | Auth | Caching |
|---|---|---|
| Public (open datasets, dataset questions, landing stats) | none | `'use cache'` + tags, part of the prerendered shell |
| Mini App (`/api/tma/*`) | `Authorization: tma <initData>`, HMAC-checked on every request | `private, no-store` |
| Dashboard pages / actions / export | httpOnly JWT cookie, re-checked in the DAL against the DB | owner data cached per `ownerId`; balances never cached |

The Mini App uses a header rather than cookies because Telegram Web runs it in a cross-site iframe, where cookies are unreliable.

**Money** is stored as integer cents. Every balance change writes a `LedgerEntry` in the same transaction, so a user's `balanceCents` always equals the sum of their ledger. Each vote debits the dataset owner (only if they can afford it) and credits the evaluator. A dataset that runs out of budget pauses itself.

**Votes** are immutable, one per evaluator per task. A conditional update claims each vote slot, so concurrent evaluators can't push a task past its required answers.

**Cache invalidation**: tags are defined in `server/cache-tags.ts`. Server Actions call `updateTag` (read-your-own-writes). Route handlers call `revalidateTag(tag, 'max')`, and only when a task completes, not on every vote.

## Setup

```bash
cp .env.example .env    # fill in the values
npm install
npm run db:migrate
npm run db:seed         # dev only: wipes data, creates client@example.com / password123
npm run dev
```

### Existing database (created with `prisma db push`)

The original database has no migration history. Mark the baseline as applied once, then deploy the hardening migration. **Back up first**: it converts balances from dollars to cents and statuses to enums.

```bash
npx prisma migrate resolve --applied 0_baseline
npx prisma migrate deploy
```

### Telegram

1. Create a bot with @BotFather and set `BOT_TOKEN` and `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`.
2. Set `NEXT_PUBLIC_APP_URL` (https) and a random `TELEGRAM_WEBHOOK_SECRET`.
3. After each deploy: `npm run telegram:setup` registers the webhook, commands and menu button.
4. Optional: in @BotFather, set the bot's Main Mini App to `<APP_URL>/app` to enable `t.me/<bot>?startapp=ds_<datasetId>` links.

For local Mini App work in a normal browser, set `NEXT_PUBLIC_TMA_DEV_MOCK=true`. It signs you in as the seeded dev evaluator. It is ignored in production. To test inside Telegram, expose the dev server over https (for example with `cloudflared`) and point the bot at it.

## Scripts

| | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` / `lint` / `test` | TypeScript, ESLint, Vitest |
| `npm run db:migrate` | apply migrations |
| `npm run telegram:setup` | register webhook, commands, menu button |
