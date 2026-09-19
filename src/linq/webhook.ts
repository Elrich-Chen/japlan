import type { Env } from "../server";
import { VirgilEventSchema, type VirgilEvent } from "../shared";
import { verifyLinqSignature } from "./verify";
import { normalizeLinqPayload } from "./normalize";

export type WebhookResult =
  | { ok: true; event: VirgilEvent; duplicate: false }
  | { ok: true; duplicate: true }
  | { ok: false; status: number; error: string };

/** In-memory dedupe for local dev. Phase 0 → Durable Object / KV / Agent SQL. */
const seenEventIds = new Map<string, number>();
const DEDUPE_TTL_MS = 24 * 60 * 60 * 1000;

export async function handleLinqWebhook(
  request: Request,
  env: Env,
): Promise<WebhookResult> {
  const rawBody = await request.text();

  const verified = await verifyLinqSignature(request, rawBody, env);
  if (!verified) {
    return { ok: false, status: 401, error: "invalid signature" };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { ok: false, status: 400, error: "invalid json" };
  }

  const eventId = extractEventId(payload);
  if (eventId && isDuplicate(eventId)) {
    return { ok: true, duplicate: true };
  }
  if (eventId) markSeen(eventId);

  const normalized = normalizeLinqPayload(payload);
  const parsed = VirgilEventSchema.safeParse(normalized);
  if (!parsed.success) {
    return { ok: false, status: 400, error: "normalize failed" };
  }

  return { ok: true, event: parsed.data, duplicate: false };
}

function extractEventId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const id = (payload as { event_id?: unknown; id?: unknown }).event_id
    ?? (payload as { id?: unknown }).id;
  return typeof id === "string" ? id : undefined;
}

function isDuplicate(eventId: string): boolean {
  const seenAt = seenEventIds.get(eventId);
  if (!seenAt) return false;
  if (Date.now() - seenAt > DEDUPE_TTL_MS) {
    seenEventIds.delete(eventId);
    return false;
  }
  return true;
}

function markSeen(eventId: string): void {
  seenEventIds.set(eventId, Date.now());
}
