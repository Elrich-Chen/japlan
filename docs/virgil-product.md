# VIRGIL — Product Definition

## The single sentence

> **Virgil is the AI friend in your vacation group chat that learns everyone, turns loose ideas into a trip, and keeps coordinating the group as reality changes.**

Not: AI itinerary generator. Not: gamified travel app. Not: travel chatbot.

Core difference:

> **Google Maps helps you find places. Trip planners make itineraries. Virgil manages the humans.**

---

## End-to-end: three phases, one experience

```text
BEFORE                           DURING                         AFTER

"we should go somewhere"        "wtf do we do now?"           "how was the trip?"
        │                              │                              │
        ▼                              ▼                              ▼
 Learn everybody                Understand current state         Trip Wrapped
 Capture GC ideas               Handle disruptions              Awards
 Resolve preferences            Find live options               Stats
 Build loose plan               Split group when useful         Memories
 Book anchors                   Execute actions                 Shared recap
        │                              │                              │
        └────────── SAME VIRGIL MEMORY THROUGHOUT ───────────────────┘
```

- Planning gets people into the product  
- Live-trip wins the demo  
- Wrapped gives the memorable ending  

---

## 1. Before — out of the GC

Someone adds Virgil’s Linq number to a group conversation. Virgil joins in-character, then privately DMs each participant.

### Private onboarding (five conversational prompts, not a survey)

| Dimension   | Example                                    |
| ----------- | ------------------------------------------ |
| Interests   | food, culture, nightlife, nature, shopping |
| Budget      | comfortable daily spending                 |
| Pace        | relaxed ↔ chaotic                          |
| Constraints | dietary, mobility, hard-no activities      |
| Must-have   | one thing they’d regret missing            |

Initial person model example:

```json
{
  "elrich": {
    "interests": {
      "food": 0.92,
      "nightlife": 0.81,
      "culture": 0.55
    },
    "budget_per_day": 110,
    "pace": "chaotic",
    "constraints": [],
    "must_have": "eat somewhere locals actually go"
  }
}
```

---

## 2. Ongoing learning (memory)

Virgil remembers the *group* like a friend in the conversation for months: place submissions, sentiment, constraints from messages, explicit dislikes.

### Memory with confidence

Each preference has confidence + source (onboarding, GC message, reaction, inference). Low-confidence inferences must not be overweighted or stated as fact.

---

## 3. Loose itinerary

No 30-minute schedules. Structure:

### Anchors

Booked restaurant, major attraction, train, concert, event, reservation.

### Flex windows

Intentionally open periods where Virgil’s magic happens.

Example:

```text
TOKYO — DAY 2

10:00      Tsukiji Market       [ANCHOR]
12:30–4    explore east Tokyo   [FLEX]
5:30       Shibuya              [ANCHOR]
8:30       dinner               [RESERVATION]
10:30+     open                 [FLEX]
```

---

## 4. During — live product

Virgil uses current time, group, preferences, prior places, visits, reservations, and constraints — then researches with **real browser** (Browserbase), not hallucinated suggestions.

---

## 5. Dynamic Party Split (flagship)

Optimize for *these four different humans*, not one compromise activity everyone rates 6/10. Propose teams, timings, reconvene point; get conversational approval.

---

## 6. Execution

On approval: Browserbase navigates booking sites, selects slots/people, prepares checkout; trip state updates. Money → explicit yes/no before final checkout. Agent acts, not link dumps.

---

## 7. Demo centerpiece — disruption

Cancelled activity → inspect trip state → constraints → Browserbase search → optimize group (often split) → propose → approve → execute.

---

## 8. Cloudflare role

One durable brain per trip (Agents SDK / Durable Object): people, itinerary, game state, workflows, recoverable multi-step jobs and human approvals.

Narrative: *Cloudflare isn’t hosting a landing page — it’s the persistent brain of every vacation.*

---

## 9–10. Sidequests & game state

Delight layer after utility is proven. GC as multiplayer board (photo proof → XP). Leaderboard per trip. Do not overengineer.

---

## 11. After — Trip Wrapped

Stats, awards (MVP, Chaos Merchant, etc.), playful group-compatibility score. Endpoint of the journey; secondary to live-trip demo.

---

## Sponsor narrative

| Sponsor | What the judge remembers |
| ------- | ------------------------ |
| **Linq** | Turned an iMessage GC into a multiplayer AI interface (many humans ↔ one shared agent ↔ physical world) |
| **Browserbase** | Browser agent saved a live group trip when the plan broke |
| **Cloudflare** | Every vacation is a long-lived Cloudflare Agent that evolves with the group |
| **Composio** | Optional #4 — only if it materially helps; do not chase |

---

## Hackathon vertical slice (16 beats)

Create trip in GC → DM onboarding → distinct prefs → GC memory → loose itinerary → disruption → constraints → live Browserbase replacements → party split → approve → execute booking → state update → sidequest → photo proof → XP.

Prefer one flawless slice over fifty half features.

---

## Two-minute judging story

0:00 Problem (GC is the trip; one person becomes manager)  
0:15 Virgil in real iMessage  
0:25 Memory from DMs + GC  
0:40 Disruption text  
0:45 Cloudflare wakes agent; Browserbase on real web  
1:05 Party split proposal  
1:25 Approval → real browser action + state  
1:40 Sidequest delight  
1:55 *Travel apps plan trips. Virgil runs them.*

---

## Positioning

> ### AI group-trip companion
>
> The friend in your group chat who remembers everyone, handles the logistics, and keeps the trip moving.

Do not call it a “vacation planner” anywhere prominent.
