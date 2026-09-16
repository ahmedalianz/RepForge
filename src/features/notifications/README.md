# Push Notifications Playground (Phase 2)

Learning laboratory for the **complete notification lifecycle**, including failure modes.

This module is intentionally honest about native complexity. Remote **FCM / APNs** transport is **not wired yet** (no Firebase config in the repo). Permissions, channels, local display, validation, dedupe, pending-queue, and logging are real. Remote tokens use an explicit **simulated / not-configured** path until Firebase is added.

---

## Architecture

```text
UI (NotificationsPlaygroundScreen)
  ↓
hooks/useNotificationPlayground
  ↓
NotificationService  (singleton, idempotent initialize)
  ↓
Platform adapter (android-notifee | ios-notifee)
  ↓
Notifee / PermissionsAndroid / UNUserNotificationCenter
  ↓
[Future] FCM / APNs
  ↓
Operating system
```

Cold-start open path:

```text
initialNotification
  → NotificationService.handleInitial
  → pending queue (if navigation not ready)
  → NavigationContainer.onReady
  → NotificationService.onNavigationReady
  → process (validate → dedupe → log)
  → "Navigation request received" (Phase 2: no real navigation)
```

---

## Why these libraries

| Library | Role | Why |
|---------|------|-----|
| `@notifee/react-native` | Permissions, Android channels, local display, initial/press events | Works without Firebase; production-grade notification UX APIs |
| `@react-native-async-storage/async-storage` | Persist token records | Required to study token lifecycle / stale tokens |

### Why Firebase Messaging was **not** installed yet

1. No `google-services.json` / `GoogleService-Info.plist` in the repo
2. Adding `@react-native-firebase/*` without those files **breaks native builds**
3. Phase 2 still teaches the service architecture via simulations that share the same pipeline

When you add Firebase later: implement `getRemoteToken()` in the platform adapters and keep simulations for failure labs.

---

## APNs token vs FCM registration token

| | APNs device token | FCM registration token |
|--|-------------------|-------------------------|
| Platform | iOS (and related Apple platforms) | Android primarily; also used by Firebase on iOS as an **abstraction** |
| Issued by | Apple Push Notification service | Firebase Cloud Messaging |
| Format | Opaque hex string from Apple | Firebase registration id string |
| Used by server to | Talk to APNs directly | Talk to FCM (which may talk to APNs on iOS) |

**Do not treat them as the same string.**  
On iOS with Firebase, your server usually stores the **FCM registration token**, while Firebase holds the mapping to the underlying APNs device token. Rotating one does not mean the other is identical.

In this lab:

- Android adapter `remoteTokenKind = 'fcm'`
- iOS adapter `remoteTokenKind = 'apns'`
- Simulations mint `simulated-fcm` / `simulated-apns` and label them clearly in the UI and logs

---

## Concept guide (normal → failure → reproduce → debug → fix)

### 1. Permission

**Normal:** User grants → `AUTHORIZED` (iOS may be `PROVISIONAL`).  
**Failure:** Deny / never ask again → `DENIED` / `BLOCKED`.  
**Reproduce:** Request → deny; on Android 13+ deny twice for blocked-like behavior.  
**Debug:** Event log `PERMISSION_REQUESTED` / `PERMISSION_CHANGED`; OS Settings.  
**Fix:** Detect blocked → “Open Settings”; never assume request() ⇒ authorized.

### 2. Android version differences

- **< 33:** Install-time notification permission (still need channels on 8+).
- **33+:** Runtime `POST_NOTIFICATIONS` (declared in `AndroidManifest.xml`).
- **Channels (8+):** Without a channel, notifications may be silently dropped.

### 3. Foreground

**Normal:** App active → JS handler runs; OS may **not** show a system banner unless you display locally (Notifee).  
**Failure:** Assuming background UI appears in foreground.  
**Reproduce:** Simulate Foreground Notification.  
**Debug:** `NOTIFICATION_RECEIVED` with `appState=FOREGROUND`.  
**Fix:** Explicit foreground presentation policy.

### 4. Background

**Normal:** OS displays notification; tap → process resume → opened handler.  
**JS role:** Limited while suspended; Notifee background handler + open events matter.  
**Reproduce:** Display local notif → Home → tap.  
**Debug:** `NOTIFICATION_OPENED`, compare app state transitions.  
**Fix:** Register background handler early (`index.js`).

### 5. Terminated / cold start

