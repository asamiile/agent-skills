---
name: sign-and-notarize-macos
description: Signs and notarizes macOS apps, installers, and helper tools distributed outside the Mac App Store, in GitHub Actions - creating the Developer ID Application certificate and an App Store Connect API key, storing them as secrets, a temporary keychain on the runner, codesign with hardened runtime and timestamp, notarytool with the rejection log on failure, stapling, a Gatekeeper check, and renewal - plus what signing does not fix (browser download warnings, Windows). Use when the user says things like "macOS says the app can't be opened", "sign my Mac app in CI", "notarize the installer", "Gatekeeper blocks the .command file", or "the Developer ID certificate expired".
---

# Sign and notarize macOS apps in CI

Starter file, in this repository: `templates/macos/.github/workflows/sign-notarize.yml`. Creating and renewing the credentials: [references/credentials.md](references/credentials.md).

## 1. Why

macOS blocks unsigned downloaded apps and scripts. A double-clicked unsigned `.command` or `.app` can show a dialog with no way to continue for ordinary users. Signing with a Developer ID Application certificate and notarizing with Apple removes that. It needs a paid Apple Developer Program membership.

Wrap scripts that users must run (installers) in a small `.app` bundle, because a bundle can be signed, notarized, and stapled; a bare script cannot carry a stapled ticket.

## 2. Credentials (once, then at expiry)

Follow the reference: a Developer ID Application certificate (current sub-CA), exported as `.p12`; an App Store Connect API key for notarization; six repository secrets; and the signing identity as a repository variable. Back up the private files in an encrypted disk image outside the repository, then delete the plain copies.

## 3. The workflow

1. Import the certificate into a temporary keychain on the macOS runner, added to the search list without removing the default keychains
2. Build the `.app`
3. `codesign --force --deep --options runtime --timestamp`, then `codesign --verify --strict`
4. Zip with `ditto -c -k --keepParent` (plain `zip` can break bundle signatures), submit with `notarytool --wait`; when the status is not Accepted, print `notarytool log`, which lists each problem
5. `stapler staple`, so Gatekeeper can verify offline
6. Verify as a user's Mac would: `stapler validate` and `spctl --assess --type execute`
7. Always delete the keychain, even on failure

Run it only when the app's inputs change: macOS runners cost more per minute.

## 4. What signing does not fix

- Browsers may still warn about or block a download that few people have downloaded yet. That reputation-based warning is separate from Gatekeeper and fades as downloads accumulate
- Windows shows its own SmartScreen warning for unsigned or new executables; that needs a Windows code-signing certificate, a separate decision
- Document both in the download page's help text

## 5. Local check

On a Mac, download the artifact through a browser (so it gets the quarantine flag) and open it by double-click. That is the user's path; running it from Terminal skips Gatekeeper.
