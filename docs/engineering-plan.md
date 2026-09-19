# VIRGIL — Hack the North 2026 Master Plan

Master product, architecture, sponsor strategy & implementation plan.

---

# 0. Executive Summary

## Product

**Virgil is the AI friend inside your vacation iMessage group chat that learns everyone, turns loose ideas into an executable trip, and keeps coordinating the group when reality changes.**

Key distinction:

> **Travel apps plan trips. Virgil runs them.**

**Before:** join GC, private onboarding, watch conversation, remember ideas/opinions, flexible itinerary (anchors + flex).

**During:** live context, live web search, disruptions, stay vs split, booking with approval, sidequests/game state.

**After:** optional Trip Wrapped.

Not an itinerary generator — a **persistent multi-human coordination agent for real-world travel**.

---

# 1. Hackathon Objective

### Sponsor targets

1. **Linq** — PRIMARY (Best Use of Linq)
2. **Browserbase** — SECOND PRIMARY
3. **Cloudflare** — THIRD PRIMARY (Best Agent with a Brain)
4. **Composio** — OPTIONAL only if not bolted on

Do not change the product merely to qualify for extra tracks.

---

# 2. Why These Three Sponsors

```text
iMessage GC → LINQ (interface) → VIRGIL on CLOUDFLARE (memory/state/workflows)
  → BROWSERBASE → real web → PHYSICAL WORLD
```

- **Linq** = where Virgil lives
- **Cloudflare** = what Virgil remembers / how it stays alive
- **Browserbase** = how Virgil touches the real world

Removing any one fundamentally changes the product.

---

# 3–6. Linq

Linq asks for utilities/experiences in iMessage without forcing another app. GC is the application.

**Judge memory:** “They turned an iMessage group chat into a multiplayer AI interface.”

Innovation: many humans ↔ one shared agent ↔ physical world (not 1:1 chatbot).

**Required demos:** group + DMs, text, webhooks, reactions, typing if useful, photo/media, conversational confirmation.

**Killer demo:** cancellation → research → party split → 👍 approval → browser acts → sidequest.

---

# 7–9. Browserbase

Visible in main demo. Live availability, booking prep (stop before irreversible without approval), disruption recovery.

**Judge memory:** “Their browser agent rescued an actual group trip when the original plan failed.”

Show Browserbase live view ~10–15 seconds.

```typescript
interface ActivityCandidate {
  name: string;
  category: string;
  url: string;
  startTimes: string[];
  pricePerPerson?: number;
  durationMinutes?: number;
  address?: string;
  availabilityConfidence: number;
}
```

---

# 10–12. Cloudflare

Memory, tools, state, workflows, real-world actions — Cloudflare as backend brain.

**Judge memory:** “Every vacation is a long-lived Cloudflare agent that evolves alongside the group.”

One `VirgilTripAgent` per trip: persistent identity, SQL state, group memory, preferences, itinerary, workflows, game state. Linq events wake the agent; it does not rebuild from scratch.

---

# 13–17. Product thesis & onboarding

Harder problem: *What should these different people do together, given what is happening right now?* — sometimes the answer is **split**.

**Private onboarding (5 questions):** interests (pick 3), spending, pace, constraints (NL), must-do (NL).

**Privacy:** private signals not auto-repeated into GC; use `visibility: "private" | "group_safe"`.

---

# 18–19. Memory & data model

Structured persistent memory (not just LLM history): members, preference signals, places, itinerary, reservations, current state, chat events, approvals, quests, XP.

### Tables

- **trips** — id, linq_chat_id, name, destination, timezone, dates, status (PLANNING|ACTIVE|COMPLETED|ARCHIVED)
- **members** — trip_id, linq_handle, display_name, onboarding_status
- **member_profiles** — pace, budgets, mobility/dietary, private_summary, group_safe_summary
- **preference_signals** — dimension, value, confidence, source_type, visibility
- **places** / **place_signals**
- **itinerary_items** — ANCHOR|FLEX|ACTIVITY|TRANSIT|MEETUP
- **reservations**, **chat_events**, **action_approvals**, **quests**, **quest_submissions**

---

# 20–21. Preference engine

Signals with confidence by source (onboarding 1.0 → LLM inference 0.25). Aggregate weighted scores; clamp [-1,1]. Hard constraints checked **before** scoring.

---

# 22–29. Places, itinerary, scoring, split

Silent memory on link shares often. Anchors + flex windows only.

**TripContext** compact snapshot for reasoning.

Pipeline: request → constraints → Browserbase → extract → hard filters → member scoring → group optimization → proposal.

**groupScore** ≈ 0.40 avg + 0.25 min + 0.15 feasibility + 0.10 savedInterest + 0.10 novelty.

**Party split:** scoreTogether vs scoreSplit (partitions, coordination/travel/reunion penalties); split only if above threshold + feasible reconvene + no unwilling members.

---

# 30–35. Disruption, workflows, approvals

Centerpiece: cancel → classify → state → Browserbase → filter → optimize → propose → approve → execute → persist.

**ReplanWorkflow** with step.do + waitForEvent for approval.

Consequential actions need approval bound to proposal message ID + expiry. Reaction webhooks map to approval only for active proposal.

---

# 36–38. Browserbase architecture

`BrowserProvider`: searchActivities, validateAvailability, prepareBooking, executeApprovedBooking.

Demo-safe: primary real provider + secondary + fallback that still uses Browserbase. Stop at CHECKOUT_READY for MVP payments.

---

# 39–42. Linq webhooks

POST /webhooks/linq → verify → **dedupe event_id (required)** → normalize → resolve trip → TripAgent.

Normalize to VirgilEvent types. Classify intent (CASUAL, DISRUPTION, APPROVAL, …); low confidence → conversation only.