**Normal:** Tap launches app → `getInitialNotification` / initial open → pending until nav ready.  
**Failure:** Navigate before `NavigationContainer` ready → lost route / crash.  
**Reproduce:** Simulate Initial Notification (queues then flushes).  
**Debug:** `PENDING_QUEUED` then `PENDING_FLUSHED`.  
**Fix:** Pending queue + `onNavigationReady()`.

### 6. Duplicate events

**Why:** Same tap observed as initial + opened, or double listener registration.  
**Detect:** Dedupe key `eventFamily:notificationId` with TTL.  
**Reproduce:** Simulate Duplicate Notification.  
**Missing dedupe:** Double navigation, double analytics, race bugs.  
**Fix:** Idempotent service + dedupe store + single initialize.

### 7. Token refresh / stale tokens

**Normal:** Token rotates → persist → upload to backend.  
**Failure:** Server keeps stale token → silent push failure.  
**Reproduce:** Simulate Token Refresh twice; compare stored token.  
**Fix:** On refresh, replace storage and sync backend; delete old token server-side.

### 8. Invalid payloads

**Normal:** Validate before side effects.  
**Failure:** `data.type` missing → crash in router.  
**Reproduce:** Simulate Invalid Payload.  
**Debug:** `INVALID_PAYLOAD` with reason.  
**Fix:** `validateNotificationPayload` never throws.

### 9. Listener cleanup

**Failure:** `initialize()` on every render → duplicate handlers.  
**Fix:** Singleton + initializing promise + unsubscribe foreground listener on cleanup.

---

## Where work happens (layer map)

```text
Push server
  → FCM (Android / Firebase-iOS) or APNs (direct iOS)
  → OS notification center / system tray
  → Native Notifee / Firebase Messaging SDK
  → React Native bridge / JSI
  → JavaScript NotificationService
  → UI log / (future) navigation resolver
```

| State | Who shows UI | Who wakes JS |
|-------|--------------|--------------|
| Foreground | Often your code (Notifee display) | Yes, immediately |
| Background | OS | On tap / limited background handlers |
| Terminated | OS | On tap after JS boot |

---

## Test matrix

| Scenario | Android | iOS | Expected Result |
| -------- | ------- | --- | --------------- |
| Permission allowed | Manual | Manual | Status `AUTHORIZED`; log `PERMISSION_REQUESTED` |
| Permission denied | Manual | Manual | `DENIED` / `BLOCKED`; no crash |
| App foreground | Sim + Manual | Sim + Manual | `NOTIFICATION_RECEIVED`, appState `FOREGROUND` |
| App background | Manual | Manual | OS shows; tap → `NOTIFICATION_OPENED` |
| App terminated | Manual | Manual | Cold start → pending/flush → `INITIAL_NOTIFICATION` |
| Notification tapped | Sim + Manual | Sim + Manual | `NOTIFICATION_OPENED` + optional `NAVIGATION_REQUEST` |
| Token refresh | Sim | Sim | New stored token; `TOKEN_REFRESHED` |
| Invalid payload | Sim | Sim | `INVALID_PAYLOAD`, no crash |
| Duplicate event | Sim | Sim | First `NOTIFICATION_RECEIVED`, second `DUPLICATE_NOTIFICATION` |
| Notification before navigation ready | Sim | Sim | `PENDING_QUEUED` then `PENDING_FLUSHED` |
| Real FCM/APNs remote token | Unverified (Firebase not configured) | Unverified | `TOKEN_ERROR` until wired |

Cells marked **Manual** / **Unverified** must be confirmed on device/simulator after `pod install` / Gradle sync.

---

## Manual test checklist

1. `cd ios && bundle exec pod install` (Notifee native)
2. `npm run ios` / `npm run android`
3. Open **Push Notifications**
4. Check / Request permission; deny once; open settings
5. Get Token → expect honest “not configured” error
6. Simulate Token Refresh → token appears as simulated FCM/APNs
7. Run each simulation; confirm Event Log entries
8. Background the app, open Diagnostics, confirm push diagnostics updated

---

## Files

```text
src/features/notifications/
  components/          Permission, Token, AppState, Simulation, EventLog
  hooks/               useNotificationPlayground
  services/            NotificationService, token/dedupe/pending, platform/*
  types/               payloads, events, permission, token kinds
  utils/               validatePayload, appState, openSettings
  config/              channels, storage keys
  screens/             NotificationsPlaygroundScreen
  notificationLogger.ts
  README.md
```
