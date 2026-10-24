# Advanced React Native Playground

Bare React Native CLI laboratory for learning production edge cases around:

1. Push Notifications
2. Deep Linking
3. SSL Pinning (native TLS)
4. Debug / Diagnostics

This is a **failure laboratory**, not a polished product app.

## Stack (do not casually upgrade)

| Piece | Version / notes |
|-------|-----------------|
| React Native | 0.86.2 (CLI, not Expo) |
| React | 19.2.3 |
| New Architecture | enabled |
| Hermes | enabled |
| Package manager | npm |
| Navigation | `@react-navigation/native` + native-stack |

## Phase status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Clean shell, navigation, Home, Diagnostics, empty feature modules | Done |
| 2 | Push Notifications architecture + simulations | Done |
| 2.5 | Real FCM remote push (credentials required to verify) | **Current** |
| 3 | Deep Linking | Pending |
| 4 | SSL Pinning | Pending |

## Project layout

```text
src/
  features/
    home/
    notifications/   # Phase 2
    deepLinking/     # Phase 3
    sslPinning/      # Phase 4
    diagnostics/     # live snapshot + log UI
  navigation/
  services/logging/
  components/
  config/
  theme/
  utils/
```

## Run

```sh
npm start
npm run ios
# or
npm run android
```

## Notes

- Old RN Lab experiment screens/components were removed from `src/`.
- Native BootSplash wiring is preserved; splash hides when navigation is ready.
- No new dependencies were added in Phase 1.
- Feature READMEs under `src/features/*/README.md` document planned failure labs.
