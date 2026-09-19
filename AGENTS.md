# AGENTS.md — Cursor / agent working rules

## Read this first

**`PROJECT.md` is the current truth.** Read it (and linked `docs/`) before changing anything. Prefer it over assumptions.

## Working rules

- Match module ownership in `REPO_MAP.md`. Don't merge or reinvent layers.
- Keep model seams separate per `PIPELINE.md` — never one shared `llm()`.
- Deterministic gates stay in code: dedupe, hard constraints, scoring, approvals, `should_respond` (`AGENT_RUNTIME.md`).
- Integrations fail open: Browserbase / Linq / missing model keys must not crash the hot path.
- If a change contradicts `PROJECT.md` or the engineering plan, **flag it** — do not silently diverge.

## Scope

The failure mode is many half-built lanes. Protect the **P0 loop** above new surfaces:

> Linq ↔ TripAgent ↔ memory ↔ Browserbase ↔ disruption/replan ↔ approval/action

Do not add Wrapped, Composio, dashboards, maps UI, hotels/flights infra, or game polish until P0 is green (`docs/engineering-plan.md` §80–81).

## Implementation agent

Use [`.cursor/agents/code-worker.md`](./.cursor/agents/code-worker.md) for concrete code tasks. Small blast radius; verify before claiming done; no hypothetical scaffolding.
