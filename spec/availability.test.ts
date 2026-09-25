import { describe, expect, it } from "vitest";
import { computeAvailability, formatNextOpen, sydneyNowKey } from "../src/lib/availability";
import type { MenuItem } from "../src/lib/menu";

// Pure unit tests against fixed `now` instants — no server, no clock reads.
// These are what actually prove the timezone/edge-case handling the brief
// asks for, independent of whatever the seed data in menu.ts says today.

const item = (overrides: Partial<MenuItem>): MenuItem => ({
  slug: "test",
  label: "Test",
  href: "/test/",
  opensDate: null,
  opensTime: null,
  closesDate: null,
  closesTime: null,
  ...overrides,
});

describe("computeAvailability", () => {
  it("is always available when neither bound is set", () => {
    const result = computeAvailability(item({}), new Date("2026-01-01T00:00:00Z"));
    expect(result.available).toBe(true);
  });

  it("opens exactly on its opening date (inclusive at midnight Sydney time)", () => {
    const opensToday = item({ opensDate: "2026-09-25", opensTime: null });

    // 2026-09-25T00:00 Sydney (AEST, +10) is 2026-09-24T14:00Z.
    const midDayOnOpen = computeAvailability(opensToday, new Date("2026-09-25T04:00:00Z"));
    expect(midDayOnOpen.available).toBe(true);

    const dayBeforeLateNight = computeAvailability(opensToday, new Date("2026-09-24T13:59:00Z"));
    expect(dayBeforeLateNight.available).toBe(false);
  });

  it("formats a known future date + time (AEDT, after the Oct DST switch) exactly", () => {
    const courseEnrolment = item({ opensDate: "2026-10-12", opensTime: "09:00" });
    const result = computeAvailability(courseEnrolment, new Date("2026-10-01T00:00:00Z"));
    expect(result).toEqual({
      available: false,
      nextOpenText: "12 October 2026, 9:00 AM",
    });
  });

  it("formats a known future date with no time (AEST, before the Oct DST switch) exactly", () => {
    const leaveOfAbsence = item({ opensDate: "2026-10-01", opensTime: null });
    const result = computeAvailability(leaveOfAbsence, new Date("2026-09-01T00:00:00Z"));
    expect(result).toEqual({
      available: false,
      nextOpenText: "1 October 2026",
    });
  });

  it("has no known reopening date when the window has already closed", () => {
    const graduationApplication = item({ closesDate: "2026-08-31", closesTime: null });
    const result = computeAvailability(graduationApplication, new Date("2026-09-25T00:00:00Z"));
    expect(result).toEqual({ available: false, nextOpenText: null });
  });

  it("flips exactly at the Sydney instant, not the UTC instant", () => {
    // 2026-10-01T00:00 Sydney is AEST (+10, DST starts 2026-10-04) — i.e.
    // 2026-09-30T14:00Z. A UTC-midnight comparison would flip a day early.
    const leaveOfAbsence = item({ opensDate: "2026-10-01", opensTime: null });

    const justBefore = computeAvailability(leaveOfAbsence, new Date("2026-09-30T13:59:00Z"));
    expect(justBefore.available).toBe(false);

    const justAfter = computeAvailability(leaveOfAbsence, new Date("2026-09-30T14:01:00Z"));
    expect(justAfter.available).toBe(true);
  });
});

describe("sydneyNowKey", () => {
  it("never emits an hour of 24 at exact midnight", () => {
    // 2026-09-25T00:00 Sydney (AEST, +10) is 2026-09-24T14:00Z.
    const key = sydneyNowKey(new Date("2026-09-24T14:00:00Z"));
    expect(key).toBe("2026-09-25T00:00");
  });
});

describe("formatNextOpen", () => {
  it("omits the time when none is known", () => {
    expect(formatNextOpen("2026-10-01", null)).toBe("1 October 2026");
  });

  it("renders a known time in upper-case AM/PM", () => {
    expect(formatNextOpen("2026-10-12", "09:00")).toBe("12 October 2026, 9:00 AM");
  });
});
