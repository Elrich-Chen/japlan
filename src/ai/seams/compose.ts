import type { Env } from "../../server";
import type { Intent, VirgilEvent } from "../../shared";
import { createModelClient } from "../provider";

/**
 * Compose seam — friend voice only.
 * Must not own hard constraints or money. See PIPELINE.md.
 */
export async function composeReply(
  event: VirgilEvent,
  intent: Intent,
  env: Env,
): Promise<string | null> {
  const client = createModelClient("compose", env);

  if (!client.available()) {
    return canned(intent, event);
  }

  const out = await client.complete(
    `intent=${intent} visibility=${event.visibility} text=${event.text ?? ""}`,
  );
  return out ?? canned(intent, event);
}

function canned(intent: Intent, event: VirgilEvent): string | null {
  switch (intent) {
    case "DISRUPTION":
      return "Got it — looking at options that still work for everyone. Hang tight.";
    case "ONBOARDING":
      return "Hey — quick one so I can plan around you: what three things do you actually care about on this trip?";
    case "APPROVAL":
      return "Locked in. Working on it.";
    case "PLACE_SHARE":
      return null; // often silent memory
    default:
      return event.visibility === "dm" ? "Noted." : null;
  }
}
