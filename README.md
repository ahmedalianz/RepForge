# RepForge

Offline-first strength training foundation for iOS and Android. Bare React Native
CLI, TypeScript strict mode, Hermes and the New Architecture. This repository was
converted in place from RN Lab; notification experiments, Firebase, demo assets and
custom splash dependencies have been removed.

## Prerequisites

- Node **24 LTS, >=24.3 and <25** (`nvm use`); npm 11.16.0, using `package-lock.json`.
- Watchman is recommended for Metro on macOS.
- Android Studio, **JDK 17**, Android SDK platform **37**, Build Tools **37.0.0**,
  NDK **27.1.12297006**. Set `ANDROID_HOME` and add platform-tools to your PATH.
  Gradle **9.4.1** is pinned by the wrapper. Android minimum API is **24**, target **36**.
- iOS: macOS, **Xcode 26+**, iOS simulator or provisioned device; deployment target
  **15.1**. Ruby and Bundler **4.0.11** (`gem install bundler -v 4.0.11`). The checked-in
  bundle was resolved with Ruby **4.0.5**. Gemfile explicitly includes libraries
  removed from Ruby's standard distribution. CocoaPods is pinned in `Gemfile.lock`.

## Installation and running

```sh
nvm use
npm ci
bundle install
npm run pods
npm start
```

In another terminal, with an emulator/device available:

```sh
npm run android
npm run ios -- --simulator "iPhone 17 Pro"
```

Open `ios/RepForge.xcworkspace` in Xcode after pod installation. Both native
projects register `RepForge`, with bundle/application ID `com.repforge.app`.
The identifier is a valid placeholder; confirm ownership before store submission.

If another app owns Metro port 8081:

```sh
npm start -- --port 8082
npm run android -- --port 8082 --no-packager
npm run ios -- --port 8082 --no-packager
```

With RN 0.88 prebuilt iOS pods, a custom Metro port may also need the simulator's
debug preference (then relaunch the app):

```sh
xcrun simctl spawn booted defaults write com.repforge.app RCT_jsLocation -string localhost:8082
```

No credentials, Firebase files, backend or internet connection are needed for app
features. First-time dependency resolution and native builds need network access.

## Structure

```text
App.tsx                          # Platform providers and composition
src/
  app/
    config/preferencesStore.ts   # Zustand preference cache
    navigation/                 # Typed native stack, four bottom tabs, SVG icons
    providers/                  # Startup, migrations, repository context
    theme/                      # Theme provider, semantic colors, reusable tokens
  features/
    home/{screens,components,hooks,domain,data}/
    workouts/
      screens/                  # Log placeholder, start/resume, active editor
      hooks/                    # Workout editor, drafts, lifecycle and timer view models
      domain/                   # Models, validation, presentation and strength calculations
    exercises/
      screens/
      components/               # Searchable local exercise picker
      data/                     # Parameterized exercise queries
      domain/
    progress/screens/           # Trends and personal records placeholders
    goals/
      screens/
      domain/
    profile/screens/            # Persisted appearance and unit preferences
  shared/
    components/                 # Text, Button, Card, Screen, EmptyState, LoadingState
    utils/                      # Pure input validation
  database/
    adapter.ts                  # Synchronous SQL and transaction boundary
    connection.ts               # Native Nitro SQLite adapter and singleton
    migrations/                 # Versioned, atomic schema changes
    repositories/               # Typed workout persistence implementation
    schema/README.md            # Schema conventions
  services/storage/             # Preference persistence
__tests__/
  domain/                       # Node-only calculations and real SQLite tests
  ui/                           # Theme and real navigator integration tests
android/
ios/
```

Only folders with responsibilities are created; add charts and notification
services when implementation actually needs them.

## Dependency decisions and compatibility

Versions were checked against npm stable tags, published peer dependencies, the
React Native CLI 0.88 template and maintainers' documentation on 24 October 2026.
`package-lock.json` pins the full dependency tree. Never use `--force` or
`--legacy-peer-deps` to bypass native compatibility checks.

