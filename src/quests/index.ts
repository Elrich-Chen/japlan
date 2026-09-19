/** Delight layer — after P0. See engineering-plan §47–51. */
export interface Quest {
  id: string;
  title: string;
  xp: number;
}

export function listActiveQuests(_tripId: string): Quest[] {
  return [];
}
