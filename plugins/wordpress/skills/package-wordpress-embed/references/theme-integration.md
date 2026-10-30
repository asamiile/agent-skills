# Theme integration: lessons and reasoning

## Why the preview page is the single source of the markup

Keeping separate copies of the markup (a mock, the preview page, the embed snippet) means they drift. Tune the component in a mock page, copy the finished markup into `index.html` once, and generate the embed snippet from `index.html`. The snippet then always matches what was tested.

## Why a namespaced bundle folder

Themes usually already have `assets/css`, `assets/js`, and `assets/images`. Shipping files under a dedicated folder (`{bundle}/css`, `{bundle}/js`, ...) lets the theme developer drop the folder in without merging it with the theme's files. Relative `url()` paths inside the CSS keep working because the internal layout is preserved.

## Why only referenced files are copied

Copying the whole `public/` folder ships leftovers: images replaced during tuning, mock assets, and source files. Following references from the HTML (and from CSS `url()`) ships exactly what the page uses. Files fetched by JavaScript are invisible to this scan, so they are declared with `<link rel="preload">`, which also starts the download earlier.

## Theme CSS that leaks into components

- `img { max-width: 100%; height: auto; }` is common in themes and breaks absolutely positioned or oversized artwork. Override inside the component with a selector that wins on specificity, such as `.{prefix} img[class]`, instead of `!important`
- Global `box-sizing`, `line-height`, and heading margins also leak in. Set what the component relies on at its root
- Do not style `html` or `body` from the component's stylesheet. The theme owns them

## Inline styles and CSP

Sites that set `Content-Security-Policy: style-src 'self'` block `style="..."` attributes. Per-item positions written inline (for example, one value per letter of a headline) disappear on such sites. Put them in the stylesheet with `:nth-child()` or modifier classes. Setting styles from JavaScript through the CSSOM (`element.style.x = ...`) is not blocked by `style-src`, but an inline `style` attribute in the HTML is.

## Resolving data paths

WordPress serves the same template under many URLs (permalinks, subdirectories, multisite). A data path relative to the page breaks on some of them. Resolve it from the script's own URL:

```js
const base = new URL('.', document.currentScript.src); // read at the top level, before any await
const dataUrl = new URL('../data/{file}', base);
```

## External libraries from a CDN

- Loading from a CDN makes updates a one-line change (the version in the URL plus `integrity`) and keeps library files out of the theme
- Pin an exact version and add `integrity` and `crossorigin="anonymous"`. A tampered or unexpected file is not executed
- Add `<link rel="preconnect" href="https://{cdn-host}" crossorigin>` in `<head>` so the connection is ready when the script is requested
- Plan for the CDN being blocked (corporate networks, CSP). The component must then show its final state, not a blank area
- Keep the library's npm package as a dev dependency at the same version if you need its type definitions

## Comments in shipped code

The client and the theme developer read the shipped files. Write what each part does and which value to change for which effect, in one or two lines. Keep history, trial results, and references to internal specs and mocks out of shipped code. They belong in the project's spec.
