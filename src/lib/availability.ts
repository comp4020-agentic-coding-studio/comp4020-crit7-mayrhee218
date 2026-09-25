import type { MenuItem } from "./menu";

// Every date/time in menu.ts is a Sydney-local wall-clock string. Comparing
// wall-clock strings directly — instead of converting to UTC instants and
// doing date arithmetic — sidesteps DST entirely: Sydney flips AEST↔AEDT on
// the first Sundays of October and April, and getting that arithmetic wrong
// is exactly the kind of bug this avoids by construction.

const SYDNEY_TZ = "Australia/Sydney";

/** `now` as a zero-padded "YYYY-MM-DDTHH:MM" string in Sydney local time. */
export function sydneyNowKey(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SYDNEY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  // Some ICU builds render midnight as hour "24" under hour12:false.
  const hour = get("hour") === "24" ? "00" : get("hour");
  const minute = get("minute");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export type Availability =
  | { available: true }
  | { available: false; nextOpenText: string | null };

export function computeAvailability(item: MenuItem, now: Date): Availability {
  const opensKey = item.opensDate ? `${item.opensDate}T${item.opensTime ?? "00:00"}` : null;
  const closesKey = item.closesDate ? `${item.closesDate}T${item.closesTime ?? "23:59"}` : null;
  const nowKey = sydneyNowKey(now);

  const notYetOpen = opensKey !== null && nowKey < opensKey;
  const pastClose = closesKey !== null && nowKey > closesKey;
  const available = !notYetOpen && !pastClose;

  if (available) return { available: true };

  return {
    available: false,
    nextOpenText: notYetOpen && item.opensDate ? formatNextOpen(item.opensDate, item.opensTime) : null,
  };
}

/** "1 October 2026" or "1 October 2026, 9:00 AM" (Sydney local). */
export function formatNextOpen(date: string, time: string | null): string {
  const [year, month, day] = date.split("-").map(Number);
  // Noon UTC keeps the calendar date stable across the whole globe, avoiding
  // any chance of the date formatter rendering the day before/after.
  const dateOnly = new Date(Date.UTC(year, month - 1, day, 12));
  const dateText = new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateOnly);

  if (!time) return dateText;

  const [hour24, minute] = time.split(":").map(Number);
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minuteText = minute === 0 ? "00" : String(minute).padStart(2, "0");
  const timeText = minute === 0 ? `${hour12}:00 ${period}` : `${hour12}:${minuteText} ${period}`;

  return `${dateText}, ${timeText}`;
}
