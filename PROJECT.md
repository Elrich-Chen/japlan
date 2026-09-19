# Virgil — Project Reference

**Read this first.** Product, architecture, and build order live here (and in `docs/`). Prefer these files over assumptions.

## One sentence

> Virgil is the AI friend in your vacation group chat that learns everyone, turns loose ideas into a trip, and keeps coordinating the group as reality changes.

Demo line: **Travel apps plan trips. Virgil runs them.**

## Category

**AI group-trip companion** — not an itinerary generator, vacation planner, or travel chatbot.

## Sponsors (locked)

| Priority | Sponsor | Role |
| -------- | ------- | ---- |
| #1 | **Linq** | Entire UX — iMessage GC + private DMs |
| #2 | **Browserbase** | Hands on the web — live search, availability, booking |
| #3 | **Cloudflare** | Persistent brain — durable trip agent, state, workflows |
| #4 optional | **Composio** | Only if it materially helps the demo |

Do not distort the product for extra tracks.

## Architecture

```text
iMessage GC → Linq webhooks → Cloudflare Worker
  → TripAgent (one durable agent per trip)
       memory / planning / approvals (deterministic)
       → LLM seams (read vs compose — see PIPELINE.md)
       → Browserbase (live → fixture → stub)
```

## Source of truth (doc ladder)

| File | Purpose |
| ---- | ------- |
| **This file** | Entry point agents must open first |
| [`docs/virgil-product.md`](./docs/virgil-product.md) | Full product definition |
| [`docs/engineering-plan.md`](./docs/engineering-plan.md) | Master plan, stack, phased backlog |
| [`docs/project-context.md`](./docs/project-context.md) | Slice, sponsors, design rules |
| [`docs/repo-lessons-from-tabi.md`](./docs/repo-lessons-from-tabi.md) | Repo / agent workflow conventions |
| [`REPO_MAP.md`](./REPO_MAP.md) | Module ownership + data flow |
| [`PIPELINE.md`](./PIPELINE.md) | Model seams — do not merge |
| [`AGENT_RUNTIME.md`](./AGENT_RUNTIME.md) | TripAgent turn loop / send-gate |
| [`DEPLOY.md`](./DEPLOY.md) | Wrangler, secrets, webhooks |
| [`AGENTS.md`](./AGENTS.md) | Cursor/agent working rules |

If a change contradicts these docs, **flag it** — do not silently diverge.

## Build order

Start at **Phase 0** (feasibility). Do not skip ahead.

P0 path: Linq ↔ TripAgent ↔ memory ↔ Browserbase ↔ disruption/replan ↔ approval/action.

See `docs/engineering-plan.md` §80. Cut Wrapped, Composio, dashboards, hotels/flights infra until P0 is green.

## Non-goals

Expedia clone, maps UI, Splitwise, social network, agency marketplace, GPS-first design.
