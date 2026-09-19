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
  receivedAt: z.string(),
  raw: z.unknown().optional(),
});

export type VirgilEvent = z.infer<typeof VirgilEventSchema>;

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
