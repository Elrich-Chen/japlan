# Repo lessons from Tabi (`alextgu/hack-the-6ix`)

Transferable **engineering / repo / agent-workflow** patterns for Virgil. Product and sponsor stack stay locked (Linq + Cloudflare Agents + Browserbase). Do not copy Telegram Mini App, Mongo-as-brain, Solana, or Python/LangGraph as product choices.

Source inspected: https://github.com/alextgu/hack-the-6ix (top-level docs, `.claude/agents/`, `app/`, `_graveyard/`, `.env.example`).

---

## 1. What Tabi does well

- **Doc ladder with a single source of truth** — `PROJECT.md` = product/architecture truth; `REPO_MAP.md` = one-line-per-module + who imports whom; `PIPELINE.md` = non-negotiable model seams; `SUPERVISOR_PLAN.md` = runtime agent behavior; `DEPLOY.md` + README = run/deploy. Agents are told to prefer `PROJECT.md` over assumptions (`claude.md`).
- **Layered `app/` ownership** — `bot/` (transport + handlers), `agents/` (reasoning), `integrations/` (external APIs), `api/`, `render/`, `core/` (state + pure engines). Clear blast radius.
- **Fail-open integrations** — every optional provider degrades; demo never dies. Mongo “never raises” (`app/integrations/db.py`); flights live → fixture → mock (`flights.py`); hotels live → cache → sample (`hotels.py`); voice → text; missing token → API-only mode.
- **Annotated `.env.example`** — REQUIRED vs OPTIONAL grouped by owner module; blank-safe paths documented next to each var.
- **Deterministic gate, LLM workers** — supervisor is code (routing, cooldowns, send-gate); models do extract + voice only (`SUPERVISOR_PLAN.md`, `supervisor.py`). Money/stage/send stay debuggable.
- **Model seams that must not merge** — Read (`brain.py` / Gemini) vs Agent (`phoebe.py` / Freesolo). `PIPELINE.md` exists because a prior session cross-wired them.
- **`_graveyard/`** — retired code kept in-tree for archaeology without polluting imports (e.g. `_graveyard/app/agents/gemini.py`).
- **Agentic coding profile** — `.claude/agents/code-worker.md`: small blast radius, verify before done, no hypothetical scaffolding.
- **Repo map as onboarding** — new contributors (human or agent) can answer “where does X live?” from `REPO_MAP.md` without reading everything.

---

## 2. Adopt for Virgil

Map Tabi’s conventions onto our TS / Cloudflare Workers + Agents / Linq / Browserbase stack. Extend (don’t replace) the tree already sketched in `engineering-plan.md` §54.

### Docs to add at repo root (or `docs/` mirrored into README links)

| Tabi | Virgil equivalent | Purpose |
| ---- | ----------------- | ------- |
| `PROJECT.md` | Keep store docs; add root **`PROJECT.md`** that points at / summarizes `docs/virgil-product.md` + `docs/engineering-plan.md` | Single truth agents must open first |
| `REPO_MAP.md` | **`REPO_MAP.md`** | One line per module + importers + data-flow ASCII |
| `PIPELINE.md` | **`PIPELINE.md`** (or `MODEL_SEAMS.md`) | Separate call sites: classify/extract vs compose/copy vs tool-planner — never one shared `llm()` |
| `SUPERVISOR_PLAN.md` | **`AGENT_RUNTIME.md`** | TripAgent turn loop: classify → memory → `should_respond` → tools/workflows; cooldowns; approval gate |
| `DEPLOY.md` | **`DEPLOY.md`** | Wrangler / Workers / secrets; Linq webhook URL; Browserbase key |
| `claude.md` | **`AGENTS.md`** (Cursor) + optional `CLAUDE.md` | Working rules: read PROJECT first; protect P0 loop; flag contradictions |
| `.claude/agents/code-worker.md` | **`.cursor/agents/`** (or Project agent defs) | Implementation worker vs spike/research worker |

### Proposed `virgil/` tree deltas

