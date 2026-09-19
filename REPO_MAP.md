# REPO_MAP — one line per module, who calls what

## Layout

```text
src/
  server.ts                 Worker entry: verify → dedupe → normalize → TripAgent
  agents/TripAgent.ts       One durable Cloudflare Agent per trip
  workflows/                Replan, BrowserAction, Onboarding (CF Workflows)
  linq/                     Webhook verify, event normalize, send, reactions
  browser/                  BrowserProvider + Stagehand; live → fixture → stub
  memory/                   Agent SQL tables + confidence signals
  planning/                 Score / split / TripContext (deterministic)
  approvals/                Proposal bind + expiry (deterministic)
  quests/                   Delight layer (after P0)
  ai/
    provider.ts             Swap models without merging seams
    seams/read.ts           Classify / extract structured events
    seams/compose.ts        GC/DM friend voice
  shared/                   Zod types, VirgilEvent, constants
data/                       Linq + Browserbase fixtures for offline demo
tests/                      Vitest
_graveyard/                 Retired spikes — never imported
```

## Live runtime

| Module | What it does | Imported by |
| ------ | ------------ | ----------- |
| `src/server.ts` | Worker fetch handler. Linq webhook: verify → dedupe `event_id` → normalize → route to TripAgent. | Wrangler entry |
| `src/agents/TripAgent.ts` | Durable trip brain. Store event, classify, memory, `should_respond`, tools/workflows. | `server` |
| `src/linq/` | Transport only — verify signatures, normalize to `VirgilEvent`, send text/reactions. No scoring or booking. | `server`, TripAgent |
| `src/browser/` | `BrowserProvider`: searchActivities, validateAvailability, prepareBooking, executeApprovedBooking. Fail-open. | TripAgent, workflows |
| `src/memory/` | Trips, members, profiles, preference_signals, places, itinerary, reservations, chat_events. | TripAgent |
| `src/planning/` | Hard constraints, groupScore, together-vs-split optimizer. Pure deterministic code. | TripAgent |
| `src/approvals/` | Bind proposal message id + expiry; map reactions to approval. | TripAgent, linq |
| `src/workflows/` | Multi-step durable jobs (replan waitForEvent, browser action). | TripAgent |
| `src/ai/seams/read.ts` | Intent classify + extract. Must not send or book. | TripAgent |
| `src/ai/seams/compose.ts` | Friend voice copy. Must not own hard constraints or money. | TripAgent |
| `src/ai/provider.ts` | Model client factory per seam env vars. | seams |
| `src/quests/` | Sidequest / XP (P1 after core). | TripAgent |
| `src/shared/` | Shared Zod schemas and constants. | everyone |

## Fail-open contracts

- **Browserbase** never throws into the TripAgent hot path — return `null` / fixture / stub.
- **Linq send** failures log + retry; do not crash the turn.
- **Missing model key** → fixture classify / canned compose for local `wrangler dev`.
- Preference scoring, hard constraints, approval expiry, split threshold = **local deterministic code**. No network call may break a number or a gate.

## Env owners

See `.env.example`. Groups: Linq, Cloudflare, Browserbase, Model (Read), Model (Compose), optional Composio.

## Data flow

```text
iMessage → Linq webhook → server.ts
  verify → dedupe(event_id) → normalize(VirgilEvent)
       → TripAgent
            store chat_event
            read.classify / read.extract
            memory upsert (confidence + visibility)
            should_respond? (code gate + cooldown)
            maybe start workflow (Replan / BrowserAction)
            compose reply → linq.send
                 ↕
            browser.searchActivities (live → fixture → stub)
            planning.score / split
            approvals.bind → wait for 👍
```

Inbound recommendation path: TripContext → Browserbase → hard filters → member scores → group opt / split → Linq proposal.

Booking path: proposal → approval validate → Browserbase execute → persist → notify.
