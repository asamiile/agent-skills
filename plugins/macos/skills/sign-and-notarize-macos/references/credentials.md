# Developer ID credentials for CI

Values (names, team ID, passwords, keys) never go into the repository or its docs; only the steps do.

## 1. Certificate signing request

The certificate assistant in Keychain Access fails on some recent macOS versions with "the specified item could not be found in the keychain". Create the request in Terminal instead:

```sh
openssl req -new -newkey rsa:2048 -nodes \
  -keyout ~/Desktop/developer-id.key -out ~/Desktop/developer-id.certSigningRequest \
  -subj "/emailAddress={Apple ID email}/CN={any name}/C={country code}"
security import ~/Desktop/developer-id.key -k ~/Library/Keychains/login.keychain-db -T /usr/bin/codesign
```

The common name is replaced by Apple; the certificate shows the developer account's registered name.

## 2. Developer ID Application certificate

Apple Developer → Certificates → "+" → **Developer ID Application** (under Software, not a service certificate) → the current sub-CA profile type → upload the request → download the `.cer` and open it (it pairs with the imported key). Check with `security find-identity -v -p codesigning`; the identity reads `Developer ID Application: {Name} ({TEAM_ID})`.

## 3. App Store Connect API key (for notarization)

App Store Connect → Users and Access → Integrations → Team Keys → "+" with the Developer role. Note the key ID and issuer ID and download `AuthKey_{id}.p8`. **The `.p8` can be downloaded only once.**

## 4. GitHub

Export the certificate with its key from Keychain Access as `.p12` with a password, then:

```sh
base64 -i developer-id.p12 | gh secret set MACOS_CERTIFICATE_P12
gh secret set MACOS_CERTIFICATE_PASSWORD          # the export password
openssl rand -base64 32 | gh secret set MACOS_KEYCHAIN_PASSWORD
gh secret set APPLE_API_KEY_P8 < AuthKey_{id}.p8
gh secret set APPLE_API_KEY_ID ; gh secret set APPLE_API_ISSUER_ID
gh variable set MACOS_SIGNING_IDENTITY --body "Developer ID Application: {Name} ({TEAM_ID})"
```

## 5. Backup and cleanup

Keep `.p12`, `.p8`, and the request key in an encrypted disk image (`hdiutil create -encryption AES-256 ...`) or a password manager, never in the repository folder (even ignored files are read by tools and backups). Delete the plain copies from the desktop.

## 6. Renewal

Developer ID certificates expire after several years; API keys can be revoked. Write the expiry date into the operations docs (`core:document-operations`), repeat steps 1-4 before it, and update the signing identity variable if the name or team changed.
