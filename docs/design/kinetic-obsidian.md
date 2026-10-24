# RepForge — Kinetic Obsidian

The supplied design markdown and Stitch dashboard HTML guide the native design.
This is a React Native implementation: no WebView, Tailwind runtime, remote font
requests, online profile image dependency, or added UI framework is required.

## Canonical tokens

- `src/app/theme/palette.ts` preserves the supplied Material color palette.
- `src/app/theme/tokens.ts` maps it to application roles, typography, spacing,
  minimum control sizes, radii and transient elevation.
- The supplied HTML uses `primary-fixed` (#C6F26A) for action buttons and active
  states even though Material `primary` is white. Semantic `colors.primary` maps
  to `primary-fixed`; the raw white Material token remains available in the palette.
- Canvas is #101419, cards #1C2025, navigation #181C21, high surfaces #262A30,
  inset panels #0A0E13, primary text #E0E2EA, secondary text #C4C9B3. These follow
  the rendered HTML/frontmatter where the prose has a different palette.
- The prose's 16 px card corner requirement takes priority over the HTML export's
  conflicting 12 px `rounded-xl`. Inner controls use 8 px; status pills use full radii.
- The supplied dashboard screenshot takes precedence for surface treatment: static
  cards are borderless, while the hero uses a subtle tonal gradient and primary
  actions use the small lime glow shown in the reference.
- Plus Jakarta Sans weights 400/600/700/800 are bundled on both platforms.
  Static font instances come from Google's official variable font. The SIL OFL
  license is retained in `assets/fonts/OFL.txt`.
- Native font sizes use density-independent points. Letter spacing is converted
  from em to points. Metric variants enable tabular numerals. Controls are at least
  48 × 48; primary buttons are 56 px high.
- The existing light theme remains supported with the same semantic hierarchy.

## Dashboard implementation

The screen composes a fixed safe-area brand header, greeting and next-session
strip, workout launcher, weekly activity, load chart, recent PR and three metrics.
A custom React Navigation tab bar retains four real tabs and places a raised
quick-start action in the center; that action navigates rather than creating a
fifth tab. Header profile, primary CTA, record card and tab actions are accessible.

`Screen`, `Card`, `Button`, `Text` and `Icon` remain the shared primitives. Feature
components own dashboard presentation; `useDashboard` owns focus/app-resume/minute
refresh and error/retry state; the data module reads SQLite through the existing
adapter. No workout history is copied into Zustand.

## Live data and deliberate differences from the sample

The sample's Alex identity, advanced-lifter level, Push A schedule, 14-day streak,
weekly goal and metrics are illustrative. They are not seeded or represented as
real training data. There is no identity/scheduling/gamification model yet.

- Greeting follows device-local time, addressed to “lifter”. The hero starts a
  freestyle workout or resumes the SQLite session already in progress.
- Weeks run Monday–Sunday in device-local time. Empty days mean “no workout
  recorded”, not a prescribed rest day. No default five-workout target is invented.
- Completed workouts and elapsed session time use completion timestamps. Daily
  external volume uses completed-set timestamps and the selected display unit.
- Migration 002 creates `completed_external_working_sets`: completed sessions,
  completed external working sets, positive reps. Warmups, bodyweight, assistance,
  active sessions and abandoned sessions do not inflate load analytics.
- PR means a new highest recorded external working-set load **for that exercise**,
  regardless of reps. The latest such event is shown, including its previous-load
  delta. A later backoff set does not erase it. This does not claim a rep-specific PR.
- Estimated 1RM is separately labeled and uses the tested Epley module, within its
  configured rep range. The sample's 120 kg × 5 gives **140 kg**, not 138 kg.
- “Monthly velocity” has no defined measurement in the source. The implementation
  instead labels a factual **30-day load** change versus the preceding contiguous
  30-calendar-day window. A zero prior baseline displays a dash, not infinity.
  Volume change is not a strength gain or training recommendation.
- Volume and active time are weekly in scope; Total Workouts is the lifetime
  completed-session count. No fabricated
  avatar, online indicator, AI insight or automatic loading recommendation appears.

A clean database therefore shows zeros, neutral daily markers and a clear first-PR
state while retaining the same visual structure. Recorded data fills these panels
without changes to the view components.

## Rename and persistence

The app/module/targets are `RepForge`; the npm name is `repforge`; the pre-release
native identifiers are `com.repforge.app`. Old `com.muscleforge.app` simulator/device
installs remain separate apps and their private data containers are not moved.
The database filename `muscleforge.sqlite` is intentionally retained internally;
existing files in the same app container upgrade through migrations without reset.
No existing migration is edited and no table is recreated at startup.

## Follow-up

Implement the exercise picker/set logging from the next Stitch screen. Add profile
identity, user-chosen weekly targets and actual routine scheduling only with explicit
models and flows. Add a native data-container migration if pre-release installs need
transfer before the identifier is finalized for store distribution.

## Screenshot alignment

The dashboard screenshot supplied after the HTML export is the visual reference.
The native implementation now uses its single-line brand header, compact greeting
and next-session strip, borderless surfaces, tonal hero, left-aligned CTA, muted
historical bars, solid amber PR badge, inset metric rows and three compact stat
cards. The outer purple editor frame is not application chrome.

Sample identity/scheduling/weekly targets remain unmodeled; the app keeps accurate
live content and empty states. The second PR metric stays labeled 30-Day Load
because “monthly velocity” is not a defined strength measure in this foundation.
Estimated 1RM remains calculated rather than copying the screenshot's 138 kg.

Screenshot-alignment validation: 37 tests, TypeScript, ESLint and Prettier passed.
The updated JavaScript dashboard was reloaded and visually inspected on iPhone
17 Pro/iOS 26.5 and Pixel 10/API 37 using the existing native debug builds.
No native library or build configuration changed for this visual refinement.
