# AGENT_RUNTIME — TripAgent turn loop

Runtime plan for the durable trip agent. Product truth stays in `PROJECT.md` / `docs/`. This file is the supervisor equivalent: what is **code** vs **LLM**, and what gates a send.

## One agent, modules

One `TripAgent` per trip (`TripAgent<trip-id>`). Not twelve fake agents.

| Concern | Owner |
| ------- | ----- |
| Webhook dedupe, identity, hard constraints, scoring, split threshold, approval expiry, `should_respond`, cooldown | **Code** |
| Classify intent, extract prefs/places, compose friend copy | **LLM seams** |
| Multi-step disruption / booking with human wait | **Cloudflare Workflows** (`waitForEvent`) |

## Turn loop (inbound)

```text
1. Receive VirgilEvent (already verified + deduped by server.ts)
2. Persist chat_event
3. read.classify → intent (CASUAL | DISRUPTION | APPROVAL | …)
4. If low confidence → conversation only (no tools)
5. Memory upsert (visibility: private | group_safe)
6. should_respond?  — code gate + GC cooldown (default: often silent)
7. If DISRUPTION / planning need → start or continue workflow
8. If proposal pending + reaction → approvals.validate
9. compose reply (only if should_respond or workflow step requires it)
10. linq.send / react
```

## Send-gate rules

- Prefer silence over chatter in the GC.
- Do not re-ask the same onboarding field (`open_asks` / answered-field memory).
- Consequential actions need an approval bound to a proposal message id + expiry.
- Reaction webhooks map to approval **only** for an active proposal.
- Money / irreversible checkout: stop at `CHECKOUT_READY` for MVP unless explicit yes.

## Workflows (stubs)

| Workflow | Purpose |
| -------- | ------- |
| `Onboarding` | Private 5-question DM flow |
| `Replan` | Cancel → research → propose → waitForEvent(approval) → execute |
| `BrowserAction` | Approved Browserbase booking / checkout prep |

## Phase status

Scaffold only. Phase 0 spikes next — see `docs/engineering-plan.md` §80.
