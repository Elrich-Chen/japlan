/**
 * Deterministic planning — no LLM, no network.
 * groupScore ≈ 0.40 avg + 0.25 min + 0.15 feasibility + 0.10 savedInterest + 0.10 novelty
 */

export interface MemberScore {
  handle: string;
  score: number;
}

export function groupScore(input: {
  memberScores: number[];
  feasibility: number;
  savedInterest: number;
  novelty: number;
}): number {
  if (input.memberScores.length === 0) return 0;
  const avg =
    input.memberScores.reduce((a, b) => a + b, 0) / input.memberScores.length;
  const min = Math.min(...input.memberScores);
  return (
    0.4 * avg +
    0.25 * min +
    0.15 * input.feasibility +
    0.1 * input.savedInterest +
    0.1 * input.novelty
  );
}

/** Placeholder — Phase 8 implements partition search + reconvene constraints. */
export function shouldSplit(_together: number, _split: number): boolean {
  return false;
}
