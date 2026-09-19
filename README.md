# Virgil

AI group-trip companion for Hack the North 2026.

> Travel apps plan trips. Virgil runs them.

Virgil lives in your vacation **iMessage** group chat (Linq), remembers everyone on **Cloudflare**, and acts on the real web with **Browserbase**.

## Status

**Repo skeleton only.** Phase 0 feasibility spikes not started. See `PROJECT.md`.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

## Docs

| Start here | |
| ---------- | - |
| [`PROJECT.md`](./PROJECT.md) | Product + architecture entry |
| [`REPO_MAP.md`](./REPO_MAP.md) | Where code lives |
| [`PIPELINE.md`](./PIPELINE.md) | Model seams |
| [`AGENT_RUNTIME.md`](./AGENT_RUNTIME.md) | TripAgent turn loop |
| [`DEPLOY.md`](./DEPLOY.md) | Wrangler / secrets |
| [`AGENTS.md`](./AGENTS.md) | Agent working rules |

Full product + engineering plans: `docs/`.

## Stack

TypeScript · Cloudflare Workers + Agents · Linq · Browserbase · Zod · Vitest
