# Android Build Guide

This project already uses Expo SDK 57 and can run on Android.

## 1) Run locally on Android emulator/device

### Prerequisites

- Android Studio installed (for emulator + SDK tools)
- At least one emulator created in Android Studio Device Manager
- `adb` available in your shell (`adb devices` should work)
- Node dependencies installed

If `npm run android` fails, start by verifying:

```bash
adb devices
npx expo start --android
```

If no emulator/device appears in `adb devices`, start an emulator first or connect a physical Android device with USB debugging enabled.

```bash
npm install
npm run android
```

## 2) Build installable APK (preview/internal testing)

```bash
npm run build:android:preview
```

This uses the `preview` profile from `eas.json` and produces an APK.

### If the build was interrupted (like stopping at "Computing project fingerprint")

If you press `Ctrl+C` during upload/fingerprint/build, the build does not continue. Just run the command again:

```bash
npm run build:android:preview
```

Useful follow-ups:

```bash
npx eas-cli build:list --platform android --limit 5
npx eas-cli build:view <BUILD_ID>
```

Notes:

- The `punycode` deprecation warning is not the build failure.
- "No environment variables found for preview" is informational unless your app requires secrets at build time.

## 3) Build production AAB (Play Store)

```bash
npm run build:android:production
```

This uses the `production` profile and produces an Android App Bundle (AAB).

## 4) App ID currently configured

- Android package: `com.habitty.app`

If you need your own Play Store package ID, update `expo.android.package` in `app.json`.

## 5) First-time EAS setup

If you have not used EAS before, login first:

```bash
npx eas-cli login
npx eas-cli build:configure
```

## 6) Local vs cloud testing quick choice

- Fast local UI/device testing: `npm run android`
- Shareable installable APK for testers: `npm run build:android:preview`
