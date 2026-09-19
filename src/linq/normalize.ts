import type { VirgilEvent } from "../shared";

/** Map Linq Partner v3 webhook envelope (or legacy flat fixture) → VirgilEvent. */
export function normalizeLinqPayload(payload: unknown): VirgilEvent {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  const eventType = String(root.event_type ?? root.type ?? "message").toLowerCase();

  const chat = asRecord(data.chat) ?? {};
  const message = asRecord(data.message) ?? {};
  const senderHandle =
    asRecord(data.sender_handle) ??
    asRecord(data.from_handle) ??
    asRecord(data.sender) ??
    asRecord(data.from) ??
    asRecord(data.participant) ??
    {};

  const parts = Array.isArray(data.parts)
    ? data.parts
    : Array.isArray(message.parts)
      ? message.parts
      : undefined;

  const text =
    extractText(parts) ??
    (typeof data.text === "string"
      ? data.text
      : typeof data.body === "string"
        ? data.body
        : typeof message.text === "string"
          ? message.text
          : undefined);

  const isGroup =
    typeof chat.is_group === "boolean"
      ? chat.is_group
      : typeof data.is_group === "boolean"
        ? data.is_group
        : data.is_dm === true || root.is_dm === true
          ? false
          : root.visibility === "dm"
            ? false
            : true;

  const handle = String(
    senderHandle.handle ??
      senderHandle.id ??
      (typeof data.from === "string" ? data.from : undefined) ??
      (typeof data.handle === "string" ? data.handle : undefined) ??
      root.handle ??
      "unknown",
  );

  const chatId = String(
    chat.id ?? data.chat_id ?? root.chat_id ?? "unknown-chat",
  );

  const reaction =
    typeof data.custom_emoji === "string" && data.custom_emoji
      ? data.custom_emoji
      : typeof data.reaction_type === "string"
        ? data.reaction_type
        : typeof data.reaction === "string"
          ? data.reaction
          : typeof root.reaction === "string"
            ? root.reaction
            : undefined;

  const replyTo =
    extractReplyTo(data.reply_to) ??
    extractReplyTo(message.reply_to) ??
    (typeof data.reply_to_message_id === "string"
      ? data.reply_to_message_id
      : typeof data.message_id === "string" && eventType.startsWith("reaction.")
        ? data.message_id
        : typeof root.reply_to === "string"
          ? root.reply_to
          : typeof root.reply_to_message_id === "string"
            ? root.reply_to_message_id
            : undefined);

  const sourceEventType =
    typeof root.event_type === "string"
      ? root.event_type
      : typeof root.type === "string"
        ? root.type
        : undefined;

  return {
    id: String(root.event_id ?? root.id ?? crypto.randomUUID()),
    tripId: typeof root.trip_id === "string" ? root.trip_id : undefined,
    chatId,
    handle,
    kind: mapKind(eventType, parts, text),
    text,
    reaction,
    replyToMessageId: replyTo,
    visibility: isGroup ? "group" : "dm",
    sourceEventType,
    direction: mapDirection(data.direction ?? root.direction, eventType),
    receivedAt: new Date().toISOString(),
    raw: payload,
  };
}

function mapDirection(
  raw: unknown,
  eventType: string,
): VirgilEvent["direction"] {
  if (raw === "inbound" || raw === "outbound") return raw;
  if (eventType === "message.received") return "inbound";
  if (eventType === "message.sent") return "outbound";
  return "unknown";
}

function mapKind(
  eventType: string,
  parts: unknown[] | undefined,
  text: string | undefined,
): VirgilEvent["kind"] {
  if (eventType.includes("reaction")) return "reaction";
  if (eventType === "participant.added" || eventType.includes("participant.added")) {
    return "participant_added";
  }
  if (eventType === "participant.removed" || eventType.includes("participant.removed")) {
    return "participant_removed";
  }
  if (eventType.includes("media") || eventType.includes("image")) return "media";
  if (eventType.includes("message") || eventType === "text") {
    if (!text && hasMediaPart(parts)) return "media";
    return "message";
  }
  if (hasMediaPart(parts) && !text) return "media";
  return "unknown";
}

function extractText(parts: unknown[] | undefined): string | undefined {
  if (!parts) return undefined;
  const chunks: string[] = [];
  for (const part of parts) {
    const p = asRecord(part);
    if (!p) continue;
    if (String(p.type).toLowerCase() === "text" && typeof p.value === "string") {
      chunks.push(p.value);
    }
  }
  return chunks.length ? chunks.join("\n") : undefined;
}

function hasMediaPart(parts: unknown[] | undefined): boolean {
  if (!parts) return false;
  return parts.some((part) => {
    const p = asRecord(part);
    return p != null && String(p.type).toLowerCase() === "media";
  });
}

function extractReplyTo(replyTo: unknown): string | undefined {
  if (typeof replyTo === "string") return replyTo;
  const r = asRecord(replyTo);
  if (!r) return undefined;
  if (typeof r.message_id === "string") return r.message_id;
  if (typeof r.id === "string") return r.id;
  return undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}
