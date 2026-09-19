import type { ActivityCandidate } from "../shared";
import type { Env } from "../server";
import fixtureCandidates from "../../data/browserbase-activity-candidates.json";

export interface BrowserProvider {
  available(): boolean;
  searchActivities(query: {
    query: string;
    when?: string;
    partySize?: number;
  }): Promise<ActivityCandidate[]>;
  validateAvailability(candidate: ActivityCandidate): Promise<ActivityCandidate | null>;
  prepareBooking(candidate: ActivityCandidate): Promise<{ status: "CHECKOUT_READY" | "FAILED"; url?: string }>;
  executeApprovedBooking(candidate: ActivityCandidate): Promise<{ status: "DONE" | "FAILED"; confirmation?: string }>;
}

/**
 * Fail-open chain: live Stagehand → fixture JSON → canned stub.
 * Never throws into TripAgent.
 */
export function createBrowserProvider(env: Env): BrowserProvider {
  return {
    available() {
      return Boolean(env.BROWSERBASE_API_KEY && env.BROWSERBASE_PROJECT_ID);
    },

    async searchActivities(query) {
      try {
        if (this.available()) {
          // Phase 0: Stagehand live extract.
          console.info("[browser] live path not wired — falling back to fixture", query.query);
        }
        return fixtureCandidates as ActivityCandidate[];
      } catch (err) {
        console.warn("[browser] search failed, using canned stub", err);
        return cannedCandidates();
      }
    },

    async validateAvailability(candidate) {
      return candidate;
    },

    async prepareBooking(candidate) {
      return { status: "CHECKOUT_READY", url: candidate.url };
    },

    async executeApprovedBooking() {
      return { status: "FAILED" }; // MVP stops at CHECKOUT_READY unless explicitly enabled
    },
  };
}

function cannedCandidates(): ActivityCandidate[] {
  return [
    {
      name: "Fallback activity",
      category: "flex",
      url: "https://example.com",
      startTimes: ["15:00"],
      availabilityConfidence: 0.2,
    },
  ];
}
