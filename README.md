# ANUHub (prototype)

This is an original prototype inspired by ANUHub, ANU's real student
administration portal — it is not a clone and doesn't reuse any of its code.
It borrows one real pain point from that site: several of its menus (course
enrolment, special consideration, fee payment, and so on) are only open
during specific windows, and outside those windows there's no clear way to
tell when a menu reopens short of guessing or emailing Student Central.

Here, every menu item in the nav is checked against a single source of
availability data. An item that's currently open renders as a normal link.
An item that isn't renders as a disabled, unfocusable button — not a link
with a fake disabled look — so it can't be clicked, tapped, or reached by
keyboard, and it carries a hint stating exactly when it opens next: an exact
date and time if both are known, a date alone if the time isn't, or "Currently
unavailable" if there's no known reopening date at all. Visiting a closed
page's URL directly shows the same message instead of its content, so the
gating isn't just a nav trick.

The one flow that's actually wired end to end is Special Consideration
(currently open): submitting a request writes it to SQLite and the new
request appears in every other open tab immediately over a server-sent-events
stream, and it's still there after a reload.

## What good looks like here

- **One source of truth for availability** (`src/lib/menu.ts`): every menu
  item's opening/closing date and time lives there, as Sydney-local
  wall-clock strings, and nowhere else. No page or component hardcodes a
  date — `grep -rn "2026-" src/pages` finds nothing.
- **Timezone correctness without DST arithmetic** (`src/lib/availability.ts`):
  rather than converting Sydney-local times to UTC instants (which requires
  reasoning about the AEST↔AEDT switch), `now` and every bound are converted
  to the *same* Sydney wall-clock representation and compared as strings.
  `spec/availability.test.ts` covers the edge cases this is for: a menu
  opening exactly today, a menu with no known reopening date, and the actual
  instant either side of a Sydney-local midnight that isn't UTC midnight.
- **Real disabled semantics, not a faked one**: unavailable items are native
  `<button disabled>` elements, which are unclickable, untappable, and
  unfocusable by keyboard for free, with no ARIA state management to get
  wrong. `spec/menu-availability.test.ts` checks this against the running
  app, not just the source.
- **Judgement calls left open**: the exact visual treatment of a disabled
  item (colour, spacing) is unenforced by any check — that's a look call, not
  a correctness one. Which five menu items exist and what their windows are
  is seed data chosen to exercise the brief's edge cases, not a claim about
  the real site's actual opening hours.

Images go in `public/` and are linked relatively — `![alt](public/before.png)`
— which renders on GitHub and at `/readme/` alike.
