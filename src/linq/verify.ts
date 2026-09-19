import type { Env } from "../server";

const MAX_AGE_SECONDS = 5 * 60;

/**
 * Verify Linq Standard Webhooks signature (HMAC-SHA256, whsec_ secret).
 * Blank secret → allow only when LINQ_SKIP_VERIFY=1 (local fixtures).
 */
export async function verifyLinqSignature(
  request: Request,
  rawBody: string,
  env: Env,
): Promise<boolean> {
  const skip = env.LINQ_SKIP_VERIFY === "1";
  const secret = env.LINQ_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return skip;
  }

  const id = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signatureHeader = request.headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) {
    return false;
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (age > MAX_AGE_SECONDS) return false;

  const keyBytes = decodeWhsec(secret);
  if (!keyBytes) return false;

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = await hmacSha256Base64(keyBytes, signedContent);

  return signatureHeader.split(/\s+/).some((part) => {
    if (!part.startsWith("v1,")) return false;
    return timingSafeEqualBase64(expected, part.slice(3));
  });
}

function decodeWhsec(secret: string): Uint8Array | null {
  const raw = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  try {
    const bin = atob(raw);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

async function hmacSha256Base64(key: Uint8Array, content: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(content),
  );
  return bytesToBase64(new Uint8Array(mac));
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function timingSafeEqualBase64(a: string, b: string): boolean {
  let aBytes: Uint8Array;
  let bBytes: Uint8Array;
  try {
    aBytes = base64ToBytes(a);
    bBytes = base64ToBytes(b);
  } catch {
    return false;
  }
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i]! ^ bBytes[i]!;
  }
  return diff === 0;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
