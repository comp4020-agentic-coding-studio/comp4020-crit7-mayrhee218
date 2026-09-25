# Crit 7

**What was the breakthrough that moved the work forward?**

The breakthrough wasn't a line of code, it was a modelling choice: comparing
Sydney-local wall-clock strings instead of converting opening/closing times to
UTC instants. My first instinct would have been to store everything as a
timestamp and do date arithmetic on it, which is exactly where the AEST/AEDT
DST switch bites — Sydney flips twice a year and "add 10 hours" is only
sometimes true. Deciding to keep every date as a plain Sydney-local string and
never leave that representation made a whole class of boundary bugs
unreachable rather than something to test for and hope to catch. It also made
the hardest edge case in the brief — timezone/date-boundary correctness —
straightforward to actually write a test for: I could assert the exact instant
either side of a Sydney midnight and know the test meant something.

**What did this work change about who I want to be as a software developer?**

I want to be the kind of developer who picks the representation that makes a
bug impossible before writing the code that avoids it, rather than writing
careful code around a fragile one. This week also reinforced that a plan
worth reviewing before implementation is not wasted time even on something as
small as a weekly prototype — the plan surfaced the DST issue and the
"single source of truth" requirement from the brief before either was at risk
of drifting into five separate hardcoded dates across five pages.
