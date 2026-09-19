#!/usr/bin/env node
/**
 * Phase 0 spike: send one outbound message via Linq Partner API v3.
 * Loads .env from repo root (does not print secrets).
 *
 * Usage: npm run linq:send
 * Requires: LINQ_API_KEY, LINQ_FROM_NUMBER, LINQ_TEST_TO_NUMBER
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadDotEnv(resolve(root, ".env"));

const apiKey = process.env.LINQ_API_KEY?.trim();
const from = process.env.LINQ_FROM_NUMBER?.trim();
const to = process.env.LINQ_TEST_TO_NUMBER?.trim();
const baseUrl = (
  process.env.LINQ_API_BASE_URL?.trim() || "https://api.linqapp.com/api/partner/v3"
).replace(/\/$/, "");

if (!apiKey) {
  console.error("Missing LINQ_API_KEY in .env");
  process.exit(1);
}
if (!from) {
  console.error("Missing LINQ_FROM_NUMBER in .env (your Linq sandbox number, E.164)");
  process.exit(1);
}
if (!to) {
  console.error(
    "Missing LINQ_TEST_TO_NUMBER in .env — set your personal phone (E.164) to receive the test SMS/iMessage.",
  );
  process.exit(1);
}

const res = await fetch(`${baseUrl}/chats`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    from,
    to: [to],
    message: { parts: [{ type: "text", value: "Hello from Virgil" }] },
  }),
});

if (!res.ok) {
  const detail = await res.text().catch(() => "");
  console.error("Send failed", res.status, detail.slice(0, 200));
  console.error("Text the Linq number from your phone first if sandbox is inbound-first.");
  process.exit(1);
}

const body = await res.json().catch(() => null);
const chatId =
  body && typeof body === "object"
    ? (body.chat?.id ?? body.chat_id ?? body.id)
    : undefined;
console.log("Sent OK", chatId ? `(chatId=${chatId})` : "");

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
