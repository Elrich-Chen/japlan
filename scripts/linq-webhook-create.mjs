#!/usr/bin/env node
/**
 * Create a Linq Partner v3 webhook subscription for local/prod inbound.
 * Loads .env from repo root (does not print API key).
 *
 * Usage:
 *   WEBHOOK_URL=https://….trycloudflare.com/webhooks/linq npm run linq:webhook
 *   npm run linq:webhook -- https://….trycloudflare.com/webhooks/linq
 *
 * Requires: LINQ_API_KEY, WEBHOOK_URL (https)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadDotEnv(resolve(root, ".env"));

const apiKey = process.env.LINQ_API_KEY?.trim();
const baseUrl = (
  process.env.LINQ_API_BASE_URL?.trim() || "https://api.linqapp.com/api/partner/v3"
).replace(/\/$/, "");

const rawUrl = (process.argv[2] ?? process.env.WEBHOOK_URL ?? "").trim();

if (!apiKey) {
  console.error("Missing LINQ_API_KEY in .env");
  process.exit(1);
}
if (!rawUrl) {
  console.error(
    "Missing WEBHOOK_URL — pass as argv or env (https tunnel → /webhooks/linq)",
  );
  process.exit(1);
}
if (!/^https:\/\//i.test(rawUrl)) {
  console.error("WEBHOOK_URL must be https");
  process.exit(1);
}

const targetUrl = withWebhookVersion(rawUrl);

const res = await fetch(`${baseUrl}/webhook-subscriptions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    target_url: targetUrl,
    subscribed_events: [
      "message.received",
      "reaction.added",
      "participant.added",
      "chat.created",
    ],
  }),
});

if (!res.ok) {
  const detail = await res.text().catch(() => "");
  console.error("Webhook create failed", res.status, detail.slice(0, 400));
  process.exit(1);
}

const body = await res.json().catch(() => null);
const id =
  body && typeof body === "object"
    ? (body.id ?? body.subscription?.id ?? body.webhook_subscription?.id)
    : undefined;
const signingSecret =
  body && typeof body === "object"
    ? (body.signing_secret ??
      body.secret ??
      body.subscription?.signing_secret ??
      body.webhook_subscription?.signing_secret)
    : undefined;

console.log("Webhook subscription created");
console.log("  id:", id ?? "(unknown — check API response)");
console.log("  target_url:", targetUrl);
if (typeof signingSecret === "string" && signingSecret) {
  console.log("");
  console.log("Save this signing_secret to LINQ_WEBHOOK_SECRET (shown once):");
  console.log(signingSecret);
  console.log("");
  console.log("Then: unset LINQ_SKIP_VERIFY (or set to 0) and re-run npm run sync:dev-vars");
} else {
  console.log("No signing_secret in response — check Linq dashboard / API docs.");
}

function withWebhookVersion(url) {
  const u = new URL(url);
  if (!u.searchParams.has("version")) {
    u.searchParams.set("version", "2026-02-03");
  }
  return u.toString();
}

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
