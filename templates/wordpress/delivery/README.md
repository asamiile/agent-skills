# {component} embed files

Template for the document shipped with the deliverable. It is read by the client and by whoever adds the component to the WordPress theme. Write what to do and where to change things, not how it was built.

## Contents

| File | What it is |
| --- | --- |
| `index.html` | Preview page. Open it in a browser to see the component on its own |
| `embed.html` | The parts to add to the theme, with a heading for where each part goes |
| `{bundle}/` | CSS, JavaScript, data, and images. Put the whole folder in the theme without changing its layout |
| `preview_assets/` | Used only by `index.html`. Not needed in the theme |

## Adding it to the theme

1. Put `{bundle}/` in the theme (for example, directly under the theme folder)
2. Copy each part of `embed.html` to its place
   - "Put inside `<head>`": the `<head>` of `header.php` or equivalent
   - "Put where the component should appear": the template that shows it (the front page and so on)
   - "Put right before `</body>`": right before `</body>` in `footer.php` or equivalent. Keep the order
3. Change the `{bundle}/...` paths to match where you put the folder (for example, `<?php echo get_template_directory_uri(); ?>/{bundle}/...`)

## Site settings that may need changes

- External library from a CDN: if the site cannot load files from the CDN, or sets a Content Security Policy, allow `{cdn-host}` in `script-src` (and `connect-src` when a preconnect is used)
- Data files fetched by JavaScript are found relative to the script's own location, so they work from any page as long as the folder layout stays the same
- Server compression: enabling gzip or Brotli for `.json` and binary data makes the first load faster

## When the animation does not play

The component shows its final state instead of animating when:

- The visitor's OS asks for reduced motion (macOS/iOS "Reduce motion", Windows "Animation effects" off, Android "Remove animations")
- JavaScript is disabled, or a script or the external library cannot be loaded
- The browser lacks a required feature

## Updating the external library

- The library is pinned to one version and loaded with an `integrity` (SRI) attribute
- To update it, change the version in the URL and replace `integrity` with the hash of the new file. A wrong hash blocks the file, and the component shows its final state
- License: {license-summary}. Check the current license terms before updating