```text
virgil/
├── PROJECT.md                 # points to product + engineering truth
├── REPO_MAP.md
├── PIPELINE.md                # model seams (do not merge)
├── AGENT_RUNTIME.md           # TripAgent turn / send-gate / workflows
├── DEPLOY.md
├── AGENTS.md                  # Cursor/agent working rules
├── .env.example               # REQUIRED/OPTIONAL by owner (Linq, CF, BB, model)
├── _graveyard/                # retired spikes; not imported
├── data/                      # Browserbase / Linq fixtures for offline demo
├── src/
│   ├── server.ts              # Worker entry: verify → dedupe → normalize → TripAgent
│   ├── agents/
│   │   └── TripAgent.ts       # one durable agent per trip (CF Agents / DO)
│   ├── workflows/             # Replan, BrowserAction, Onboarding
│   ├── linq/                  # webhook verify, event normalize, send, reactions
│   ├── browser/               # BrowserProvider + Stagehand; live → fixture → stub
│   ├── memory/                # SQL tables + confidence signals
│   ├── planning/              # score / split / TripContext (deterministic)
│   ├── approvals/             # proposal bind + expiry (deterministic)
│   ├── quests/                # delight layer (after P0)
│   ├── ai/                    # ModelProvider + seam-specific callers ONLY
│   │   ├── seams/read.ts      # classify / extract structured events
│   │   ├── seams/compose.ts   # GC/DM copy (voice)
│   │   └── provider.ts        # swap models without merging seams
│   └── shared/                # Zod types, VirgilEvent, constants
├── tests/
├── wrangler.jsonc
└── package.json
```

**Convention mirrors**

- Tabi `bot/` → Virgil `linq/` + `server.ts` (transport only; no business logic).
- Tabi `core/` → Virgil `memory/` + `planning/` + `approvals/` (pure / SQL / deterministic).
- Tabi `integrations/` → Virgil `browser/`, optional `composio/` later; each module: never throw into the agent hot path; return `null` / stub / fixture.
- Tabi `agents/supervisor` send-gate → TripAgent `should_respond` + cooldown + approval wait (`waitForEvent`) — **code**, not LLM.
- Tabi `data/*.json` fixtures → keep demo Browserbase extracts + Linq webhook payloads under `data/`.

### Fail-open / env pattern (copy the discipline)

- `.env.example`: section per owner (`# ─── Linq ───`, `# ─── Browserbase ───`, `# ─── Model: Read seam ───`); mark `[REQUIRED]` vs `[OPTIONAL]`; document blank behavior.
- Integrations: `available()` + retry cooldown (Tabi’s Mongo pattern); Browserbase chain: live Stagehand → cached extract → canned `ActivityCandidate[]`.
- Carbon/math lesson adapted: **preference scoring, hard constraints, approval expiry, split optimizer = local deterministic code** — no network call may break a number or a gate.

---

## 3. Agentic development patterns

### What Tabi did

| Artifact | Pattern |
| -------- | ------- |
| `claude.md` | Short; “read PROJECT.md first”; protect core loop; flag contradictions |
| `.claude/agents/code-worker.md` | Opus implementer: verify, small blast radius, no scaffolding, terse report |
| `PIPELINE.md` | Written after a foot-gun; agents must not “helpfully” unify model calls |
| `SUPERVISOR_PLAN.md` | Done/TODO checklist; stages; who is code vs LLM |
| `REPO_MAP.md` | Agents grep this instead of wandering |
| Standalone `__main__` modules | `python -m app.agents.brain` with fixtures when key missing — spikeable without the full bot |

### Mirror for Cursor / Japlan agents

1. **`AGENTS.md` at repo root** — same role as `claude.md`: PROJECT is truth; P0 path from `engineering-plan.md` §80 is sacred; do not add Wrapped/Composio/dashboard until P0 green.
2. **Specialized agent defs** (Project store or `.cursor/agents/`):
   - `code-worker` — implement / refactor / tests (Tabi’s profile almost verbatim).
   - `spike-worker` — Phase 0 feasibility only; write notes + fixtures, not product features.
   - Optional later: `linq-worker`, `browserbase-worker` aligned to parallel roles in engineering-plan §82.
3. **Model seams doc** — explicit table, e.g.:

   | Seam | File | Job | Must not do |
   | ---- | ---- | --- | ----------- |
   | Read / classify | `ai/seams/read.ts` | Intent, prefs extract, place signals | Send messages; book |
   | Compose | `ai/seams/compose.ts` | Friend voice in GC/DM | Hard constraints; money |
   | Tool planner (optional) | inside TripAgent tools | Choose Browserbase ops | Bypass approval |

