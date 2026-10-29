---
name: set-up-in-app-purchases
description: Adds in-app purchases to an iOS app (and later Android) - the product in App Store Connect, the paid apps agreement and tax and banking forms without which the store returns no products, a purchase SDK such as RevenueCat with entitlements and offerings, purchase and restore flows, sandbox testing on a device, the privacy label update, submitting the first purchase with an app version, and offer codes for giving it away. Use when the user says things like "add a one-time purchase", "unlock pro features", "no products found", "set up RevenueCat", "test purchases in sandbox", or "give the paid version to a friend".
---

# Set up in-app purchases

Purchase SDK specifics: [references/revenuecat.md](references/revenuecat.md).

## 1. Decide the model

One-time unlock (non-consumable), subscription, or consumable. Keep the free limit and the paid feature in one place in the code (an entitlement check), and decide what the free version shows when the limit is reached.

## 2. Store side (App Store Connect)

1. **Paid apps agreement**: Agreements, Tax, and Banking must show the paid apps agreement as active, with bank and tax forms done. Without it the store returns no products at all, which looks like a code bug. In the EU, the trader status declaration (with identity documents) is also required and takes days
2. Create the product (type, product ID, price, localized name and description for each app language, a review screenshot, availability). It must reach **Ready to Submit**; sandbox purchases do not work before that
3. The first in-app purchase is reviewed together with a new app version. It cannot be submitted alone once a version is live

## 3. App side

1. Add the SDK with a **public** app-specific key from an environment variable (never commit it); make every call tolerate a missing key in local development
2. Check the entitlement at launch and after each purchase; gate the paid feature on it
3. Purchase flow: fetch the current offering, buy its package, update the entitlement. A cancelled purchase is not an error: no error message
4. **Restore Purchases** button (required by review for non-consumables and subscriptions)
5. Native purchase modules do not run in generic preview apps (for example Expo Go); test with a development build on a device

## 4. Test in sandbox

Create a sandbox tester with an email address not used for a real Apple account (an alias works), sign in under Settings → App Store → Sandbox account on the device, then buy, restore, and reinstall-and-restore. Confirm the purchase appears in the SDK's dashboard.

## 5. Before submitting

- [ ] Privacy labels gain "Purchases" (and the privacy policy says so)
- [ ] Product localized for every app language; review screenshot attached
- [ ] Review notes explain where the purchase is in the app
- [ ] The app works when the store is unreachable (shows the free tier, retries later)

## 6. Giving it away

Use the store's offer codes (one-time custom codes per person) instead of hidden unlocks. They work only after the product has passed review.
