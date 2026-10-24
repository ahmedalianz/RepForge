# AGENTS.md — RepForge Engineering Standards

## Project

RepForge is an offline-first strength-training app for iOS and Android, built
with bare React Native CLI, TypeScript and the New Architecture. It focuses on
workout logging, progressive overload, personal records, analytics and goals.

Use the feature-first structure in `src/features`, app composition in `src/app`,
shared primitives in `src/shared`, and versioned SQLite persistence in
`src/database`. SQLite owns persisted workouts; Zustand holds application preferences.
The engineering standards below remain applicable; experiment examples illustrate
separation of responsibilities and must not reintroduce RN Lab demo features.

---

# 1. Core Engineering Principles

Always prioritize:

1. Clean code
2. Reusability
3. Separation of concerns
4. Maintainability
5. Type safety
6. Testability
7. Performance
8. Platform correctness
9. Consistent architecture
10. Minimal duplication

Do not optimize for writing code quickly at the expense of code quality.

Optimize for code that another senior engineer can understand and extend months later.

---

# 2. No Duplication — Strict Rule

Before creating ANY component, hook, utility, service, type, or abstraction:

1. Search the repository.
2. Identify existing implementations.
3. Check whether they can be reused.
4. Check whether an existing implementation can be extended with a prop, variant, or composition.
5. Only create something new if the responsibility is genuinely different.

Always prefer:

**Reuse → Extend → Compose → Create**

Never use copy-paste as the default implementation strategy.

Do NOT create similar components such as `Card`, `CardContainer`, `BaseCard`, `TechnicalCard`, `ExperimentCard`, or `ExperimentInfoCard` when one reusable component can reasonably support the requirement.

---

# 3. Do Not Over-Abstract

Do not create abstractions simply to reduce line count.

Do NOT create generic components when they are only used once, their API becomes complicated, they hide important business logic, require many boolean props, or make the code harder to understand.

Avoid components such as:

```tsx
<UniversalCard
  compact
  bordered
  elevated
  technical
  interactive
  showHeader
  showFooter
  dense
  variant="..."
/>
```

Prefer small, composable components.

Abstraction should be driven by shared responsibility and behavior, not by the desire to make everything generic.

---

# 4. Component Reuse

If the same UI pattern appears two or more times and the structure or behavior is genuinely shared, consider extracting it into a reusable component.

Common reusable components may include:

- `MetricCard`
- `StatusBadge`
- `SectionHeader`
- `CodeBlock`
- `TerminalLog`
- `PlatformBadge`
- `ExperimentCard`
- `BenchmarkChart`
- `TechnicalPanel`
- `EmptyState`
- `ErrorState`
- `LoadingState`
- `PermissionState`

Do not duplicate these patterns across screens.

---

# 5. Design System

All UI must use the existing project design system.

Never introduce arbitrary colors, font sizes, border radii, spacing, shadows, typography, or button styles when an existing design token or component exists.

Prefer centralized tokens:

```text
colors
spacing
typography
radii
shadows
```

Prefer:

```tsx
color={colors.text.primary}
padding={spacing.md}
```

over arbitrary values when a design token exists.

Do not introduce a new visual pattern without a clear reason.

---

# 6. Screen vs Component

Screens should primarily compose components.

Avoid large reusable UI structures directly inside screen files.

Prefer:

```tsx
function SSLPinningScreen() {
  return (
    <Screen>
      <ExperimentHeader />
      <ConnectionStatusCard />
      <CertificateCard />
      <PinStatusCard />
      <TerminalLog />
      <ExperimentActions />
    </Screen>
  );
}
```

Screens should orchestrate.

Components should own presentation.

Hooks should own reusable behavior and stateful logic.

Services should own external interactions.

---

# 7. Separation of Concerns

Prefer this flow:

```text
Screen
  ↓
Feature Components
  ↓
Hooks / State
  ↓
Domain Logic / Services
  ↓
Native APIs / External APIs
```

Do not mix API calls, native calls, business logic, state management, complex calculations, and large UI trees inside one screen.

---

# 8. Business Logic

Business logic must not be embedded inside JSX.

Bad:

```tsx
{batteryLevel > 80
  ? "Excellent"
  : batteryLevel > 30
    ? "Normal"
    : "Low"}
```

Prefer:

```ts
const batteryStatus = getBatteryStatus(batteryLevel);
```

Then:

```tsx
<BatteryStatus status={batteryStatus} />
```

Complex logic belongs in hooks, utilities, domain modules, or services depending on responsibility.

---

# 9. Hooks

Custom hooks should encapsulate meaningful reusable behavior.

Examples:

