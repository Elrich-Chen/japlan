# DEPLOY — Wrangler / Workers / secrets

## Local

```bash
cp .env.example .env   # fill REQUIRED keys when ready
npm install
npm run dev            # wrangler dev
```

Webhook URL for Linq (local tunnel): point Linq Partner API at your tunnel → `POST /webhooks/linq`.

## Cloudflare

```bash
npx wrangler login
npm run deploy
```

Set secrets (never commit):

```bash
npx wrangler secret put LINQ_WEBHOOK_SECRET
npx wrangler secret put LINQ_API_KEY
npx wrangler secret put BROWSERBASE_API_KEY
npx wrangler secret put BROWSERBASE_PROJECT_ID
npx wrangler secret put MODEL_READ_API_KEY
npx wrangler secret put MODEL_COMPOSE_API_KEY
```

## Config

- Worker + Agent bindings: `wrangler.jsonc`
- Durable trip state: Agent SQL (no Vector DB in MVP)
- Optional R2 later for media / fixtures

## Linq

1. Register Partner API webhook to `https://<worker>/webhooks/linq`
2. Verify signature with `LINQ_WEBHOOK_SECRET`
3. Dedupe on `event_id` before routing to TripAgent

## Browserbase

Live Stagehand sessions for demos. Keep fixture extracts under `data/` so the demo survives CAPTCHA / timeout.

## Checklist before a live demo

- [ ] Linq in/out (GC + DM + reaction)
- [ ] TripAgent survives Worker restart
- [ ] Browserbase live extract OR fixture fallback proven
- [ ] Approval reaction path works
- [ ] No secrets in git
