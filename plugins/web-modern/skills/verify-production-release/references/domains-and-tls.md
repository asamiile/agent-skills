# Custom domains, DNS, and TLS

## A DNS provider in front of a hosting platform

When DNS lives with a provider that can also proxy traffic (for example Cloudflare) and the site is hosted on a platform that issues its own certificates (Netlify, Vercel, and similar):

- Point a subdomain at the platform with a CNAME, and set the record to **DNS only** (no proxy). The platform must see requests directly to issue and renew its certificate
- With the proxy on, certificate issuance can fail, and two CDNs in a row can cause redirect loops. Put the proxy in front only on purpose, with the provider's SSL mode set to full (strict) and the platform's certificate already issued
- After DNS propagates, set the custom domain as primary on the platform and redirect the platform's default domain to it

## Things that must name the production domain

Check each of these after the first deploy to a new domain:

- The canonical/base URL setting (for example `metadataBase` or a `SITE_URL` constant)
- `sitemap.xml`, `robots.txt`, hreflang alternates, Open Graph URLs
- `llms.txt` and any other generated files with absolute links
- Environment variables baked in at build time (a changed public URL needs a rebuild, not just a restart)

Register the domain in the search console and submit the sitemap. If analytics is shared with a parent site, decide whether the subdomain gets its own stream.

## Framework and platform support

A new framework major can be ahead of a hosting platform's adapter. Routing features such as middleware or request proxies are the usual first casualties: a redirect that works locally silently does nothing in production. Include those routes in the smoke check, and read the platform's support notes before upgrading.