- `useBluetooth()`
- `useCamera()`
- `useBattery()`
- `useSensors()`
- `useCertificatePinning()`
- `useBenchmark()`
- `useNetworkMonitor()`
- `useMemoryMonitor()`
- `useEventLoop()`

Do not create hooks that only move JSX or trivial code into another file.

Before creating a hook, search for existing hooks with the same responsibility.

---

# 10. Native Modules

Native functionality must have a clean boundary.

Prefer a structure consistent with the existing project architecture, for example:

```text
feature/
  native/
    BatteryModule.ts
    BatteryModule.android.ts
    BatteryModule.ios.ts
```

JavaScript/TypeScript UI components must not contain scattered native implementation details.

Avoid large blocks of platform-specific logic inside UI components.

Prefer platform-specific implementations behind a clean interface.

---

# 11. Platform-Specific Code

Use platform-specific files when implementations meaningfully differ:

```text
module.android.ts
module.ios.ts
```

Avoid excessive `Platform.OS` checks inside components.

Platform differences should be isolated whenever practical.

Always consider both iOS and Android when implementing native functionality.

---

# 12. TypeScript

TypeScript is mandatory.

Avoid `any` unless there is a documented technical reason.

Never use `any` simply to silence TypeScript.

Prefer `unknown` when a value is genuinely unknown.

Define explicit types for:

- Component props
- Hook returns
- Service APIs
- Native module interfaces
- Experiment definitions
- Benchmark results
- Network responses

Prefer discriminated unions for state machines.

Example:

```ts
type ExperimentState =
  | { status: 'idle' }
  | { status: 'running'; startedAt: number }
  | { status: 'success'; result: ExperimentResult }
  | { status: 'error'; error: ExperimentError };
```

---

# 13. Component Props

Avoid excessive boolean props.

Bad:

```tsx
<Card
  compact
  bordered
  elevated
  dark
  interactive
  showIcon
  showHeader
/>
```

Prefer explicit variants:

```tsx
<Card variant="technical" />
```

or composition.

If a component requires many flags to behave differently, reconsider its abstraction.

---

# 14. State Management

Keep state as close as possible to where it is used.

Do not put local UI state into global state unnecessarily.

Use global state only when multiple independent parts of the application genuinely need the same state.

Distinguish between:

- Server state
- Application state
- Feature state
- UI state
- Experiment state

Do not create a global store for everything.

---

# 15. Experiment Architecture

Experiments are first-class features.

Prefer feature-oriented organization:

```text
features/
  experiments/
    event-loop/
      components/
      hooks/
      services/
      types.ts
      constants.ts
      EventLoopScreen.tsx
```

Do not put all experiment code into one giant folder or one giant file.

However, do NOT force tiny experiments into unnecessary folders and files. Structure should reflect real responsibility.

---

# 16. Reusable Experiment Infrastructure

Experiments should reuse common infrastructure where appropriate.

Examples:

- `ExperimentHeader`
- `ExperimentTabs`
- `ExperimentActions`
- `ExperimentStatus`
- `ExperimentMetrics`
- `ExperimentLog`
- `ExperimentExplanation`
- `ExperimentArchitecture`
- `ExperimentBenchmark`

Do not recreate these for every experiment.

The shared shell should be reusable while experiment-specific content remains specialized.

---

# 17. Experiment-Specific UI

Do not force every experiment into an identical UI.

Examples:

```text
Event Loop
→ execution queues

Camera
→ live preview

SSL Pinning
→ certificate information

Bluetooth
→ device discovery

Memory
→ live memory graph
```

Do not create artificial generic abstractions for fundamentally different experiments.

---

# 18. Constants

Do not scatter meaningful magic values throughout components.

Bad:

```ts
if (latency > 100) {}
```

Prefer:

```ts
const HIGH_LATENCY_THRESHOLD_MS = 100;
```

Centralize meaningful domain constants.

---

# 19. Utilities

If logic is pure, reusable, and independent from React, put it in a focused utility or domain function.

Examples:

- `calculateExecutionOrder()`
- `formatBytes()`
- `formatLatency()`
- `getBatteryStatus()`
- `calculateBenchmark()`

Do not create a giant generic `utils.ts` containing unrelated logic.

Before creating a utility, search the repository first.

---

# 20. Single Responsibility

Every component, hook, service, and utility should have one clear responsibility.

Bad:

```text
ExperimentScreen
- renders UI
- calls APIs
- calculates metrics
- formats logs
- manages Bluetooth
- handles permissions
- persists results
- runs benchmarks
```

Prefer:

```text
ExperimentScreen
    ↓
Experiment UI

useExperiment
    ↓
Experiment state

benchmarkService
    ↓
Benchmark execution

permissionService
    ↓
Permissions

experimentRepository
    ↓
Persistence
```

