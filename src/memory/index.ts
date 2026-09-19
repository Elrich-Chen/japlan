/**
 * Agent SQL persistence — Phase 0/2.
 * Tables sketched in docs/engineering-plan.md §18.
 */
export interface PreferenceSignal {
  dimension: string;
  value: number;
  confidence: number;
  sourceType: string;
  visibility: "private" | "group_safe";
}

export async function rememberSignal(
  _tripId: string,
  _memberHandle: string,
  _signal: PreferenceSignal,
): Promise<void> {
  // Phase 2–4: write to Agent SQL
}

export async function loadTripContext(_tripId: string): Promise<null> {
  return null;
}
