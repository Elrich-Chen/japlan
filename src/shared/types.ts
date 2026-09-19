import { z } from "zod";

/** Normalized inbound event after Linq verify + dedupe. */
export const VirgilEventSchema = z.object({
  id: z.string(),
  tripId: z.string().optional(),
  chatId: z.string(),
  handle: z.string(),
  kind: z.enum([
    "message",
    "reaction",
    "media",
    "participant_added",
    "participant_removed",
    "unknown",
  ]),
  text: z.string().optional(),
  reaction: z.string().optional(),
  replyToMessageId: z.string().optional(),
  visibility: z.enum(["group", "dm"]).default("group"),
  /** Linq envelope `event_type` (e.g. message.received). */
  sourceEventType: z.string().optional(),
  direction: z.enum(["inbound", "outbound", "unknown"]).optional(),
  receivedAt: z.string(),
  raw: z.unknown().optional(),
});

export type VirgilEvent = z.infer<typeof VirgilEventSchema>;

/** Phase 1 hello path — keep Intent union minimal; detect via text. */
export const VIRGIL_GREETING_RE = /\b(hello|hi|hey|virgil)\b/i;

export function isVirgilGreeting(text: string | undefined): boolean {
  return text != null && VIRGIL_GREETING_RE.test(text);
}

export const ActivityCandidateSchema = z.object({
  name: z.string(),
  category: z.string(),
  url: z.string(),
  startTimes: z.array(z.string()),
  pricePerPerson: z.number().optional(),
  durationMinutes: z.number().optional(),
  address: z.string().optional(),
  availabilityConfidence: z.number(),
});

export type ActivityCandidate = z.infer<typeof ActivityCandidateSchema>;

export type Intent =
  | "CASUAL"
  | "DISRUPTION"
  | "APPROVAL"
  | "ONBOARDING"
  | "PLACE_SHARE"
  | "UNKNOWN";

export const GC_RESPONSE_COOLDOWN_MS = 45_000;
