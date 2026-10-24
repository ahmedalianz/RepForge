# Active workout — Kinetic Obsidian

The user-supplied HTML and screenshot define presentation: RepForge session header,
elapsed time, pinned rest timer, tonal exercise panels, lime active rows, amber
historical performance, tactile completion targets, manual load controls, exercise
queue and finish/discard footer. Components reuse the existing palette, typography,
Button, Card, Text, icons and spacing tokens. No web runtime or new package is used.

## Layout and real data

The header and timer remain visible while sets and exercise rows are virtualized.
All input/check/action targets are at least 48 points. Below 430 points, previous
performance moves from its table column to the active-row caption so decimal loads
remain readable. The plate-stepper label moves above its controls on narrow screens.
Safe-area insets protect both platforms. Light/system appearance also uses the
existing semantic theme, with the dark screenshot as the default.

A new freestyle session starts empty. The picker uses a small seeded catalog of ten
exercise definitions. The reference's program, prescribed sets, weights, previous
PR and targets appear only when actual persisted data supports them; they are not
fabricated. Routine editing is still future work. Previous Best means highest
completed external working-set load, breaking ties by reps, from completed sessions
before this session. Bodyweight/assisted exercises show a previous recorded set
instead of claiming an external-load PR. The queue permits reviewing all exercises,
with a remaining-exercise count. Exercise Details remains a foundation placeholder.

## Persistence and input

Migration 003 adds `session_exercises` and `workout_runtime` without resetting the
existing database. Existing set membership is backfilled. The repository checks
session ownership, active status, exercise load semantics and finite numeric input.
Parameterized writes and transactions protect completion, rest deadlines and
selection together. Finishing requires at least one completed set; unfinished sets
remain unlogged after confirmation. Discard marks a session abandoned and excludes
it from progress without deleting its rows.

Valid edits are saved immediately; incomplete decimal or invalid input remains local
until corrected and is not guaranteed to survive process termination. RPE is optional
and constrained to 0–10; completed sets require whole positive reps. kg is canonical.
Editing only reps or RPE in lb preserves the exact saved kg value rather than
round-tripping the rounded display. Bodyweight uses NULL load; assisted load is
positive assistance, distinct from external weight and excluded from volume/PRs.

Load steps are manual adjustments in the selected unit, clamped at zero. New sets
start blank rather than automatically prescribing weight. Completion starts a
120-second rest deadline. +30s extends a running deadline or starts a 30-second
window; Skip clears it. The countdown is derived from persisted wall-clock time,
including after backgrounding or restart; no background notification is scheduled.
Set completion can be undone while the session is active. Finished sessions are
read-only. No recommendation engine, fabricated program or AI insight is introduced.
