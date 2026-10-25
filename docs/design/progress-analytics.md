# Progress analytics — Kinetic Obsidian

The Progress tab implements the supplied layout with the shared RepForge header,
three view segments, exercise and kg/lb controls, date chips, lime SVG trajectory,
four metric cards, a six-week stacked split chart, recorded history and a training
summary. The design uses bundled Plus Jakarta Sans and existing theme tokens.
No chart package, backend, new database table or recommendation engine is added.

## Controls and scope

| Control / section            | Meaning                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Strength & 1RM               | Daily best Epley estimate for the selected exercise; completed external working sets with positive load and 1–10 reps only. |
| Volume                       | External load × reps by training day, across all exercises.                                                                 |
| Consistency                  | Completed sessions by calendar day, across all exercises; days without a recorded workout are zero.                         |
| Exercise picker              | Selects the exercise for strength, recorded load PR, estimated max and last logged set.                                     |
| KG / LB                      | Persists the app preference before updating display; database weights stay kg.                                              |
| 1M / 3M / 6M / 1Y / ALL      | Rolling calendar range ending now; start is local midnight, with month-end clamping.                                        |
| All-time load PR             | Highest recorded external working-set load for the selected exercise, breaking load ties by reps; independent of the range. |
| Est. max                     | Highest eligible daily estimate in the selected range.                                                                      |
| Period volume / working sets | All exercises in the selected range; working-set count also includes bodyweight and assisted sets.                          |
| Split breakdown              | Completed working sets by primary muscle in six Monday-based local weeks; independent of the range chips.                   |
| Record history               | All-time load milestones across exercises; History opens the virtualized ledger, and rows open their source workout.        |

Chart arrows inspect individual dates with 48-point touch targets. An inspected
date stays selected across refreshes; if it disappears, selection falls back to the
latest available date. Without manual selection, the chart follows the latest day.
Consistency includes every local calendar day in the range (ALL begins at the first
recorded workout), including trailing zero-workout days through today. A range with
no sessions keeps its empty state. Values
and dates are also exposed to screen readers. A single day appears as a point;
missing history is an empty state, not a fabricated line. The percentage beside
strength compares first/last eligible training days, not lifetime maximums. Volume
compares the selected interval to the preceding calendar interval. An absent or
zero baseline displays no percentage rather than infinity or an invented gain.

## Data boundaries

Only finished sessions dated no later than now contribute. Warm-ups, uncompleted
sets and abandoned sessions are excluded from working-set analytics. Bodyweight
and assisted sets contribute to set counts and split distribution but never to
external-load volume or estimated strength. Unknown primary muscles remain Other;
secondary muscles are not counted again. Split percentages are rounded shares of
sets, not tonnage. Logged session time includes elapsed time between start/finish.

The shared parameterized record query orders sets by completion time and stable ID
before computing strict load increases. It is reused by Home, avoiding divergent PR
rules. Records mean logged performance, not independently verified attempts or true
rep-max claims. Estimated points stay separate. Epley is retained from the tested
foundation instead of silently adopting the prototype's Brzycki label/sample 138 kg.

## Intentional prototype differences

No sample lifter history, training cycle, target adherence or prescribed next load
is inserted. The note summarizes actual working sets, sessions and last logged
performance. It cannot infer recovery or prescribe a 2.5 kg increment. Volume alone
is not a standalone measure of strength or hypertrophy. Routine planning remains
future work. Calendar helpers, duration formatting and the brand header are shared
with Home; pure analytics depend on neither React Native nor storage.

The repository reads completed history once on focus/resume and refreshes while
focused. For very large histories, move daily aggregates/paging into SQL behind the
same repository boundary. SQLite remains authoritative; filter state is local and
only unit/theme preferences are cached in Zustand.
