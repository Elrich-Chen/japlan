# DEPLOY — Wrangler / Workers / secrets

## Local

```bash
cp .env.example .env   # fill REQUIRED keys when ready
npm install
npm run sync:dev-vars  # copy APP_NAME + LINQ_* into .dev.vars (no values printed)
npm run dev            # wrangler dev
```

### Phase 0 inbound (Linq → Worker)

1. `npx wrangler login`
2. `npm run sync:dev-vars` — until `LINQ_WEBHOOK_SECRET` is set, this forces `LINQ_SKIP_VERIFY=1`
3. `npm run dev` — local Worker on `:8787`
4. Public URL: `cloudflared tunnel --url http://localhost:8787` (or `npx wrangler tunnel` if available) → note the `https://…` host
5. Subscribe Linq:

```bash
WEBHOOK_URL=https://<tunnel-host>/webhooks/linq npm run linq:webhook
```

6. Paste the printed `signing_secret` into `.env` as `LINQ_WEBHOOK_SECRET`, set `LINQ_SKIP_VERIFY=0`, then `npm run sync:dev-vars` and restart `npm run dev`

Webhook path: `POST /webhooks/linq` (script appends `?version=2026-02-03`).

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

1. Register Partner API webhook to `https://<worker>/webhooks/linq` (`npm run linq:webhook` or dashboard)
2. Verify signature with `LINQ_WEBHOOK_SECRET`
3. Dedupe on `event_id` before routing to TripAgent
4. Outbound smoke: `npm run linq:send`

## Browserbase

Live Stagehand sessions for demos. Keep fixture extracts under `data/` so the demo survives CAPTCHA / timeout.

## Checklist before a live demo

- [ ] Linq in/out (GC + DM + reaction)
- [ ] TripAgent survives Worker restart
- [ ] Browserbase live extract OR fixture fallback proven
- [ ] Approval reaction path works
- [ ] No secrets in git
