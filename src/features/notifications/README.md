# Push Notifications Playground

Learning laboratory for the complete notification lifecycle — architecture (Phase 2)
and **real remote FCM transport** (Phase 2.5).

Remote Firebase credentials are **not invented**. Without
`google-services.json` / `GoogleService-Info.plist`, FCM is **NOT CONFIGURED**
and simulations still exercise the same pipelines.

---

## Architecture

```text
Remote Provider (Firebase Console / your server)
  ↓
FCM / APNs
  ↓
Native OS
  ↓
Firebase Messaging (@react-native-firebase/messaging)
  ↓
Platform adapter
  ↓
NotificationService
  ↓
Validation → Deduplication → Pending (if nav not ready)
  ↓
NAVIGATION_REQUEST (no real navigation yet)
```

**Notifee role:** Android channels, permission helpers, **foreground local display**
of FCM messages, and press events for notifications we displayed ourselves.

**Firebase role:** FCM registration token, token refresh, remote message delivery,
background handler, notification-open / initial notification from remote pushes.

Cold-start open path:

```text
User taps remote notification
  → OS launches app
  → Firebase getInitialNotification / Notifee (only if we displayed it)
  → NotificationService.handleInitial
  → pending queue if navigation not ready
  → onNavigationReady → NAVIGATION_REQUEST
```

---

# Real Remote Push Notifications (Phase 2.5)

## Dependencies

| Package | Version | Why |
|---------|---------|-----|
| `@react-native-firebase/app` | 26.4.0 | Firebase core (New Architecture / modular API) |
| `@react-native-firebase/messaging` | 26.4.0 | FCM token + remote messages |
| `@notifee/react-native` | (Phase 2) | Presentation / channels / permissions |
| `@react-native-async-storage/async-storage` | (Phase 2) | Token persistence |

RN was **not** upgraded. Project already has New Architecture enabled → RNFB v26 is appropriate.

## Firebase configuration required (YOU must provide)

### Android — package `com.rnlab.app`

1. Create a Firebase project + Android app with package name **`com.rnlab.app`**
2. Download **`google-services.json`**
3. Place it at: **`android/app/google-services.json`**
4. Template (not valid credentials): `android/app/google-services.json.example`
5. Gradle: Google Services plugin applies **only if the real file exists** (build stays possible without it)

### iOS — bundle `com.rnlab.app`

1. Create Firebase iOS app with bundle id **`com.rnlab.app`**
2. Download **`GoogleService-Info.plist`**
3. Place at: **`ios/RNLab/GoogleService-Info.plist`**
4. **Add the plist to the Xcode target** (Copy Bundle Resources)
5. Template: `ios/RNLab/GoogleService-Info.plist.example`
6. Already prepared in repo:
   - `UIBackgroundModes` → `remote-notification`
   - `RNLab.entitlements` with `aps-environment = development`
7. **Apple Developer (manual — NOT VERIFIED in this environment):**
   - Enable **Push Notifications** capability for the App ID
   - Create APNs key (.p8) or certificates
   - Upload APNs key to Firebase Console → Project settings → Cloud Messaging
   - Use a **real device** for reliable remote push (simulator support is limited)

### Security

| Client (may be in app) | Server (NEVER in app repo) |
|------------------------|----------------------------|
| `google-services.json` / `GoogleService-Info.plist` (public-ish client config) | FCM server keys / service account JSON |
| | APNs `.p8` private key |
| | Any backend auth secrets |

Real credential files are **gitignored**.

---

## Token lifecycle

```text
App start → Firebase init (if configured)
  → permission check/request
  → getToken() → FCM registration token
  → persist locally
  → onTokenRefresh → persist + registerTokenWithBackend() stub
```

| Concept | Status |
|---------|--------|
| FCM registration token via `getToken` | **Implemented** — requires credentials to be **VERIFIED** |
| Token persist / change detect | **Implemented** |
| `onTokenRefresh` | **Implemented** |
| `registerTokenWithBackend` | **Stub only** (logs `TOKEN_BACKEND_REGISTER_STUB`) |
| APNs device token via `getAPNSToken` | **Implemented (iOS)** — shown separately in UI |

**WHY backend registration matters:** without upserting the FCM token on your server, you cannot target the device; stale tokens cause silent delivery failures.

---

## Foreground behavior

```text
FCM message → onMessage → FOREGROUND_REMOTE_MESSAGE
  → if notification payload: Notifee.displayNotification (explicit)
  → NOTIFICATION_RECEIVED
  → (tap) Notifee PRESS → NOTIFICATION_OPENED (deduped)
```

