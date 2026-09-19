import type { Env } from "../../server";
import type { Intent, VirgilEvent } from "../../shared";
import { createModelClient } from "../provider";

/**
 * Read seam — classify / extract only.
 * Must not send messages or book. See PIPELINE.md.
 */
export async function classify(event: VirgilEvent, env: Env): Promise<Intent> {
  const client = createModelClient("read", env);

  if (event.kind === "reaction") return "APPROVAL";
  const text = (event.text ?? "").toLowerCase();
  if (text.includes("cancel") || text.includes("closed") || text.includes("wtf")) {
    return "DISRUPTION";
  }
  if (event.visibility === "dm" && text.length > 0) return "ONBOARDING";
  if (text.includes("http") || text.includes("maps")) return "PLACE_SHARE";

  if (!client.available()) {
    return text ? "CASUAL" : "UNKNOWN";
  }

  // Phase 0+: model classify with structured output
  const _ = await client.complete(`classify: ${text}`);
  void _;
  return text ? "CASUAL" : "UNKNOWN";
}
