# App Store listing: {app}

Working copy of everything entered in App Store Connect. Keep it in the repository so changes are reviewed and reused for each locale. Check Apple's current limits before relying on the numbers below.

## Name and subtitle

| Field | Limit | {locale} | {locale} |
| --- | --- | --- | --- |
| App name | 30 | | |
| Subtitle | 30 | | |

Search the store for the name first. If another app has the same name, keep the brand and make the subtitle say what this app does.

## Text

| Field | Limit | Notes |
| --- | --- | --- |
| Promotional text | 170 | Can change any time without review |
| Description | 4000 | What it does, how it works, requirements (OS versions, other software), free vs paid, trademark notices at the end |
| Keywords | 100 | Comma-separated, no spaces; do not repeat words from the name; no competitor trademarks |
| What's New | 4000 | Per version |

## URLs

- Support URL: {contact page}
- Marketing URL: {product page}
- Privacy policy URL: {privacy page}

## Third-party trademarks

- [ ] Read the trademark guidelines of every product the app works with
- [ ] State that the app is unofficial and not affiliated, in the description and inside the app
- [ ] Add the trademark attribution line ("{Product} is a trademark of {Company}.")
- [ ] Screenshots of the other product are used only as the guidelines allow

## App information

- [ ] Content rights: third-party content or not
- [ ] Age rating questionnaire
- [ ] Export compliance: `ITSAppUsesNonExemptEncryption` set in the build (false when only standard HTTPS/TLS is used)
- [ ] Category, copyright line

## Privacy labels

| Data type | Collected | Linked to the user | Used for tracking | Source |
| --- | --- | --- | --- | --- |
| Crash and performance data | | | | {crash reporter} |
| Purchases | | | | {purchase SDK} |

- [ ] Update this table and App Store Connect whenever an SDK is added or removed (adding in-app purchases adds "Purchases")

## Review notes

- How the reviewer can test without special hardware or accounts (demo mode, video, test account)
- {anything unusual: local network use, companion software}
