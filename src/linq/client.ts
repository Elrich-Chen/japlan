import type { Env } from "../server";

export const DEFAULT_LINQ_API_BASE = "https://api.linqapp.com/api/partner/v3";

export function linqBaseUrl(env: Pick<Env, "LINQ_API_BASE_URL">): string {
  const raw = env.LINQ_API_BASE_URL?.trim();
  if (!raw) return DEFAULT_LINQ_API_BASE;
  return raw.replace(/\/$/, "");
}

export function linqAuthHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export function textMessageBody(text: string): {
  message: { parts: Array<{ type: "text"; value: string }> };
} {
  return {
    message: {
      parts: [{ type: "text", value: text }],
    },
  };
}
