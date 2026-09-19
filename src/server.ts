/**
 * Worker entry: verify → dedupe → normalize → TripAgent.
 * Transport only — no scoring, booking, or copy here.
 */
import type { VirgilEvent } from "./shared";
import { handleLinqWebhook } from "./linq/webhook";
import { getTripAgent } from "./agents/TripAgent";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, app: env.APP_NAME ?? "virgil" });
    }

    if (request.method === "POST" && url.pathname === "/webhooks/linq") {
      const result = await handleLinqWebhook(request, env);
      if (!result.ok) {
        return Response.json({ error: result.error }, { status: result.status });
      }

      if (result.duplicate) {
        return Response.json({ ok: true, deduped: true });
      }

      const event = result.event as VirgilEvent;
      ctx.waitUntil(
        getTripAgent(env, event.tripId ?? event.chatId).handleEvent(event),
      );
      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  },
};

/** Minimal env shape for the skeleton. Expand in Phase 0. */
export interface Env {
  APP_NAME?: string;
  LINQ_API_KEY?: string;
  LINQ_FROM_NUMBER?: string;
  LINQ_TEST_TO_NUMBER?: string;
  LINQ_WEBHOOK_SECRET?: string;
  LINQ_SKIP_VERIFY?: string;
  LINQ_API_BASE_URL?: string;
  BROWSERBASE_API_KEY?: string;
  BROWSERBASE_PROJECT_ID?: string;
  MODEL_READ_API_KEY?: string;
  MODEL_READ_MODEL?: string;
  MODEL_READ_BASE_URL?: string;
  MODEL_COMPOSE_API_KEY?: string;
  MODEL_COMPOSE_MODEL?: string;
  MODEL_COMPOSE_BASE_URL?: string;
}
