import type { VirgilEvent } from "../shared";

/** Map Linq Partner payload → VirgilEvent. Shape refined in Phase 0 spike. */
export function normalizeLinqPayload(payload: unknown): VirgilEvent {
  const p = (payload ?? {}) as Record<string, unknown>;
  const chat = (p.chat ?? p.conversation ?? {}) as Record<string, unknown>;
  const sender = (p.sender ?? p.from ?? {}) as Record<string, unknown>;

  return {
    id: String(p.event_id ?? p.id ?? crypto.randomUUID()),
    tripId: typeof p.trip_id === "string" ? p.trip_id : undefined,
    chatId: String(chat.id ?? p.chat_id ?? "unknown-chat"),
    handle: String(sender.handle ?? sender.id ?? p.handle ?? "unknown"),
    kind: mapKind(p),
    text: typeof p.text === "string" ? p.text : typeof p.body === "string" ? p.body : undefined,
    reaction: typeof p.reaction === "string" ? p.reaction : undefined,
    replyToMessageId:
      typeof p.reply_to === "string"
        ? p.reply_to
        : typeof p.reply_to_message_id === "string"
          ? p.reply_to_message_id
          : undefined,
    visibility: p.is_dm === true || p.visibility === "dm" ? "dm" : "group",
    receivedAt: new Date().toISOString(),
    raw: payload,
  };
}

function mapKind(p: Record<string, unknown>): VirgilEvent["kind"] {
  const t = String(p.type ?? p.event_type ?? "message").toLowerCase();
  if (t.includes("reaction")) return "reaction";
  if (t.includes("media") || t.includes("image")) return "media";
  if (t.includes("add")) return "participant_added";
  if (t.includes("remove")) return "participant_removed";
  if (t.includes("message") || t === "text") return "message";
  return "unknown";
}
