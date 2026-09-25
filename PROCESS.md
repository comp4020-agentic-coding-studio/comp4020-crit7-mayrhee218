# Process overview

## What I built

ANUHub, a small original prototype of ANU's student administration portal,
built around one pain point: several of its real menus are only open during
specific windows, and there's no way to tell when a closed one reopens.
`README.md` has the full account of what the app is and what good looks like
here; this is how I got there.

## How I got here

I gave the agent (Claude Code) the feature request directly — make
unavailable menu items visibly disabled, unclickable, and show their exact
next-open date/time, driven by one source of availability data instead of
hardcoded dates, and cover the edge cases named in the brief: a menu opening
today, a menu with no known reopening date, and timezone/date-boundary
correctness:

> I want to improve ANUHub [...] by making unavailable menu items more
> transparent to students [...] identify menus currently outside their
> opening period, style them as clearly disabled [...] display the exact next
> opening date/time [...] reusing a single source of availability data rather
> than hardcoding dates [...] test edge cases such as a menu opening today, a
> menu that has no known reopening date, and timezone/date-boundary issues.

Since there's no real ANUHub codebase in this repo, the agent first said so
explicitly and proposed treating this as an original prototype borrowing the
real pain point, rather than inventing a fake upstream to "improve." I agreed
with that framing before anything was built. It then read the starter's own
conventions (routing, the Drizzle/SQLite data layer, the SSE broadcast
pattern, the CI checks that curl `/api/events` by literal path) and put a
full plan in front of me before writing code — data model, the timezone
approach, every file it intended to touch — rather than starting to edit.

The design decision I pushed back least on and am most glad I didn't: instead
of storing opening/closing dates as UTC instants and converting, the agent
compares Sydney-local wall-clock strings directly (`"YYYY-MM-DDTHH:MM"`),
sidestepping the AEST/AEDT DST switch entirely rather than getting the
arithmetic almost right. `spec/availability.test.ts` asserts the exact
instant either side of a Sydney midnight that isn't UTC midnight, which is
the test that would have caught the bug the naive approach invites.

Implementation hit one real snag: `drizzle-kit generate` needs an interactive
terminal to resolve an ambiguous schema diff (rename vs. create+drop), which
the sandboxed shell doesn't have. Since the old table had no real data on it,
the fix was to delete the stale migration and regenerate clean rather than
fight the prompt.

Everything landed in one commit,
[`a2d658c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-mayrhee218/commit/a2d658c),
verified with `pnpm check` (83 tests: the availability edge cases, an HTTP-level
check that a closed page shows its gating text and an open one doesn't, and
the persisted-request round-trip over SSE) and then by hand against both
`pnpm preview` and the deployed
[Fly URL](https://comp4020-crit7-mayrhee218.fly.dev/) before calling it done.
