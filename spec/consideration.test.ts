import { beforeAll, describe, expect, inject, it } from "vitest";

// The persisted core flow: a special consideration request survives a
// reload, and a new one reaches other open tabs over the SSE stream. Same
// shape as the starter's guestbook check it replaces (see spec/routes.ts).
const baseUrl = inject("baseUrl");

describe("special consideration requests", () => {
  let courseCode: string;
  let reason: string;

  beforeAll(() => {
    const stamp = process.hrtime.bigint().toString();
    courseCode = `T${stamp.slice(-6)}`;
    reason = `spec probe ${stamp}`;
  });

  // Astro checks form POSTs carry a same-origin Origin header (CSRF
  // protection); browsers send it automatically, a bare fetch doesn't.
  const post = (body: URLSearchParams) =>
    fetch(new URL("/api/consideration-requests", baseUrl), {
      method: "POST",
      headers: { origin: baseUrl },
      body,
      redirect: "manual",
    });

  it("accepts a request and redirects back to the page", async () => {
    const res = await post(new URLSearchParams({ courseCode, reason }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/special-consideration/");
  });

  it("persists the request: a fresh page load includes it", async () => {
    const res = await fetch(new URL("/special-consideration/", baseUrl));
    expect(await res.text()).toContain(reason);
  });

  it("broadcasts new requests over the SSE stream", async () => {
    const liveReason = `live probe ${process.hrtime.bigint()}`;

    // subscribe first, then post, then read until the event arrives
    const stream = await fetch(new URL("/api/events", baseUrl));
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const reader = stream.body?.getReader();
    if (!reader) throw new Error("no response body");

    await post(new URLSearchParams({ courseCode, reason: liveReason }));

    const decoder = new TextDecoder();
    let received = "";
    while (!received.includes(liveReason)) {
      const { value, done } = await reader.read();
      if (done) throw new Error("stream ended before the event arrived");
      received += decoder.decode(value, { stream: true });
    }
    await reader.cancel();
    expect(received).toContain(`data: `);
    expect(received).toContain(liveReason);
  }, 10_000);
});
