# RevenueCat specifics

Check the current dashboard and SDK documentation; names of screens change.

## Dashboard

1. Create a project, then add an **App Store** app with the bundle ID. A "Test Store" app may exist from the start; products for real purchases go under the App Store app
2. Upload an App Store Connect API key (`.p8`, key ID, issuer ID) to the App Store app so RevenueCat can read products and transactions
3. Create an entitlement (for example `pro`) and attach the product to it
4. In the `default` offering, put the product in the package that fits (a lifetime package for a one-time unlock)

## App

- Configure the SDK with the public SDK key (it starts with a platform prefix) from an environment variable; skip configuration when the key is missing so local development still runs
- Entitlement check: `customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined`
- Purchase: `getOfferings()` → `current` → the lifetime package (fall back to the first available) → `purchasePackage(pkg)`
- Restore: `restorePurchases()`
- A cancelled purchase logs an error in development but is normal; check the SDK's "user cancelled" flag and show nothing

## Sandbox

Purchases appear in the dashboard's customer history with a sandbox marker. If the SDK reports that no products could be fetched, check in order: the paid apps agreement, the product's Ready to Submit status, the product ID, and that the product is under the App Store app (not the test store).