---

# 21. File Size

Avoid huge files.

General guidelines:

- Screens: preferably under 200 lines
- Components: preferably under 150 lines
- Hooks: preferably under 150 lines
- Services: focused on one responsibility

These are guidelines, not absolute laws.

Do not split files merely to satisfy line counts.

Split when the code has a meaningful separate responsibility.

---

# 22. Error Handling

Never silently swallow errors.

Bad:

```ts
try {
  await something();
} catch {}
```

Errors must be handled, logged where appropriate, presented meaningfully, and typed where possible.

Technical experiments should expose useful diagnostic information.

---

# 23. Performance

This application itself demonstrates React Native engineering, so performance matters.

Avoid unnecessary:

- Re-renders
- Object creation in hot render paths
- Large context providers
- Unstable list keys
- Unnecessary global subscriptions
- Expensive calculations during render

Use `React.memo`, `useMemo`, and `useCallback` only when they provide a meaningful benefit.

Do not blindly memoize everything.

---

# 24. Lists

For large or potentially large lists in scrollable mobile UI, use appropriate virtualization:

- `FlatList`
- `FlashList`
- `SectionList`

Use stable keys.

Do not use `array.map()` for large datasets inside a scrollable UI when virtualization is appropriate.

---

# 25. Async Code

Prefer clear async flows.

Use `async/await` when it improves readability.

Consider:

- Cancellation
- Race conditions
- Timeouts
- Retries
- Error states

especially for networking experiments.

Do not introduce unnecessary promise nesting.

---

# 26. Naming

Use descriptive names.

Avoid vague names such as:

```text
data
info
item
thing
handleStuff()
processData()
```

when the actual meaning is known.

Prefer:

```text
certificateFingerprint
benchmarkResult
nativeModuleStatus
handleCertificateValidation()
calculateExecutionLatency()
```

Names should communicate intent.

---

# 27. Comments

Do not comment obvious code.

Comments should explain:

- Why
- Tradeoffs
- Platform limitations
- Non-obvious behavior
- Technical constraints

Example:

```ts
// Keep high-frequency sensor events on the native side
// to avoid unnecessary JS thread pressure.
```

---

# 28. Documentation

When implementing technically complex experiments, document the important concept.

Examples:

- Why JSI is used
- Why a native module exists
- Why a particular architecture was chosen
- Why a benchmark behaves differently across platforms
- Platform limitations
- Important security considerations

The codebase should teach future maintainers what is happening.

---

# 29. No Copy-Paste Development

Never solve a new screen by copying an existing screen and changing a few strings.

Instead:

1. Identify reusable parts.
2. Extract shared components if appropriate.
3. Compose the new screen.
4. Keep experiment-specific logic isolated.

Bad:

```text
SSLScreen.tsx
CameraScreen.tsx
BluetoothScreen.tsx

Each contains duplicated:
Header
Status
Metrics
Logs
Actions
```

Good:

```text
components/
  ExperimentHeader
  ExperimentStatus
  MetricGrid
  TerminalLog
  ExperimentActions
```

---

# 30. Before Writing Code

Before implementing a feature:

1. Inspect the existing architecture.
2. Search for similar components.
3. Search for similar hooks.
4. Search for existing services.
5. Search for existing types.
6. Search for existing utilities.
7. Identify reusable patterns.
8. Determine where the feature belongs.
9. Only then create new files.

Do not immediately create new files.

---

# 31. Before Creating a Component

Ask:

```text
Does this already exist?
Can an existing component handle this?
Can an existing component be extended with a variant?
Is this genuinely a different responsibility?
Will this likely be reused?
```

If unclear, inspect the repository before proceeding.

---

# 32. Before Creating a Hook or Utility

Search first.

Do not create multiple abstractions with overlapping responsibilities, such as:

```text
useNetwork.ts
useNetworkStatus.ts
useConnection.ts
```

or:

```text
formatDate.ts
dateFormatter.ts
formatDateHelper.ts
```

when an existing abstraction already owns the responsibility.

---

# 33. Dependency Rules

Do not install a dependency for a problem that can be solved cleanly with:

- React Native
- TypeScript
- Existing project dependencies
- Platform APIs

Before adding a dependency:

1. Check existing dependencies.
2. Check whether the platform already provides the functionality.
3. Evaluate bundle size.
4. Evaluate maintenance.
5. Evaluate platform support.
6. Confirm that the dependency is actually necessary.

---

# 34. Architecture Consistency

Do not introduce a new architectural pattern for one feature.

If the project uses:

```text
features/
hooks/
services/
components/
```

continue using it.

Do not introduce an unrelated architecture for one experiment unless the project intentionally adopts it.

