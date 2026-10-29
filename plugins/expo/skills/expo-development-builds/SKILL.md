---
name: expo-development-builds
description: Avoids the common traps of developing with Expo - reading the documentation for the exact SDK version before writing code, knowing when the store's Expo Go cannot run the project (new SDK, native modules such as purchases) and switching to a development build or a local device build, testing native settings that only real builds apply (permissions, ATS, cleartext), and upgrading the SDK deliberately. Use when the user says things like "Expo Go doesn't open my project", "this works in Expo Go but not in the build", "the purchase module is null", "upgrade the Expo SDK", or "how do I run it on my iPhone".
---

# Expo development builds and SDK versions

## 1. Read the docs for your SDK version

Expo changes APIs between SDK versions. Before writing Expo code, open the versioned documentation (`https://docs.expo.dev/versions/v{SDK}.0.0/`) for the SDK in `package.json`, not the latest docs and not memory. Put this rule, with the SDK number, in the project's AGENTS.md.

## 2. Pick how to run the app

| Need | Use |
| --- | --- |
| Quick UI work, only modules Expo Go includes, same SDK as the store's Expo Go | Expo Go |
| Native modules not in Expo Go (purchases, custom native code), native config (permissions, `Info.plist`) | Development build (`eas build --profile development`, then `npx expo start --dev-client`) |
| A physical iPhone without paying for builds | Local build: `npx expo run:ios --device` (Mac with Xcode; a free Apple ID can sign for personal devices) |

Expo Go in the stores can lag behind a new SDK. When it does not support yours, use a development build or a local build rather than downgrading.

## 3. Settings that only real builds apply

Permissions text, App Transport Security exceptions, Android cleartext traffic, URL schemes, and entitlements come from the app config and appear only in a real build. A feature that works in Expo Go can fail in production because of them. Test these on a development or preview build before release.

## 4. Upgrading the SDK

One major SDK at a time: read the changelog and upgrade guide, run `npx expo install --fix`, rebuild the development client, run the tests, and test on devices. Keep test-library and Jest presets on the versions that SDK expects.
