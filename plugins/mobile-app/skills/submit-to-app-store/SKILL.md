---
name: submit-to-app-store
description: Prepares an iOS app for App Store submission and later updates - the listing text within Apple's limits for each locale, a name that does not collide with existing apps, trademark notices for third-party products the app works with, privacy labels that match every SDK, export compliance, age rating, URLs, and review notes that let a reviewer test it - kept as a reviewed document in the repository. Use when the user says things like "prepare the App Store listing", "submit to the App Store", "write the app description", "what do I put in the privacy section", "another app has the same name", or "the app was rejected".
---

# Submit an app to the App Store

Starter file, in this repository: `templates/mobile-app/store-listing-ios.md`. Purchases have their own steps: `mobile-app:set-up-in-app-purchases`.

## 1. Draft the listing in the repository

Copy the template to `docs/store-listing/ios.md` and fill it from the app's real text (in-app strings, the product page), so the store, the site, and the app say the same thing. Count characters per field and locale against Apple's current limits.

## 2. Name

Search the store for the intended name. If it is taken, keep the brand and let the subtitle carry what the app does (for example "{Brand} - {what it does}" as the name, a clear subtitle per locale).

## 3. Third-party products

If the app works with another company's product, read that company's trademark guidelines. Usually: say the app is unofficial and unaffiliated, add the attribution line at the end of the description and in the app's about or license screen, and avoid the trademark in the app name and keywords unless allowed.

## 4. Privacy

Fill the privacy labels from the actual SDKs: list every SDK that sends data (crash reporting, analytics, purchases), and answer per data type whether it is linked to the user and used for tracking. Adding an SDK later means updating the labels with that version (in-app purchases add "Purchases"). The privacy policy page must match.

## 5. Build settings

- `ITSAppUsesNonExemptEncryption`: false when the app uses only standard HTTPS/TLS, so each build does not ask
- Usage descriptions for every permission the app requests (local network, camera, ...), in each locale
- Version and build number from the release pipeline (`expo:expo-release-pipeline` for Expo)

## 6. Review

Write review notes that let a reviewer use the app without your setup: a demo mode, a test account, or a short video, plus anything unusual (companion software, local network). When rejected, quote the guideline number, fix or answer precisely, and record the outcome in the listing document.

## 7. Distribution choices

Decide whether to run a public TestFlight beta or release directly. To give the paid features to specific people for free, use the store's offer codes rather than custom unlock logic.
