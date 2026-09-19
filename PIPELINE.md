# PIPELINE — model seams. Do not merge them.

Virgil has **separate model call sites**. They must never be confused, cross-wired, or consolidated behind one shared `llm()` helper.

## Seams

| Seam | File | Job | Must not do |
| ---- | ---- | --- | ----------- |
| **Read / classify** | `src/ai/seams/read.ts` | Intent, preference extract, place signals, structured events | Send messages; book; own money/time gates |
| **Compose** | `src/ai/seams/compose.ts` | Friend voice in GC/DM | Hard constraints; scoring; approval expiry |
| **Tool planner** (optional, later) | inside TripAgent tools | Choose Browserbase ops | Bypass approval; merge into Read |

Provider wiring lives only in `src/ai/provider.ts`. Seams import the provider — they do not share call sites.

## Data flow (one direction)

```text
VirgilEvent ─▶ read.ts (classify / extract) ─▶ structured signals + intent
                                                    │
                         deterministic code          │
                    (memory, constraints, score,     │
                     should_respond, approvals)      │
                                                    ▼
                                         compose.ts ─▶ outbound copy
                                                    │
                                                    ▼
                                              linq.send
```

## Env vars (separate — do not alias)

| Seam | Vars |
| ---- | ---- |
| Read | `MODEL_READ_API_KEY`, `MODEL_READ_MODEL`, optional `MODEL_READ_BASE_URL` |
| Compose | `MODEL_COMPOSE_API_KEY`, `MODEL_COMPOSE_MODEL`, optional `MODEL_COMPOSE_BASE_URL` |

Blank keys → fixture / canned paths for local dev (see `.env.example`).

## Why this exists

A prior project (Tabi) cross-wired models into one helper and broke sponsor seams. Keep Read and Compose independent even if both temporarily use the same vendor.
