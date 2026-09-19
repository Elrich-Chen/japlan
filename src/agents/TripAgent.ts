import type { Env } from "../server";
import type { VirgilEvent } from "../shared";
import { shouldRespond } from "../approvals/sendGate";
import { classify } from "../ai/seams/read";
import { composeReply } from "../ai/seams/compose";
import { sendMessage } from "../linq/send";

/**
 * One durable agent per trip. Phase 0 will subclass Cloudflare Agents SDK /
 * Durable Object. This stub holds the turn-loop shape from AGENT_RUNTIME.md.
 */
export class TripAgent {
  constructor(
    private readonly tripKey: string,
    private readonly env: Env,
  ) {}

  async handleEvent(event: VirgilEvent): Promise<void> {
    // TODO(phase-1): persist chat_event via memory/
    const intent = await classify(event, this.env);

    if (!shouldRespond(event, intent)) {
      return;
    }

    const text = await composeReply(event, intent, this.env);
    if (!text) return;

    await sendMessage(this.env, {
      chatId: event.chatId,
      text,
    });
  }
}

/** Stub locator — replace with Agent namespace / DO id binding in Phase 0. */
const agents = new Map<string, TripAgent>();

export function getTripAgent(env: Env, tripKey: string): TripAgent {
  let agent = agents.get(tripKey);
  if (!agent) {
    agent = new TripAgent(tripKey, env);
    agents.set(tripKey, agent);
  }
  return agent;
}
