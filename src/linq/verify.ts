import type { Env } from "../server";

/**
 * Verify Linq webhook signature.
 * Blank secret + LINQ_SKIP_VERIFY=1 → allow (local fixtures only).
 */
export async function verifyLinqSignature(
  request: Request,
  rawBody: string,
  env: Env,
): Promise<boolean> {
  const skip = env.LINQ_SKIP_VERIFY === "1";
  if (!env.LINQ_WEBHOOK_SECRET) {
    return skip;
  }

  // Phase 0: implement real HMAC / Linq Partner API verification.
  const header =
    request.headers.get("x-linq-signature") ??
    request.headers.get("x-signature");
  if (!header) return skip;

  // Placeholder equality check until Phase 0 spike lands the real scheme.
  void rawBody;
  return header.length > 0 || skip;
}
