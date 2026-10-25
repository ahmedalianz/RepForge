# Egyptian Arabic and English

RepForge starts in Egyptian Arabic (`ar-EG`) on every new installation, independent
of the device language. English (`en-US`) is selectable under Profile → Language.

## Ownership and startup

- Bundled, typed i18next namespaces own UI translations. Missing Arabic entries
  fall back to English; unknown keys produce a safe message instead of a raw key.
- SQLite migration 004 adds `app_preferences.language`, constrained to the two
  supported locales and defaulting to Arabic. Existing workout rows are untouched.
- Startup loads the saved language before mounting navigation. Zustand reflects
  the saved preference; it does not duplicate workout history.
- Native Android Application/iOS SceneDelegate seed RTL once, before React Native
  initializes. Subsequent launches retain the explicitly selected direction.
- Arabic allows and forces RTL. English disables both flags so it remains LTR even
  on an Arabic device. Navigation also receives the explicit app direction.

## Safe language switching

Changing direction requires confirmation. The selected language and native flags
are saved, and a pending-restart message explains that the user must fully close
and reopen the app. Current translations and direction stay together until then.
There is no silent reload, including during an active workout. Persisted sets,
sessions and rest-timer timestamps are unchanged.

If startup detects a saved language/native direction mismatch (for example after
an interrupted preference write), it repairs the native flags and shows a restart
message instead of mounting navigation with inconsistent directions.

## Typography and bidirectional content

Arabic uses locally bundled **IBM Plex Sans Arabic** Regular, SemiBold and Bold,
licensed under SIL OFL (see `assets/fonts/IBMPlexSansArabic-OFL.txt`). English keeps
Plus Jakarta Sans. Arabic typography removes Latin tracking and increases line
height to avoid clipping connected glyphs. Native navigation headings use the same
localized font selection as shared text.

Rows inherit native RTL rather than being reversed twice. Directional navigation
arrows mirror; logos, exercise icons and chart controls do not. Charts remain
chronological from left to right. Workout tables, numeric inputs, clocks and plate
steppers deliberately retain their LTR numerical order. Mixed numeric/Latin runs
use Unicode directional isolates where needed.

Numbers use `Intl` with Western digits (`latn`), selected-language units, Gregorian
dates and the current device time zone. Pasted Arabic/Persian input digits are
normalized before validation. SQLite continues storing canonical numbers, kg and
Unix timestamps, never translated display values.

Built-in exercise names and muscle/equipment labels translate by stable IDs.
Custom names retain the user's input. Catalog search matches both languages before
the query limit; switching language does not rewrite exercise records.

## Dependencies and references

- i18next 26.5.10: resource lookup, interpolation and Arabic plural categories.
- react-i18next 17.1.8: React subscriptions and typed translation hooks.
- react-native-localize 3.7.2: device time zone, without device-language detection.
- React Native I18nManager: persisted native RTL/LTR policy.

Version compatibility was checked against the installed RN 0.88 / React 19.3
and peer requirements before installation. Native autolinking/codegen is included
in the standard CocoaPods and Gradle builds.

References: [I18nManager](https://reactnative.dev/docs/i18nmanager),
[react-native-localize](https://github.com/zoontek/react-native-localize),
[react-i18next](https://react.i18next.com/getting-started),
[i18next fallback](https://www.i18next.com/principles/fallback).

## Validation and device checklist

Automated coverage includes default Arabic, saved English hydration, stale native
direction recovery, translation parity and fallback, exercise search/custom names,
Western digits and bidi isolation, Arabic font selection, active-workout language
confirmation, cancellation, failed saves, and unchanged workout records.

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run format:check`.
Native builds alone do not establish RTL visual correctness. On physical iOS and
Android devices, check Arabic first launch on an English device, English on an
Arabic device, restart persistence, native back/swipe behavior, VoiceOver/TalkBack,
large text, narrow screens, input keyboards, chart chronology and session recovery.

### Current validation results

- 80 automated tests pass across 12 suites, plus TypeScript, ESLint and Prettier.
- iOS simulator Debug build and Android arm64 Debug build pass with RNLocalize and
  all bundled fonts.
- A fresh installation on a separate English-first iPhone simulator started in
  Arabic RTL immediately, with an empty workout history and no language selection.
- iPhone simulator: Arabic RTL Home, active workout, Settings and analytics were
  inspected visually. English was selected through Settings during an active
  workout, confirmed, and verified LTR after a cold restart. The saved workout
  remained recoverable. Switching back to Arabic and reopening restored RTL.
- Android emulator: Arabic RTL Home, font rendering, Western digits and persisted
  native RTL flags were inspected. English switching on Android and physical-device
  accessibility/large-text/swipe checks remain manual verification items.
- Android debug builds explicitly use the app's `BuildConfig.DEBUG` for developer
  support. This validation session used Metro port 8082 via the standard Gradle
  `-PreactNativeDevServerPort=8082` option, without modifying app preferences.
