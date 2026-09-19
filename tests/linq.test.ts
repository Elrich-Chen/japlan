import { describe, expect, it } from "vitest";
import fixture from "../data/linq-webhook-disruption.json";
import { normalizeLinqPayload } from "../src/linq/normalize";
import { verifyLinqSignature } from "../src/linq/verify";
import type { Env } from "../src/server";

describe("normalizeLinqPayload", () => {
  it("normalizes v3 message.received disruption fixture", () => {
    const event = normalizeLinqPayload(fixture);
    expect(event.id).toBe("evt_fixture_001");
    expect(event.chatId).toBe("chat_fixture_tokyo");
    expect(event.handle).toBe("elrich");
    expect(event.kind).toBe("message");
    expect(event.text).toBe("yo the teamLab tickets just got cancelled wtf");
    expect(event.visibility).toBe("group");
    expect(event.sourceEventType).toBe("message.received");
    expect(event.direction).toBe("inbound");
  });

  it("sets direction from data.direction or event_type fallback", () => {
    const sent = normalizeLinqPayload({
      event_type: "message.sent",
      event_id: "evt_sent",
      data: {
        chat: { id: "c1", is_group: false },
        parts: [{ type: "text", value: "echo" }],
        sender_handle: { handle: "me" },
      },
    });
    expect(sent.sourceEventType).toBe("message.sent");
    expect(sent.direction).toBe("outbound");

    const withField = normalizeLinqPayload({
      event_type: "message.received",
      event_id: "evt_in",
      data: {
        direction: "inbound",
        chat: { id: "c1", is_group: true },
        parts: [{ type: "text", value: "hi" }],
        sender_handle: { handle: "u" },
      },
    });
    expect(withField.direction).toBe("inbound");
  });

  it("maps 2025-01-01 nested message.parts + from_handle", () => {
    const event = normalizeLinqPayload({
      event_type: "message.received",
      event_id: "evt_legacy",
      data: {
        chat_id: "chat_1",
        is_group: false,
        from_handle: { handle: "+15551212" },
        message: {
          parts: [{ type: "text", value: "hi" }],
        },
      },
    });
    expect(event.chatId).toBe("chat_1");
    expect(event.handle).toBe("+15551212");
    expect(event.text).toBe("hi");
    expect(event.visibility).toBe("dm");
    expect(event.kind).toBe("message");
    expect(event.sourceEventType).toBe("message.received");
    expect(event.direction).toBe("inbound");
  });

  it("maps reaction.added", () => {
    const event = normalizeLinqPayload({
      event_type: "reaction.added",
      event_id: "evt_react",
      data: {
        chat_id: "chat_r",
        message_id: "msg_1",
        reaction_type: "like",
        from_handle: { handle: "+1" },
      },
    });
    expect(event.kind).toBe("reaction");
    expect(event.reaction).toBe("like");
    expect(event.replyToMessageId).toBe("msg_1");
    expect(event.sourceEventType).toBe("reaction.added");
  });

  it("maps participant.added / removed", () => {
    const added = normalizeLinqPayload({
      event_type: "participant.added",
      event_id: "evt_add",
      data: {
        chat_id: "chat_g",
        handle: "+1999",
        participant: { handle: "+1999" },
      },
    });
    expect(added.kind).toBe("participant_added");
    expect(added.handle).toBe("+1999");

    const removed = normalizeLinqPayload({
      event_type: "participant.removed",
      event_id: "evt_rm",
      data: {
        chat_id: "chat_g",
        participant: { handle: "+1888" },
      },
    });
    expect(removed.kind).toBe("participant_removed");
    expect(removed.handle).toBe("+1888");
  });
});

describe("verifyLinqSignature", () => {
  const secretBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  const secret = `whsec_${bytesToBase64(secretBytes)}`;

  async function sign(id: string, timestamp: string, body: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${id}.${timestamp}.${body}`),
    );
    return `v1,${bytesToBase64(new Uint8Array(mac))}`;
  }

  it("allows blank secret only when LINQ_SKIP_VERIFY=1", async () => {
    const req = new Request("https://example.com", { method: "POST" });
    expect(await verifyLinqSignature(req, "{}", { LINQ_SKIP_VERIFY: "1" })).toBe(true);
    expect(await verifyLinqSignature(req, "{}", {})).toBe(false);
  });

  it("accepts a valid Standard Webhooks signature", async () => {
    const body = '{"ok":true}';
    const id = "msg_123";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await sign(id, timestamp, body);
    const req = new Request("https://example.com", {
      method: "POST",
      headers: {
        "webhook-id": id,
        "webhook-timestamp": timestamp,
        "webhook-signature": signature,
      },
    });
    const env: Env = { LINQ_WEBHOOK_SECRET: secret };
    expect(await verifyLinqSignature(req, body, env)).toBe(true);
  });

  it("rejects bad signature and stale timestamp", async () => {
    const body = '{"ok":true}';
    const id = "msg_123";
    const now = String(Math.floor(Date.now() / 1000));
    const stale = String(Math.floor(Date.now() / 1000) - 600);
    const goodSig = await sign(id, now, body);
    const env: Env = { LINQ_WEBHOOK_SECRET: secret };

    const bad = new Request("https://example.com", {
      method: "POST",
      headers: {
        "webhook-id": id,
        "webhook-timestamp": now,
        "webhook-signature": "v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      },
    });
    expect(await verifyLinqSignature(bad, body, env)).toBe(false);

    const old = new Request("https://example.com", {
      method: "POST",
      headers: {
        "webhook-id": id,
        "webhook-timestamp": stale,
        "webhook-signature": goodSig,
      },
    });
    expect(await verifyLinqSignature(old, body, env)).toBe(false);
  });
});

function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}
