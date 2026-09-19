import type { Env } from "../server";
import { linqAuthHeaders, linqBaseUrl, textMessageBody } from "./client";

export interface OutboundMessage {
  chatId: string;
  text: string;
}

/**
 * Reply in an existing chat via POST /chats/{chatId}/messages.
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

  const url = `${linqBaseUrl(env)}/chats/${encodeURIComponent(message.chatId)}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: linqAuthHeaders(env.LINQ_API_KEY),
      body: JSON.stringify(textMessageBody(message.text)),
    });
    if (!res.ok) {
      const detail = await safeText(res);
      console.error(
        "[linq/send] POST /chats/.../messages failed",
        res.status,
        message.chatId,
        detail.slice(0, 200),
      );
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[linq/send] network error", message.chatId, err);
    return { sent: false };
  }
}

/**
 * Create a chat and send the first message via POST /chats.
 * Used by the local linq:send spike and cold-start DMs.
 */
export async function createChatAndSend(
  env: Env,
  from: string,
  to: string[],
  text: string,
): Promise<{ sent: boolean; chatId?: string }> {
  if (!env.LINQ_API_KEY) {
    console.warn("[linq/send] LINQ_API_KEY blank — skipping createChatAndSend");
    return { sent: false };
  }

  const url = `${linqBaseUrl(env)}/chats`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: linqAuthHeaders(env.LINQ_API_KEY),
      body: JSON.stringify({
        from,
        to,
        ...textMessageBody(text),
      }),
    });
    if (!res.ok) {
      const detail = await safeText(res);
      console.error("[linq/send] POST /chats failed", res.status, detail.slice(0, 200));
      return { sent: false };
    }
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    return { sent: true, chatId: extractChatId(body) };
  } catch (err) {
    console.error("[linq/send] network error on createChatAndSend", err);
    return { sent: false };
  }
}

function extractChatId(body: Record<string, unknown> | null): string | undefined {
  if (!body) return undefined;
  const chat = body.chat;
  if (chat && typeof chat === "object" && !Array.isArray(chat)) {
    const id = (chat as { id?: unknown }).id;
    if (typeof id === "string") return id;
  }
  if (typeof body.chat_id === "string") return body.chat_id;
  if (typeof body.id === "string") return body.id;
  return undefined;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