4. **Runtime plan ≠ product plan** — keep `AGENT_RUNTIME.md` for turn loop / gates (like `SUPERVISOR_PLAN.md`); keep product in store `docs/`. Don’t merge into one megafile.
5. **Supervisor lesson adapted to CF** — one `TripAgent` with **modules**, not 12 fake agents (already in engineering-plan §43). Deterministic: dedupe, identity, hard constraints, approvals, scoring, split threshold. LLM: classify, extract, copy.
6. **Ask-memory / cooldown** — Tabi’s `open_asks` + nudge backoff (`supervisor.py`) maps to Virgil: don’t re-ask the same onboarding field; GC `should_respond` cooldown so Virgil isn’t chatty.
7. **Graveyard over delete** — when a spike is wrong (e.g. wrong Linq shape), move to `_graveyard/` with a one-line README why it died.

---

## 4. Skip / don’t copy

| Tabi thing | Why skip for Virgil |
| ---------- | ------------------- |
| Telegram + Mini App (`webapp/`, `PUBLIC_WEBAPP_URL`) | UX is Linq iMessage only |
| Mongo as “nervous system” | Cloudflare Agent SQL is the brain; optional R2 later; no Vector DB initially |
| LangGraph multi-node supervisor graph | One durable TripAgent + CF Workflows; don’t reintroduce a Python graph |
| Stay22 / Amadeus / green carbon lane | Different sponsors; keep Browserbase as hands-on-web |
| Solana trip coin / Auth0 scaffold / ElevenLabs pet voice | Delight noise vs HTN demo; quests/XP are enough later |
| Pet health bars + Pillow render | Product metaphor is different |
| Freesolo post-training flywheel (`training/`) | Out of scope for HTN unless time surplus |
| Landing Next.js showcase as core | Optional late polish; not Phase 0–9 |
| In-process shared state + single Cloud Run instance | Workers are stateless; state lives in the DO/Agent |
| “Phoebe diagnose-target-convince” as separate agent product | Steal the **idea** (find the binding constraint) as TripAgent logic — not a second sponsored agent brand |
| Merging all LLMs into one helper | Exactly what `PIPELINE.md` forbids |

---

## 5. Recommended first actions

Ordered checklist to reshape the empty repo / docs **without building product features yet**:

1. **Scaffold docs skeleton** — add `PROJECT.md`, `REPO_MAP.md` (stub tree from §2), `PIPELINE.md` (three seams + “do not merge”), `AGENT_RUNTIME.md` (stub turn loop), `DEPLOY.md` (wrangler placeholders), `AGENTS.md` (read PROJECT; protect P0).
2. **Link store truth** — `PROJECT.md` links to Japlan store docs (`virgil-product`, `engineering-plan`, `project-context`, this file). One hop for agents.
3. **Create `.env.example`** — Linq, Cloudflare, Browserbase, model keys; REQUIRED/OPTIONAL; blank = fail-open behavior in comments.
4. **Scaffold `src/` folders + empty modules** — `linq/`, `browser/`, `memory/`, `ai/seams/`, `agents/TripAgent.ts` stubs; `data/` for fixtures; `_graveyard/.gitkeep`.
5. **Add Cursor agent profile** — port `code-worker.md` principles into `.cursor/agents/code-worker.md` (or Project agent store); point it at `AGENTS.md` + `REPO_MAP.md`.
6. **Write REPO_MAP data-flow ASCII** — Linq webhook → verify/dedupe → TripAgent → memory/tools → Browserbase → Linq reply (from engineering-plan §55–57).
7. **Define fail-open contracts** — document in `REPO_MAP` / integration headers: Browserbase never throws into TripAgent; Linq send failures log + retry; missing model key → fixture classify for local dev.
8. **Only then** start Phase 0 spikes (credentials, Linq in/out, Agent SQL persist, Browserbase extract) — each spike lands fixtures under `data/` and notes under `_graveyard/` or `docs/` if retired.

---

## Quick reference — Tabi paths worth rereading

- `README.md` — product + layout + fail-open pitch  
- `REPO_MAP.md` — module table + env owners + data flow  
- `PROJECT.md` — shared build context  
- `PIPELINE.md` — Read vs Agent seams  
- `SUPERVISOR_PLAN.md` — code gate / LLM workers / stages  
- `claude.md` + `.claude/agents/code-worker.md` — agent workflow  
- `.env.example` — annotated optional integrations  
- `app/integrations/db.py`, `flights.py`, `hotels.py` — fail-open exemplars  
- `_graveyard/` — retirement pattern  
