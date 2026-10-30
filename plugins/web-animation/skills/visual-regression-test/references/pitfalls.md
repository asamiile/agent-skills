# Pitfalls and the reasoning behind the test helpers

## Blank images in full-page screenshots

`page.screenshot({ fullPage: true })` temporarily enlarges the viewport. `srcset` and `<picture>` can then choose a different image, which has not loaded yet, and the screenshot shows it blank. Instead, resize the viewport to the page height, wait for images again, take a normal screenshot, and restore the size. Recording `currentSrc` before and after the capture shows when this still happens.

## Screenshots taken before the image is painted

`img.complete` becomes true before an image with `decoding="async"` is painted. Wait for `img.decode()` and then two `requestAnimationFrame`s. Only wait for images that are displayed and inside the viewport; hidden images and offscreen `loading="lazy"` images never load, and waiting for them hangs. Put an upper limit on every wait so one bad image does not freeze the run, and on timeout print each image's `complete`, `naturalWidth`, and `currentSrc`.

## Canceled image requests reported as failures

Chrome's preload scanner may request an image before the test viewport is applied, then cancel it when `<picture>` picks another source (`net::ERR_ABORTED`). Real devices know their width up front, so this only happens in tests. Do not count canceled image requests as errors; count HTTP status 400 and above from `response` instead. Keep the canceled URLs for the error message, because they help when an image is really missing.

## Anti-aliasing noise in the diff

Scaled images and canvas drawings differ by a pixel or so at edges between runs. A plain per-pixel threshold either fails on that noise or misses real changes. The helper treats a pixel as equal when its color lies within the color range of the other image's 3×3 neighborhood, plus a small tolerance. Edge jitter passes; a shift of 2px or more fails. Raise the tolerance only after looking at the diff image.

## Waiting when JavaScript is disabled

`page.waitForFunction()` runs its check inside the page, so it never resolves when JavaScript is disabled. Poll from Node with `$$eval` instead (`pollOpacity`).

## Testing against the production behavior

The mock page loads tuning scripts (a GUI library, mock extensions). Block them in tests so the page autoplays exactly as in production, and test the real preview page once its markup is final.

## Separate servers for tests and development

A live-reload dev server injects its own script and WebSocket. Tests start their own static server on `127.0.0.1` with a free port and `Cache-Control: no-store`, so every run reads fresh files and runs never collide.
