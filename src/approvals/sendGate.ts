import type { Intent, VirgilEvent } from "../shared";
import { GC_RESPONSE_COOLDOWN_MS, isVirgilGreeting } from "../shared";

export interface ProposalApproval {
  proposalMessageId: string;
  tripId: string;
  expiresAt: string;
}

const lastGcReplyAt = new Map<string, number>();

/** Code send-gate — not LLM. */
export function shouldRespond(event: VirgilEvent, intent: Intent): boolean {
  if (event.kind === "reaction" && intent === "APPROVAL") return true;
  if (event.visibility === "dm") return true;
  if (intent === "DISRUPTION" || intent === "ONBOARDING" || intent === "APPROVAL") {
    return true;
  }
  if (isVirgilGreeting(event.text)) return true;

  const last = lastGcReplyAt.get(event.chatId) ?? 0;
  if (Date.now() - last < GC_RESPONSE_COOLDOWN_MS) return false;

  // Default: often silent on casual GC chatter
  if (intent === "CASUAL" || intent === "UNKNOWN") return false;

  lastGcReplyAt.set(event.chatId, Date.now());
  return true;
}

export function isApprovalValid(
  approval: ProposalApproval,
  reactionMessageId: string | undefined,
  now = new Date(),
): boolean {
  if (!reactionMessageId || reactionMessageId !== approval.proposalMessageId) {
    return false;
  }
  return now.getTime() <= Date.parse(approval.expiresAt);
}