Consistency is more important than theoretical purity.

---

# 35. Testability

Code should be easy to test.

Prefer dependency boundaries that allow mocking.

Pure logic should be separated from UI.

Example:

Bad:

```tsx
const result = complicatedCalculation(
  deviceInfo,
  networkState,
  batteryState,
);
```

inside JSX.

Good:

```ts
const result = calculateExperimentResult(input);
```

Then test `calculateExperimentResult()` independently.

---

# 36. Accessibility

Interactive components should consider:

- `accessibilityLabel`
- `accessibilityRole`
- `accessibilityState`
- Sufficient touch targets
- Readable contrast

Technical UI must still be usable and accessible.

---

# 37. Security

Never hardcode:

- Secrets
- API keys
- Tokens
- Private certificates
- Credentials

Never log:

- Access tokens
- Passwords
- Private keys
- Sensitive user data

Security experiments may use intentionally fake/demo credentials and certificates. Clearly mark them as test data.

---

# 38. Git Hygiene

Do not modify unrelated files.

Do not reformat entire files unnecessarily.

Do not make unrelated refactors while implementing a feature.

Keep changes focused.

Before finishing:

- Check changed files
- Check for accidental changes
- Check imports
- Check unused code
- Check TypeScript errors
- Check lint
- Check tests where applicable

---

# 39. Validation

After implementing a feature, verify:

```text
✓ TypeScript
✓ ESLint
✓ Formatting
✓ Tests
✓ Platform-specific compilation where applicable
✓ No unused imports
✓ No dead code
✓ No duplicated components
✓ No duplicated utilities
✓ No duplicated business logic
✓ Existing architecture preserved
```

Do not declare a feature complete without validating the relevant checks.

---

# 40. Refactoring Rule

If duplicated code is discovered while implementing a feature:

1. Stop and inspect the duplication.
2. Determine whether it represents shared responsibility.
3. Extract an appropriate abstraction if justified.
4. Replace the duplicated implementations.
5. Keep the abstraction focused.

Possible destinations:

- Component
- Hook
- Utility
- Service
- Shared type
- Design-system primitive

Do not blindly extract every similar-looking line of code.

---

# 41. Code Quality Over Speed

If the fastest implementation creates duplication, unclear responsibilities, giant components, magic values, weak types, platform leakage, or unnecessary dependencies, do not use it.

Prefer the clean implementation.

---

# 42. Cursor Workflow

When modifying the repository, follow this workflow:

## Step 1 — Inspect
Understand the existing architecture and relevant files.

## Step 2 — Search
Search for reusable components, hooks, services, utilities, types, and patterns.

## Step 3 — Plan
Determine the smallest clean change that fits the existing architecture.

## Step 4 — Implement
Reuse existing abstractions whenever possible.

## Step 5 — Refactor
If the implementation introduces justified duplication, extract the shared responsibility.

## Step 6 — Validate
Run the relevant type checks, linting, tests, and platform checks.

## Step 7 — Review
Before finishing, verify:

- No duplicate components
- No duplicate logic
- No unnecessary files
- No unrelated modifications
- No architecture violations
- No unnecessary dependencies

---

# 43. Absolute Rules

These rules are non-negotiable:

1. Do not duplicate existing components.
2. Do not duplicate existing hooks.
3. Do not duplicate existing utilities.
4. Do not duplicate business logic.
5. Do not copy-paste screens to create new screens.
6. Do not create arbitrary one-off design patterns.
7. Do not introduce unnecessary dependencies.
8. Do not use `any` without a justified reason.
9. Do not put business logic inside JSX.
10. Do not put native implementation details inside UI components.
11. Do not create abstractions that make simple code harder to understand.
12. Do not modify unrelated code.
13. Do not bypass existing architecture without a clear reason.
14. Always search before creating.
15. Always reuse before duplicating.
16. Always prefer composition over copy-paste.
17. Always keep responsibilities clear.
18. Always preserve the project's design system.
19. Always consider iOS and Android behavior.
20. Always leave the codebase cleaner than you found it.

---

# 44. Final Decision Rule

Before creating anything new, ask:

> Does the project already have something that should do this?

If yes:

**Reuse it.**

If almost:

**Extend it.**

If fundamentally different:

**Create a new abstraction with a clear responsibility.**

Never create duplicate abstractions just because it is faster.

---

# 45. Final Standard

The expected code quality is:

**Senior React Native Engineer level.**

Every implementation should be:

- Clean
- Typed
- Reusable
- Testable
- Maintainable
- Performant
- Platform-aware
- Secure
- Consistent

The goal is not merely to make the feature work.

The goal is to make the codebase better after the feature is implemented.
