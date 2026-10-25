# App prompts

Application confirmations, menus and startup errors use `PromptProvider` and
`usePrompt`, composed from the existing Card, Button and Text primitives. Do not
introduce native Alert or ActionSheet calls for app-owned interactions.

The provider sits inside the theme and localization providers. Its transparent
React Native Modal hosts app-rendered content with themed surfaces, typography,
RTL direction, safe-area padding and scrolling for compact screens/large text.
Default actions use the primary button, cancel uses secondary, and destructive
actions use the existing destructive treatment.

Choosing an action dismisses the old prompt before running its callback. A callback
may open a nested confirmation using the same overlay. Rapid repeated taps cannot
repeat an action. Backdrop taps, Android Back and iOS accessibility escape cancel
without running a destructive action. Background content is hidden from screen
readers while the prompt is visible.

Covered by UI tests for nested confirmation, cancellation, repeated taps, workout
completion/errors and language-change safety. The Arabic exercise menu and nested
removal/cancel flow were also checked in the iPhone simulator.

System-owned permission dialogs and developer tooling remain platform-controlled;
the application no longer invokes native alerts for its own prompts.
