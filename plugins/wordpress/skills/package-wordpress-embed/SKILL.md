---
name: package-wordpress-embed
description: Packages a front-end component (a hero animation, key visual, or other self-contained block) built as static HTML/CSS/JS into a deliverable that a theme developer can drop into a WordPress theme. Produces a standalone preview page, an embed snippet split into "<head>", "where it appears", and "before </body>", a namespaced asset folder, shipped documents, and a dated zip. Use when the user says things like "package this for WordPress", "make the delivery zip", "prepare the files for the theme developer", or "the client will embed this in their WordPress site".
---

# Package a component for WordPress embedding

The deliverable is built from one source of truth, the preview page `public/index.html`. A script follows its references, so only files that are actually used ship. The script also generates the embed snippet from the same markup, which means the preview and the embed cannot drift apart.

Starter code: `templates/wordpress/` in this repository (`scripts/package.mjs`, `scripts/zip.mjs`, `delivery/README.md`). Copy it into the project and fill in the placeholders at the top of `package.mjs`.

## 1. Agree on the scope

Ask the user and write the answers into the project's spec before building anything:

- What is delivered: only the component, or also the preview page
- Who adds it to the theme (the client's developer or you), and whether that is in scope
- Which theme files the parts will go into (`header.php`, a front-page template, `footer.php`), if known
- Whether the site sets a Content Security Policy, and whether external CDNs are allowed

## 2. Lay out the project so packaging can stay simple

```text
public/
  index.html           Preview page. Holds the canonical markup of the component
  assets/              Everything the component needs (css/, js/, data/, images/)
  preview_assets/      Files only the preview page uses (page chrome, demo content)
  mock*.html, */mock/  Tuning pages and their code. Never shipped
delivery/              Documents shipped with the deliverable
scripts/package.mjs    Builds dist/ and release/*.zip
```

- Put `mock` in the name of every mock-only file or folder. The packaging script refuses to ship them
- Keep page-level rules (body margins, fonts used only by the preview, scaling for very wide screens) in the preview page's `<head>`. The component's CSS must not style `html`, `body`, or anything outside its root
- When JavaScript fetches data files, add `<link rel="preload" as="fetch" crossorigin="anonymous">` for each one. The script uses these links to find the files, and the browser starts fetching earlier

## 3. Make the component survive inside a theme

See [references/theme-integration.md](references/theme-integration.md) for the reasoning. The rules:

- Prefix every class, keyframe, and custom property with a project prefix that does not contain the client's name (`{prefix}__element--modifier`)
- Neutralize theme rules that commonly leak in, such as `img { max-width: 100% }` and `height: auto`. Raise specificity just enough, for example with `.{prefix} img[class]`
- Do not use inline `style` attributes. A strict CSP (`style-src` without `'unsafe-inline'`) blocks them. Put per-item values in the stylesheet (`:nth-child`, modifier classes)
- Resolve data URLs from the script's own location (`document.currentScript.src`), not from the page URL, so the component works on any page or permalink
- Load third-party libraries from a CDN with a pinned version and `integrity` (SRI) plus `crossorigin`. If the library fails to load, show the final state (see the `web-animation:animation-fallbacks` skill)

## 4. Configure and run the packaging script

Set these constants at the top of `scripts/package.mjs`:

| Constant | How to decide it |
| --- | --- |
| `BUNDLE` | A folder name that will not clash with the theme's own `assets/`. It becomes the folder the theme receives and the zip name |
| `ROOT_SELECTOR` | The opening tag of the component's root element, up to the prefix |
| `REQUIRED` | The CSS and JS files the component cannot work without |
| `DOCS` | Files in `delivery/` to ship |

Run `pnpm package`. The script:

1. Copies `index.html` and every local file referenced by `src`, `href`, `srcset`, and CSS `url()`
2. Rewrites `assets/...` to `{bundle}/...`
3. Generates `embed.html`, with the component's stylesheet and connection hints for `<head>`, the root element's markup, and the `<body>` scripts except those under `preview_assets/`
4. Copies the documents
5. Fails if a reference is broken, a required file is not loaded, or mock files, `.ts` files, type declarations, or debug markup made it into `dist/`
6. Zips `dist/` into `release/{bundle}_YYYYMMDD.zip`, with one top-level folder inside

Add `dist/` and `release/` to `.gitignore`.

## 5. Write the shipped documents

Fill in `delivery/README.md` from the template:

- What each file is, and that the bundle folder must keep its internal layout
- Which part of `embed.html` goes where in the theme, and how to rewrite the paths (`get_template_directory_uri()`)
- Site settings that may need changing (CSP entries for the CDN, compression)
- When the component shows its final state instead of animating
- How to update the pinned library (version in the URL plus the new `integrity`), and its license terms

Write comments in shipped code for the people who will maintain it: what each part does and where to adjust it. Leave out development history, references to internal files, and how to rebuild from TypeScript.

## 6. Verify before sending

- `dist/index.html` opened from a local server looks and moves the same as `public/index.html`
- `embed.html` has all three parts, and the scripts are in the right order
- `dist/` contains no mock files, no `.ts`, and no unused images (check the size list the script prints)
- Run the visual tests against `dist/` as well (see `web-animation:visual-regression-test`)
- Search the deliverable for the client's name in code, file names, and comments
