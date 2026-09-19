import { describe, expect, it } from "vitest";
import { groupScore } from "../src/planning";
import { isApprovalValid, shouldRespond } from "../src/approvals";
import { isInboundProcessable } from "../src/agents/TripAgent";
import type { VirgilEvent } from "../src/shared";

function event(partial: Partial<VirgilEvent>): VirgilEvent {
  return {
    id: "e1",
    chatId: "c1",
    handle: "u1",
    kind: "message",
    visibility: "group",
    receivedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("planning.groupScore", () => {
  it("weights avg, min, feasibility, interest, novelty", () => {
    const score = groupScore({
      memberScores: [1, 1, 1, 1],
      feasibility: 1,
      savedInterest: 1,
      novelty: 1,
    });
    expect(score).toBeCloseTo(1, 5);
  });
});

describe("approvals.shouldRespond", () => {
  it("always responds to DM", () => {
    expect(shouldRespond(event({ visibility: "dm", text: "hi" }), "CASUAL")).toBe(true);
  });

  it("stays quiet on casual GC", () => {
    expect(shouldRespond(event({ text: "lol" }), "CASUAL")).toBe(false);
  });

  it("responds to greeting / virgil mention in GC", () => {
    expect(shouldRespond(event({ text: "hey Virgil" }), "CASUAL")).toBe(true);
    expect(shouldRespond(event({ text: "hello everyone" }), "CASUAL")).toBe(true);
  });

  it("responds to disruption", () => {
    expect(shouldRespond(event({ text: "cancelled" }), "DISRUPTION")).toBe(true);
  });
});

describe("TripAgent.isInboundProcessable", () => {
  it("accepts message.received inbound", () => {
    expect(
      isInboundProcessable(
        event({
          sourceEventType: "message.received",
          direction: "inbound",
          text: "hi",
        }),
      ),
    ).toBe(true);
  });

  it("skips outbound and message.sent / delivered / read", () => {
    expect(
      isInboundProcessable(
        event({ sourceEventType: "message.received", direction: "outbound" }),
      ),
    ).toBe(false);
    expect(
      isInboundProcessable(event({ sourceEventType: "message.sent", direction: "outbound" })),
    ).toBe(false);
    expect(isInboundProcessable(event({ sourceEventType: "message.delivered" }))).toBe(false);
    expect(isInboundProcessable(event({ sourceEventType: "message.read" }))).toBe(false);
  });

  it("accepts reactions for approval path", () => {
    expect(
      isInboundProcessable(
        event({ kind: "reaction", sourceEventType: "reaction.added", reaction: "like" }),
      ),
    ).toBe(true);
  });
});

describe("approvals.isApprovalValid", () => {
  it("rejects expired or mismatched proposal ids", () => {
    const approval = {
      proposalMessageId: "msg_1",
      tripId: "t1",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    expect(isApprovalValid(approval, "msg_1")).toBe(false);
    expect(
      isApprovalValid(
        { ...approval, expiresAt: new Date(Date.now() + 60_000).toISOString() },
        "msg_other",
      ),
    ).toBe(false);
  });
});
