// The single source of truth for which ANUHub menu items exist and when
// they're available. Dates/times are Sydney-local wall-clock strings (see
// availability.ts) — never UTC instants — so DST never has to be reasoned
// about here. Nothing else in the app should hardcode a date: every page and
// component reads availability from this list via availability.ts.
export interface MenuItem {
  slug: string;
  label: string;
  href: string;
  opensDate: string | null; // "YYYY-MM-DD", Sydney local; null = no lower bound
  opensTime: string | null; // "HH:MM" 24h Sydney local; null = time-of-day unknown
  closesDate: string | null; // "YYYY-MM-DD", Sydney local; null = no known closing
  closesTime: string | null; // "HH:MM" 24h Sydney local; null → treated as end of day
}

export const MENU_ITEMS: MenuItem[] = [
  {
    slug: "special-consideration",
    label: "Special Consideration",
    href: "/special-consideration/",
    opensDate: "2026-08-01",
    opensTime: null,
    closesDate: "2026-10-15",
    closesTime: null,
  },
  {
    slug: "fee-payment",
    label: "Fee Payment",
    href: "/fee-payment/",
    opensDate: "2026-09-25",
    opensTime: null,
    closesDate: null,
    closesTime: null,
  },
  {
    slug: "course-enrolment",
    label: "Course Enrolment",
    href: "/course-enrolment/",
    opensDate: "2026-10-12",
    opensTime: "09:00",
    closesDate: null,
    closesTime: null,
  },
  {
    slug: "leave-of-absence",
    label: "Leave of Absence",
    href: "/leave-of-absence/",
    opensDate: "2026-10-01",
    opensTime: null,
    closesDate: null,
    closesTime: null,
  },
  {
    slug: "graduation-application",
    label: "Graduation Application",
    href: "/graduation-application/",
    opensDate: null,
    opensTime: null,
    closesDate: "2026-08-31",
    closesTime: null,
  },
];