| Dependency                                           | Version                 | Purpose                                                    |
| ---------------------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| React Native / React                                 | 0.88.0 / 19.3.0         | Stable CLI template, Hermes, New Architecture              |
| React Navigation native / native stack / bottom tabs | 7.5.1 / 7.18.8 / 7.21.0 | Type-safe routes and platform navigation                   |
| Screens / Safe Area Context                          | 4.30.0 / 5.10.1         | Native navigation views and safe-area insets               |
| Zustand                                              | 5.0.16                  | Lightweight application preferences                        |
| Nitro SQLite / Nitro Modules                         | 10.2.0 / 0.37.1         | Native local SQLite and JSI integration                    |
| Reanimated / Worklets                                | 4.7.1 / 0.13.0          | Future animation support; Worklets Babel plugin last       |
| Gesture Handler                                      | 3.4.0                   | Native gesture foundation                                  |
| SVG                                                  | 15.16.0                 | Tab icons and future visualizations                        |
| RNTL / test-renderer                                 | 14.1.0 / 1.3.1          | Async React 19 UI tests; no deprecated React Test Renderer |
| Jest / TypeScript / ESLint / Prettier                | 29.7 / 6.0 / 8.57 / 3.9 | CLI-compatible development tools                           |

Official references:

- [React Native releases](https://reactnative.dev/releases/)
- [React Native environment](https://reactnative.dev/docs/set-up-your-environment)
- [React Navigation native setup](https://reactnavigation.org/docs/getting-started/)
- [Reanimated compatibility matrix](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/)
- [Nitro SQLite requirements](https://sqlite.margelo.com/docs)
- [SVG / Fabric compatibility](https://github.com/software-mansion/react-native-svg#supported-react-native-versions)

Reanimated 4.7 explicitly supports RN 0.86–0.88 with Worklets 0.13.x. Nitro SQLite
requires RN >=0.75, React >=17 and Nitro Modules >=0.35; we use the documentation's
recommended Nitro 0.37.1. Nitro SQLite was selected over older bridge SQLite
packages for its maintained native implementation, parameterized queries and
New Architecture support. Its optional TypeORM integration is unused; its package
currently brings TypeORM transitively. No ORM, backend or sync layer is configured.

The official RN config advertises ESLint 9, but its `eslint-plugin-ft-flow@2`
transitive dependency still requires ESLint 8 and fails under 9. We retain the
CLI template's ESLint 8.57.1 with no peer bypass/override; migrate when RN's entire
lint dependency chain supports the newer major. The lint script resolves plugins
relative to the official config so it also works with nested npm layouts. ESLint 8 is end-of-life, a known
upstream tooling limitation. Prettier uses current stable 3.x. Jest remains on
29.7 because RN 0.88's official preset ships Jest 29 Babel/environment integrations.

## Architecture

Screens compose shared primitives and feature UI. `useWorkoutSession` provides
MVVM-style state/actions where lifecycle and repository interaction warrant it.
Pure domain functions import no React Native or storage modules. A small concrete
repository factory provides a typed boundary without a DI container, base class or
unnecessary service hierarchy.

The root native stack wraps Home, Workouts, Progress and Profile tabs and exposes
Start Workout, Workout Details, Exercise Details, Personal Records and Goals.
Detail routes carry IDs rather than whole database objects. Android installs the
Screens fragment factory for Activity recreation and disables predictive back per
React Navigation's current installation instructions. Navigation handles vertical
safe areas; content protects horizontal landscape insets.

Dark is the default. Appearance can be dark, light or system; user preferences are
written to SQLite before Zustand updates. Shared color, spacing, typography,
radius, shadow and touch-target tokens make future Google Stitch design adoption
straightforward. The Home dashboard follows the supplied Kinetic Obsidian design; the active workout editor follows the supplied workout design; other feature screens remain foundation placeholders. See [design decisions](docs/design/kinetic-obsidian.md).

## Database strategy

`muscleforge.sqlite` (legacy filename retained for data continuity) is the source of truth. Startup opens it once, enables foreign
keys, WAL and FULL synchronous durability, then migrates transactionally using
`PRAGMA user_version`. A failed migration rolls back; the app displays the error
and Retry without deleting data. Newer schemas are rejected rather than downgraded.
Append sequential migrations after release; never modify a shipped migration.

The schema covers exercises, secondary muscles, routines, ordered routine
exercises, workout sessions, sets, goals and preferences. Foreign keys, checks and
indexes enforce relationships, valid statuses, goal scope and load semantics.
One active session is enforced by a partial unique index. Starting a workout
returns the existing active session when present; restarting the app does not
lose it. Set writes use parameter binding and an upsert, and reject edits to
finished sessions. Write each set as it is logged; do not rely on background or
termination callbacks. A completed workout timestamp and status update atomically.

IDs are SQLite-generated UUIDs for sessions and sets. The starter exercise catalog
uses stable named IDs; user-created exercises should use the shared UUID generator. All timestamps are UTC Unix
milliseconds; convert to local time for display only. Canonical weights are **kg**;
convert units only at the presentation/input boundary, with no persistence rounding.
Bodyweight sets store NULL weight; assisted sets store positive assistance separately
from external load through `load_type`. They are excluded from external volume.

The initial small transaction API is synchronous and deliberately contains no
`await`. Native SQL is behind one adapter. Keep transactions short; introduce
queued background queries/pagination behind this boundary when history analytics
warrants it. SQLite is not encrypted in this foundation; no credentials or sensitive
secrets are stored. Export, retention and encryption requirements need explicit
product decisions before release. There is no cloud synchronization.

## Strength calculations

`src/features/workouts/domain/strength.ts` contains independently tested functions:

- Epley: `weightKg * (1 + reps / divisor)`, default divisor 30, default valid reps
  1–10; a single repetition returns its recorded load. Defaults are configurable.
  Returns an **estimate**, not a measured maximum; not used for automatic loading.
- RPE = 10 − RIR; finite RIR 0–10, including fractional subjective estimates.
- Volume load: sum of kg × reps for completed external working sets. Warmups can
  be included explicitly. Incomplete, bodyweight and assisted sets are excluded.
- kg/lb conversion uses the exact international pound relationship without rounding.
- Goal progress measures baseline-to-target change, supports increasing/decreasing
  goals and clamps to 0–100. Equal baseline/target is rejected as undefined.

Invalid, negative and non-finite numeric inputs throw. Reps must be safe integers.
Recorded and estimated PRs have distinct discriminated types. Volume load alone
is not a measure of hypertrophy or strength; comparing it requires exercise and
range-of-motion context. These utilities do not prescribe training or aggressive
weight progression. Formulas should only be applied to eligible exercise types.

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run test:domain
npm run format:check
npm run format
```

Domain tests run under Node with no React Native runtime. SQLite tests use Node
24's built-in SQLite on actual temporary database files and the production SQL,
transaction adapter, migration runner and repository. UI tests use RNTL 14's async
API and real navigators, replacing native views and the repository boundary only.
Tests cover estimates, conversions, eligibility, invalid inputs, rollback, schema
version protection, constraints, persistence across reopen, themes and routes.

For restricted environments, `npm test -- --watchman=false` avoids Watchman socket
access. Native smoke checks should start a session, force-stop/relaunch, resume it,
change appearance/unit preferences and verify they survive another restart.

For Android compilation only:

```sh
cd android
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
```

Do not ship debug signing. The release variant is intentionally unsigned; configure
private release signing and App Store provisioning separately before distribution.
No signed store archive is produced by this task.

### Foundation validation — 24 October 2026

- TypeScript strict check, ESLint (zero warnings), Prettier and all **29 tests** passed.
- npm dependency audit: **0 known vulnerabilities**; no unresolved ESLint peers.
- Android: debug arm64 build succeeded; installed and rendered on Pixel 10 emulator.
  Created a session, force-stopped/relaunched, and verified the same active session
  ID and start timestamp in the native SQLite file. The Resume route also rendered.
- iOS: Xcode 26.6 debug simulator build succeeded; installed and rendered on iPhone
  17 Pro / iOS 26.5. Verified native SQLite schema version 1 and saved preferences.
- CLI 20.2's custom `--buildFolder` install path lookup failed after compilation;
  installed that successful build with `simctl` instead. Normal documented run
  commands use the default build directory. A custom Metro port required the
  simulator debug preference described above.
- Physical devices, signed release builds, store submission and release-mode
  offline launch remain unverified. This records the original foundation validation; dashboard/rename validation is recorded below.

## Next work

1. Implement routine editing and exercise management against the normalized tables,
   then connect planned exercise/set counts to the dashboard and active editor.
2. Add physical-device and accessibility QA for logging, keyboard input, large text,
   landscape layout and interrupted-session recovery.
3. Implement measured PRs, separately labeled estimated PRs, history and paginated
   analytics. Add goal creation/updates with explicit baseline semantics.
4. Add export/restore, accessible design QA, release icons/splash and privacy review.
5. Validate on physical devices, configure signing, add CI native builds and prepare
   store metadata. Authentication, payments, OTA and cloud sync are outside scope.

## RepForge dashboard update

The app and both native targets are now RepForge (`com.repforge.app`). Home implements
the supplied Kinetic Obsidian design with bundled Plus Jakarta Sans, a raised quick
start action, weekly activity, external-load analytics, PRs and real-data empty states.
See `docs/design/kinetic-obsidian.md` for token precedence, data definitions and rename
behavior. Sample identities, schedules and training history are not seeded.

Migration 002 adds the shared analytics view and preserves existing rows. Home code
lives in `src/features/home/{screens,components,hooks,domain,data}`. New helpers remain
React Native independent and are covered by Node/real-SQLite tests.

Rename/dashboard validation: **37 tests passed** across five suites; TypeScript,
ESLint and Prettier passed. Final Android arm64 debug and iOS simulator debug builds
both succeeded and launched. Verified the dashboard on Pixel 10/API 37 and iPhone
17 Pro/iOS 26.5, including local fonts and migration 002. Android and iOS consume a
single `assets/fonts` source. Release signing and physical-device QA remain future work.

## Active workout editor

The supplied active workout design is implemented as native components with a
pinned session header and rest countdown, a virtualized set list, active-set
inputs, manual load steps, completion/undo, warm-up/working-set options, exercise
selection, and finish/discard actions. See [behavior and design details](docs/design/active-workout.md).

Migration 003 adds ordered session exercise membership and persisted selection/rest
deadlines, and seeds ten exercise definitions without generating training history.
Valid edits save immediately to SQLite; canonical kg values survive unit changes.
Minimize and restart preserve the session, selected set and active rest deadline.
The editor uses feature components and custom view-model hooks; Zustand continues
to hold preferences, while SQLite owns workout data. No dependency was added.

Active editor validation: **46 tests across seven suites**, strict typechecking,
ESLint and formatting pass. Tests use real SQLite for migration, transaction rollback,
set validation, bodyweight/assisted semantics, recovery and navigation/logging flows.
The iOS simulator was exercised through set input, completion, rest countdown,
exercise selection and force-stop/resume; saved draft values and the timer survived.
The existing Android debug app relaunched successfully. Interactive active-editor
QA on Android remains unverified because computer-use tooling could not attach to
the emulator window. This update adds no native dependencies; native builds were
validated in the dashboard update above, not repeated for these TypeScript changes.
