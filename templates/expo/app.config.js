// Expo app config. The version comes from package.json, which release-please bumps,
// so the store version, the build, and the version shown in the app never disagree.
// Build numbers are not here: EAS keeps them (eas.json: appVersionSource "remote", autoIncrement).
const { withSentry } = require("@sentry/react-native/expo");
const pkg = require("./package.json");

module.exports = {
  expo: withSentry(
    {
      name: "{App name}",
      slug: "{app-slug}",
      version: pkg.version,
      orientation: "portrait",
      icon: "./assets/icon.png",
      ios: {
        bundleIdentifier: "{reverse.domain.app}",
        supportsTablet: false,
        infoPlist: {
          // Only standard HTTPS/TLS is used, so builds skip the export compliance question
          ITSAppUsesNonExemptEncryption: false,
          // Only for apps that talk to devices on the local network (see mobile-app:connect-to-local-devices)
          NSLocalNetworkUsageDescription: "{Why the app connects to devices on your Wi-Fi network.}",
          NSAppTransportSecurity: { NSAllowsLocalNetworking: true },
        },
      },
      android: {
        package: "{reverse.domain.app}",
      },
      extra: {
        eas: { projectId: process.env.EAS_PROJECT_ID }, // or the literal ID that `eas init` writes
      },
      plugins: [
        // Android release builds block cleartext traffic; allow it only if the app needs ws:// or http:// on the LAN
        ["expo-build-properties", { android: { usesCleartextTraffic: true } }],
      ],
    },
    // Organization and project come from SENTRY_ORG / SENTRY_PROJECT at build time; nothing account-specific is committed
    { url: "https://sentry.io/" },
  ),
};
