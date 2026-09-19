import type { Env } from "../server";

export interface OutboundMessage {
  chatId: string;
  text: string;
}

/**
 * Send via Linq Partner API.
 * Missing LINQ_API_KEY → log and resolve (fail-open; demo path continues).
 */
export async function sendMessage(
  env: Env,
  message: OutboundMessage,
): Promise<{ sent: boolean }> {
  if (!env.LINQ_API_KEY) {
    console.warn("[linq/send] LINQ_API_KEY blank — skipping send", message.chatId);
    return { sent: false };
  }

  // Phase 0: real Partner API client.
  console.info("[linq/send] stub send", message.chatId, message.text.slice(0, 80));
  return { sent: true };
}
