---
name: alert-to-discord
description: Sends Google Cloud Monitoring alerts to a Discord channel through a small Cloud Run function - a token in the notification channel URL so the function is not an open relay, friendly titles and checklists for known services, open and closed incidents, optional @everyone pings only for critical channels with mentions inside alert text disabled, Discord's message length limit, and errors kept out of responses. Use when the user says things like "send GCP alerts to Discord", "notify me when data stops arriving", "Cloud Monitoring webhook to chat", or "alert when the device goes offline".
---

# Send Cloud Monitoring alerts to Discord

Starter files, in this repository: `templates/cloud-run/functions/alert_to_discord/` (`main.py`, `test_main.py`, `requirements.txt`).

## 1. Discord

In the target channel: Edit Channel → Integrations → Webhooks → new webhook. Treat its URL as a secret: anyone with it can post as the webhook.

## 2. Function

1. Fill `ROUTES` with the services you alert on (the `service_name` label, or the policy name) and a short checklist for each
2. Deploy as a Cloud Run function (`gcloud run deploy {name} --source . --function notify_discord ...`, checking current flags), with `DISCORD_WEBHOOK_URL` and `ALERT_AUTH_TOKEN` from Secret Manager, and `ALERT_TZ_OFFSET_HOURS` for displayed times
3. It must be reachable without Google authentication (Monitoring's webhook cannot sign identity tokens); the token in the URL is the check

What the template does:

- Rejects calls without the right `auth_token` (constant-time comparison); fails closed if the token is not configured
- Builds open and closed messages for known services, and state + summary for anything else
- Disables mentions from alert text (`allowed_mentions`); only `?channel=critical` adds an `@everyone` ping
- Cuts messages to Discord's 2000-character limit
- Logs Discord errors and answers 502 without echoing them, so Monitoring retries

## 3. Monitoring

Create a webhook notification channel with the function URL plus `?auth_token={token}` (and `&channel=critical` on a second channel for pages). For "data stopped arriving", alert on the absence of requests to the ingest function (request count below 1 over a window longer than the device's send interval), with auto-close when data resumes.

## 4. Test

`pytest` for the function. Then use the channel's "send test notification" in the console; it posts a real message (and a real ping on the critical channel).
