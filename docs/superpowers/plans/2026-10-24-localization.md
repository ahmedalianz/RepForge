# Egyptian Arabic / English localization

Implement the user's supplied localization specification in the existing app.
SQLite owns the preferred language (`ar-EG` default; `en-US` optional). No locale
picker follows device changes. i18next owns active translations; namespaces mirror
features. Fallback is English, then a translated safe message, never a raw key.

- Add requested maintained i18next/react-i18next/react-native-localize dependencies.
  Verify peer ranges against RN 0.88/React 19.3 and standard codegen/autolinking.
- Add migration 004 for `app_preferences.language` with a default/check constraint;
  existing data and IDs remain untouched. Hydrate language before mounting navigation.
- Seed native RTL flags on first launch before RN initialization. Thereafter RN's
  persisted direction flags reflect the explicitly selected application language.
  Arabic forces/allows RTL; English disallows RTL even on an Arabic-language device.
- Direction changes use a confirmation, save the preference/direction flags and show
  a pending-restart explanation. Continue with the current language/layout until a
  normal restart, so active workouts are never silently reloaded or half-switched.
- Use locale-aware Western-digit numeric/date/unit formatting. Preserve LTR numeric
  fields, time series/chart geometry and set-table ordering; mirror only directional
  navigation icons. Shared text chooses the licensed Arabic font and logical alignment.
- Translate existing UI/validation/alerts/accessibility text; no speculative screens.
  Localize built-in exercise display/search by stable ID; preserve custom names.
- Add tests for resource parity/fallback, Arabic default/English recovery, formatting,
  exercise names/search, direction policy, restart behavior and unchanged workout data.
  Keep existing English behavioral tests by explicitly selecting English in test setup.
- Run full tests, typecheck/lint/format and native builds; validate fresh Arabic and
  persisted English direction on both simulators when available. Report real limits.

Parallel ownership: workout/exercise feature translations; home/progress feature
translations; native RTL/font integration. Root handles localization core, shared UI,
settings/startup/persistence, navigation, integration tests and final review.