---

# 43–46. Agent & voice

One TripAgent with modules (not 12 fake agents). LLM for classify/extract/copy/tools; deterministic code for money, time, approvals, identity, hard constraints.

Voice: concise, human friend, often silent. `should_respond` heuristics.

---

# 47–51. Game & Wrapped

Secondary delight. Contextual quests + photo proof. Wrapped is stretch / end of lifecycle, not MVP-required.

---

# 52. Definition of Done (16 beats)

iMessage → multi-member → private onboard → prefs persist → GC memory → loose plan → disruption → TripAgent state → live Browserbase → score → together vs split → iMessage proposal → approve → browser action → state update → sidequest.

If reliable: **stop adding core; polish demo.**

---

# 53. Tech stack

| Layer | Choice |
| ----- | ------ |
| Language | TypeScript |
| Backend | Cloudflare Workers + Agents SDK |
| Persistence | Agent SQL; optional R2; avoid Vector DB initially |
| Orchestration | Cloudflare Workflows |
| Messaging | Linq Partner API v3 |
| Browser | Browserbase + Stagehand |
| Validation | Zod |
| Tests | Vitest |

Model behind `ModelProvider` abstraction.

---

# 54. Repo layout

```text
virgil/
├── src/
│   ├── server.ts
│   ├── agents/TripAgent.ts
│   ├── workflows/ (Replan, BrowserAction, Onboarding)
│   ├── linq/ browser/ memory/ planning/ approvals/ quests/ ai/ shared/
├── tests/
├── wrangler.jsonc
├── package.json
└── README.md
```

---

# 55–57. Event flows

Inbound: iMessage → Linq webhook → Worker (verify/dedupe/normalize) → TripAgent (store/classify/memory/reply/workflow).

Recommendation: context → Browserbase → filters → scores → split optimizer → Linq.

Booking: proposal → approval validate → Browserbase → persist → notify.

---

# 58–79. Reliability & edge cases

Design for: webhook dupes/delays, browser CAPTCHA/timeouts/slot loss, LLM malformed output, partial split booking success, approval expiry, out-of-order messages, partial onboarding, mid-trip join/leave, hard budget conflict, accessibility UNKNOWN, price change re-approval, no GPS (use neighborhood/NL), trip timezone, minor currency units, DM privacy, over-talking, Linq sandbox group-add (verify early; API-create group as fallback).

Payment MVP: prefer CHECKOUT_READY over real money.

---

# 80. Phased backlog (dependency ordered)

| Phase | Objective | Exit |
| ----- | --------- | ---- |
| **0** Feasibility spikes | Credentials + Linq in/out, group/reactions/media, Browserbase extract, CF Agent persist, Workflow resume | All green or fallback known |
| **1** Comm skeleton | Webhook → TripAgent → reply; survives restart | “virgil hello” works |
| **2** Trip + members | 4 people, DM vs GC, same trip | Identity solid |
| **3** Private onboarding | 5 Qs → distinct profiles | Different personalities |
| **4** Passive memory | Classifier, places, silence | Remembers / avoids museums |
| **5** Basic planning | Anchors + flex | Loose itinerary |
| **6** Browserbase live | Real providers + fallback | Actual 3pm options |
| **7** Disruption + replan | **Wins the hackathon** | Cancel → preserve dinner |
| **8** Party splitting | Signature feature | Independently recommends split |
| **9** Approval + action | Agent, not recommender | 👍 → browser → state |
| **10** Game layer | After core works | Sidequest + XP |
| **11** Sponsor polish | Each judge sees their tech | Narratives ready |
| **12** Demo hardening | No new features | Scripted 2/4 min |
| **13** Stretch only | Wrapped, Composio, etc. | Only if above done |

---

# 81. Priority when time-limited

**P0:** Linq, TripAgent, multi-user, onboarding, memory, Browserbase, disruption, replan, group opt, approval, action.

**P1:** Split, reaction approvals, personality, sidequest, live view, durable workflow.

**P2:** Image quests, leaderboard, Wrapped, calendar, weather.

**Cut first:** hotels, flights, Splitwise, dashboard, maps UI, payments infra, GPS, complex recs.

---

# 82–84. Parallel roles & tests

A Linq · B Cloudflare · C Browserbase · D Planning/product. Integrate early.

Unit: prefs, optimizer, approvals. Integration: Linq webhook, Browser extract, workflow approval. Demo cases A–H (recommend, conflict/split, cancel, browser fail, no avail, approval expire, dup webhook, partial onboard).

---

# 85–88. Metrics & sponsor narratives

App switches avoided; decisions resolved; disruptions replanned; fairness vs naive average.

- Linq: *Didn't put a chatbot in iMessage — turned iMessage into multi-human agent UI.*
- Browserbase: *From AI recommendation to actually available and actionable.*
- Cloudflare: *Not where we deployed — Virgil's memory and nervous system.*

---

# 89–95. Composio, endpoints, demo, principles

Composio optional. Hackathon endpoint = live disruption reorg via iMessage + memory + browser. Full product = entire trip lifecycle ending in Wrapped.

**2-min demo:** problem → Virgil memory → cancel → Browserbase live → split → 👍 → action → sidequest → “Travel apps plan trips. Virgil runs them.”

Sponsor variants: Linq stays in iMessage; Browserbase jumps to disruption+browser; Cloudflare shows Agent/SQL/workflow/approval.

**Non-goals:** Expedia/Maps/Splitwise/Airbnb/agency/marketplace/social network.

**Product principle:** Does this help coordinate real humans through a changing real-world trip?

**Sponsor principle:** If we remove this sponsor's tech, does a meaningful part stop working?
