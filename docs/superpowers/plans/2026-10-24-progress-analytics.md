# Progress analytics implementation plan

Implement the supplied Kinetic Obsidian progress design in the existing bare React
Native app, in place. Preserve user changes and avoid new packages or migrations.

1. Test `readProgress(database, now)` with real SQLite: completed sessions only,
   external working sets for load analytics, all completed working sets for counts,
   deterministic load records, and actual session durations. Read into a typed
   progress snapshot; reuse the dashboard's load-record query rather than duplicate it.
2. Test `summarizeProgress(snapshot, exerciseId, range, now)` independently of RN:
   rolling calendar ranges, daily best Epley estimates for positive loads/1–10 reps,
   no implicit zero baseline, six local calendar weeks, push/pull/legs/other counts,
   selected-exercise all-time record, interval volume and consistency. Unknown muscle
   groups stay Other; warm-ups, incomplete and abandoned data cannot inflate metrics.
3. Compose feature UI: reuse the shared training header, theme, Card/Text/Button,
   SVG and preference persistence. Add accessible segmented controls, range chips,
   searchable exercise selection, line/area chart and stacked six-week bars. Keep
   missing data empty. History opens a virtualized recorded-load ledger and rows
   open the source workout. Training note summarizes logged data without prescribing.
4. Exercise real-repository UI filters, lb conversion, chart accessibility and
   history navigation with RNTL. Run the complete Jest suite, typecheck, ESLint and
   formatting. Reload both existing native apps; inspect and exercise iOS via CUA.
   Report Android interaction limits honestly if the window remains inaccessible.

Review focus: same-time record tie ordering; current/previous interval boundaries;
calendar month-end dates; assisted/bodyweight exclusion from external load; first
record is not a measured 1RM; estimates must not imply a progression prescription.
