---
name: verify-production-release
description: Verifies a web release after deploying it - an automated smoke check of status codes, redirects, robots, sitemap, and key pages with curl, then written end-to-end scenarios for features with real side effects (emails, notifications, paid APIs, rate limits) that mark which steps cost money and run only when their logic changed - plus custom-domain, DNS, and TLS checks for new hosts. Use when the user says things like "check production after the deploy", "is the site up", "smoke test the release", "make a production test scenario for the contact form", or "the custom domain doesn't work".
---

# Verify a production release

Starter files, in this repository: `templates/web-modern/scripts/smoke-check.sh` and `templates/web-modern/release/production-scenarios.md`.

## 1. Automated smoke check (every deploy)

Edit `CHECKS` in `smoke-check.sh` for the site, then run it against the deployed URL:

```sh
./scripts/smoke-check.sh https://{domain}
```

Cover at least: the root redirect (or not) per the routing design, one page per locale and template type with its `<title>`, `robots.txt` and `sitemap.xml` pointing at the production domain (not a preview domain), AI-facing files such as `llms.txt` when the site has them, and a missing page returning 404. It only reads, so it is safe on production. Add it as a final step of the deploy workflow too.

## 2. Scenarios for features with side effects

For each feature that sends email, posts notifications, calls paid APIs, or has rate limits, keep one file from `production-scenarios.md`:

- Follow the whole path once (public form → API → admin → real email → notification), with the expected result per step
- State up front which steps cost money or count against limits, and mark the steps that only need to run when that logic changes (*on change only*)
- Include the failure paths that protect the main action: a notification that fails must not fail the submission
- Check that production is not using development settings (for example a "[dev]" prefix in notifications)
- End with cleanup through the admin screen

Run the scenario after every deploy that touches the feature. Ask before running steps that send real email or spend money.

## 3. New hosts and domains

When a site moves to a new host or gets a custom domain, follow [references/domains-and-tls.md](references/domains-and-tls.md), then run the smoke check against both the custom domain and the host's default domain (which should redirect to the custom one).

## 4. Report

List each check with pass or fail, the commit that was deployed, and anything skipped (and why).
