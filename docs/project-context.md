# Japlan / Virgil — Project Context

## Product

**Virgil** is an AI group-trip companion: the friend in the vacation group chat that remembers everyone, handles logistics, and keeps the trip moving as reality changes.

Category: **AI group-trip companion** — not “vacation planner,” itinerary generator, or travel chatbot.

Core thesis: *Google Maps finds places. Trip planners make itineraries. Virgil manages the humans.*

## Locked sponsor tracks (HTN)

| Priority | Sponsor | Role |
| -------- | ------- | ---- |
| #1 | **Linq** | Entire UX — iMessage GC + private DMs |
| #2 | **Browserbase** | Hands on the web — live search, availability, booking |
| #3 | **Cloudflare** | Persistent brain — durable trip agent, state, workflows |
| #4 optional | **Composio** | Convenience only (Gmail/Calendar) if it helps the demo |

Do not distort architecture for Composio or other tracks.

## Architecture sketch

```
Linq (iMessage events)
  → Cloudflare Worker
    → Trip Agent (Durable Object) per trip
         people / itinerary / game state
         → LLM + tools
         → Browserbase for real-web actions
```

One durable agent per trip: `TripAgent<trip-id>`.

## Hackathon vertical slice (must be real)

1. Trip created in iMessage GC  
2. Virgil DMs 3–4 members  
3. Learns distinct preferences  
4. Members share places/messages  
5. Memory persists with confidence  
6. Loose itinerary (anchors + flex)  
7. Live disruption (activity cancelled)  
8. Constraint-aware replan  
9. Browserbase finds live replacements  
10. Dynamic party split proposed  
11. Conversational approval  
12. Booking/checkout prep executed  
13. Trip state updated  
14. Sidequest unlocked  
15. Photo proof in GC  
16. XP updated  

Judging centerpiece: **disruption → live Browserbase search → party split → act**.

## Product phases (one continuous experience)

- **Before:** learn people, capture GC ideas, loose plan, book anchors  
- **During:** state, disruptions, live options, splits, execution, sidequests  
- **After:** Trip Wrapped (memorable ending; secondary to during-trip demo)

## Design rules

- Memory with **confidence** and sources; don’t overclaim low-confidence inferences  
- Itineraries are **anchors + flex windows**, not 30-minute schedules  
- Prefer intelligent **party splits** over mediocre group compromises  
- Game/XP is a **delight layer**, not the technical core  
- Never prominent “vacation planner” framing

## Demo line

> Travel apps plan trips. Virgil runs them.

## Build order

Full phased backlog lives in [engineering-plan.md](./engineering-plan.md).

Start at **Phase 0** (feasibility spikes). Do not skip ahead. P0 path: Linq ↔ TripAgent ↔ memory ↔ Browserbase ↔ disruption/replan ↔ approval/action. Split + sidequests are P1 after that works.
