---
name: ship-companion-installer
description: Ships a companion component that users must place into another application's folder on their computer (a plugin, script, extension, or helper for a desktop app) - double-clickable install scripts for macOS and Windows that replace old copies safely, a signed macOS app wrapper, a CI job that runs the real scripts on macOS and Windows with a throwaway home folder, and a workflow that rebuilds the download zips and proposes them in a pull request. Use when the user says things like "make an installer for the plugin", "users can't find the scripts folder", "one-click install for Mac and Windows", "test the installer in CI", or "update the download files automatically".
---

# Ship a companion installer

Starter files, in this repository: `templates/core/installer/install.command`, `install.bat`, and `templates/core/.github/workflows/installer-verify.yml`. Signing the macOS wrapper: `macos:sign-and-notarize-macos`.

## 1. What to automate

Copying files into the right folder can be scripted; steps inside the host application (selecting the component in its preferences) usually cannot. Script the copy, and print the remaining manual step at the end of the script and on the download page.

## 2. Install scripts

- Locate the component next to the script (`$(dirname "$0")`, `%~dp0`) and stop with a clear message if it is missing (the user ran the script from inside the zip or moved it)
- Compute the target from `HOME` / `USERPROFILE`. Before `rm -rf`, refuse a missing or root `HOME` and any target that is not exactly the expected path
- Create the parent folder when the host application has not created it yet
- Replace the old copy instead of merging, so renamed or deleted files do not linger
- Wait for a key press at the end so the window does not close before the user reads it, except when `CI` is set
- macOS: wrap the script in a small `.app` and sign and notarize it; an unsigned `.command` downloaded from the internet is blocked
- Windows: a `.bat` is the least surprising; expect a SmartScreen warning unless it is signed

## 3. Downloads

Build three zips: macOS (signed app), Windows (script + component), and the bare component for manual installation. Rebuild them in CI when the component or the scripts change, and open a pull request that puts them in the site's downloads folder; a person reviews the zip contents and merges.

## 4. Test in CI

`installer-verify.yml` runs the real scripts twice (fresh, then over an existing copy) on macOS and Windows runners, with the home folder pointed at a temporary directory, and checks that the entry file exists. Limit it to changes in the component and the scripts: those runners cost a multiple of Linux minutes.

## 5. Document

On the download page: requirements, the steps per platform, the manual step in the host application, where the files go (for manual installation and uninstalling), what the security warnings look like and why, and how to update (run the installer again; restart the host application if it caches code).
