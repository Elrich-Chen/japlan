#!/usr/bin/env node
/**
 * Copy whitelisted keys from .env → .dev.vars for `wrangler dev`.
 * Does not print secret values.
 *
 * Usage: npm run sync:dev-vars
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
const outPath = resolve(root, ".dev.vars");

const WHITELIST = new Set([
  "APP_NAME",
  "LINQ_API_KEY",
  "LINQ_FROM_NUMBER",
  "LINQ_TEST_TO_NUMBER",
  "LINQ_WEBHOOK_SECRET",
  "LINQ_SKIP_VERIFY",
  "LINQ_API_BASE_URL",
]);

const parsed = loadDotEnv(envPath);
const out = {};

for (const key of WHITELIST) {
  if (parsed[key] !== undefined) {
    out[key] = parsed[key];
  }
}

if (!out.APP_NAME) {
  out.APP_NAME = "virgil";
}

const hasSecret = Boolean(out.LINQ_WEBHOOK_SECRET?.trim());
if (!hasSecret) {
  out.LINQ_SKIP_VERIFY = "1";
}

const lines = Object.entries(out).map(([k, v]) => `${k}=${v}`);
writeFileSync(outPath, lines.join("\n") + "\n", "utf8");

const keys = Object.keys(out).sort();
console.log(`Wrote ${outPath}`);
console.log(`Keys: ${keys.join(", ")}`);
if (!hasSecret) {
  console.log("LINQ_WEBHOOK_SECRET empty → set LINQ_SKIP_VERIFY=1 for local verify skip");
}

function loadDotEnv(path) {
  const result = {};
  if (!existsSync(path)) {
    console.error(`Missing ${path} — copy .env.example first`);
    process.exit(1);
  }
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
    result[key] = value;
  }
  return result;
}
