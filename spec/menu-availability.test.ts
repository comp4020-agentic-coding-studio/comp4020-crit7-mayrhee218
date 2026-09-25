import { JSDOM } from "jsdom";
import { describe, expect, inject, it } from "vitest";

// The availability feature end to end, against the running app: open items
// are real links, closed items are genuinely unclickable buttons with the
// exact next-open text, and a closed page can't be reached directly either.
const baseUrl = inject("baseUrl");

async function loadNav() {
  const res = await fetch(baseUrl);
  const dom = new JSDOM(await res.text());
  const nav = dom.window.document.querySelector("nav");
  if (!nav) throw new Error("no <nav> found");
  return nav;
}

function menuItemByLabel(nav: Element, label: string): Element {
  const item = [...nav.querySelectorAll(".menu-item")].find((el) => el.textContent?.trim() === label);
  if (!item) throw new Error(`no menu item labelled "${label}"`);
  return item;
}

function hintFor(nav: Element, item: Element): string {
  const id = item.getAttribute("aria-describedby");
  if (!id) throw new Error(`"${item.textContent}" has no aria-describedby`);
  const hint = nav.querySelector(`#${id}`);
  if (!hint) throw new Error(`no hint element with id "${id}"`);
  return hint.textContent ?? "";
}

describe("menu availability", () => {
  it("renders an open item as a real link with no disabled state", async () => {
    const nav = await loadNav();
    const specialConsideration = menuItemByLabel(nav, "Special Consideration");
    expect(specialConsideration.tagName).toBe("A");
    expect(specialConsideration.hasAttribute("href")).toBe(true);
    expect(specialConsideration.hasAttribute("disabled")).toBe(false);

    const feePayment = menuItemByLabel(nav, "Fee Payment");
    expect(feePayment.tagName).toBe("A");
    expect(feePayment.hasAttribute("disabled")).toBe(false);
  });

  it("renders a closed item as a disabled, unfocusable button", async () => {
    const nav = await loadNav();
    const courseEnrolment = menuItemByLabel(nav, "Course Enrolment");
    expect(courseEnrolment.tagName).toBe("BUTTON");
    expect(courseEnrolment.hasAttribute("disabled")).toBe(true);
    expect(courseEnrolment.hasAttribute("href")).toBe(false);
  });

  it("shows the exact next-open date and time for a known future date + time", async () => {
    const nav = await loadNav();
    const courseEnrolment = menuItemByLabel(nav, "Course Enrolment");
    expect(hintFor(nav, courseEnrolment)).toBe("Available from 12 October 2026, 9:00 AM");
  });

  it("shows the exact next-open date with no time when the time is unknown", async () => {
    const nav = await loadNav();
    const leaveOfAbsence = menuItemByLabel(nav, "Leave of Absence");
    expect(hintFor(nav, leaveOfAbsence)).toBe("Available from 1 October 2026");
  });

  it("shows no date when there's no known reopening date", async () => {
    const nav = await loadNav();
    const graduationApplication = menuItemByLabel(nav, "Graduation Application");
    expect(hintFor(nav, graduationApplication)).toBe("Currently unavailable");
  });

  it("shows the gating panel, not the open content, when visiting a closed page directly", async () => {
    const res = await fetch(new URL("/course-enrolment/", baseUrl));
    const text = await res.text();
    expect(text).toContain("Available from 12 October 2026, 9:00 AM");
    expect(text).not.toContain("Enrol in courses for this session here.");
  });
});