| Claim | Status |
|-------|--------|
| Handler wired | **Implemented** |
| End-to-end with real FCM | **NOT VERIFIED** (no credentials in CI/sandbox) |
| OS auto-shows banner in foreground | **Do not assume** — we display via Notifee deliberately |

---

## Background / terminated

| Path | What runs |
|------|-----------|
| Notification payload, app background | OS usually displays; JS may get `setBackgroundMessageHandler` depending on platform/payload — **NOT VERIFIED** here |
| Data-only, high priority | More likely to wake JS background handler — **NOT VERIFIED** |
| User tap from background | `onNotificationOpenedApp` → **Implemented** |
| User tap from killed | `getInitialNotification` → pending queue → **Implemented** |

**WHAT if JS is not running?** OS can still show a notification payload. Data-only may be dropped or delayed until a process wakes.

---

## Payload matrix (document expectations — mark verification honestly)

| Payload | Android FG | Android BG | Android killed | iOS FG | iOS BG | iOS killed |
|---------|------------|------------|----------------|--------|--------|------------|
| notification | JS `onMessage` + Notifee display (**impl**) | OS display (**expected**, NOT VERIFIED) | OS display (**expected**, NOT VERIFIED) | same | OS / APNs (**expected**, NOT VERIFIED) | same |
| notification+data | data available in `onMessage` (**impl**) | data often available on tap (**expected**, NOT VERIFIED) | via initial notification (**impl** path) | same | same | same |
| data-only | `onMessage` (**impl**) | needs high priority / content-available (**expected**, NOT VERIFIED) | limited (**expected**, NOT VERIFIED) | often requires content-available (**expected**, NOT VERIFIED) | same | same |

---

## Notification identity & duplicates

```text
dedupeKey = providerMessageId (FCM messageId)
         ?? notificationId
         ?? fallbackHash(title|body|type|id|route)
```

Dedupe families:

- `received` — delivery events
- `open` — **both** `opened` and `initial` (fixes Phase 2 double NAVIGATION_REQUEST on cold start)

Simulate Duplicate runs received → opened → initial → fcm received → notifee opened and expects later opens to log `DUPLICATE_NOTIFICATION`.

---

## Testing real pushes (after you add credentials)

1. Copy real Firebase config files (see above)
2. `cd ios && bundle exec pod install`
3. Rebuild native apps (`npm run android` / `npm run ios`)
4. Grant notification permission
5. Tap **Get Token** — copy FCM registration token
6. Firebase Console → Messaging → create test message **or** use HTTP v1 with a **server** service account (not in this app)

Suggested test cases:

1. Foreground — app open, send notification+data
2. Background — home screen, send, then tap
3. Terminated — force quit, send, tap
4. Data-only — observe whether JS wakes (document result)
5. Invalid data — missing `type` → `INVALID_PAYLOAD`
6. Duplicate — open via FCM and ensure single `NAVIGATION_REQUEST`

Firebase Console limitations: data-only / advanced options are limited; use Admin SDK / HTTP v1 from a **server** for full control.

---

## Failure lab

| Scenario | How |
|----------|-----|
| Firebase not configured | Remove/omit credential files → Diagnostics shows NOT CONFIGURED |
| Permission denied | Deny OS prompt |
| Token unavailable | Get Token without credentials |
| Token refresh | Real `onTokenRefresh` or Simulate Token Refresh |
| Invalid payload | Simulate Invalid Payload |
| Duplicate | Simulate Duplicate Notification |
| Nav not ready | Simulate Initial Notification |
| Background handler | Real FCM data message (NOT VERIFIED until credentials) |

---

## Diagnostics fields

Firebase, FCM availability, permission, token status/source/preview, last remote message, last tap, last error, last event.

---

## Manual Apple / Android checklist (developer)

### Android
- [ ] `google-services.json` in `android/app/`
- [ ] Rebuild after adding file (plugin applies automatically)
- [ ] `POST_NOTIFICATIONS` granted on API 33+

### iOS
- [ ] `GoogleService-Info.plist` in target
- [ ] Push capability + APNs key in Firebase
- [ ] Physical device recommended
- [ ] `pod install` after adding RNFB

---

## Files (Phase 2.5 additions)

```text
services/firebaseMessaging.ts
services/firebaseStatus.ts
services/tokenBackend.ts
utils/notificationIdentity.ts
utils/remoteMessageMapper.ts
android/app/google-services.json.example
ios/RNLab/GoogleService-Info.plist.example
ios/RNLab/RNLab.entitlements
```
