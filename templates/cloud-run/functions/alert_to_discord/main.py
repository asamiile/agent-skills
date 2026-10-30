"""
Receives Google Cloud Monitoring webhook notifications and posts them to a Discord channel.

- The notification channel's URL carries a token (?auth_token=...), checked in constant time; without it the
  function is an open relay that anyone can use to post into the channel
- Alert text is untrusted: Discord mentions are disabled unless the URL asks for a critical ping, so an alert
  summary containing "@everyone" cannot ping anyone
- Known services get a friendly title and a checklist (ROUTES); anything else is posted as state + summary
"""

from __future__ import annotations

import hmac
import logging
import os
from datetime import datetime, timedelta, timezone

import functions_framework
import requests

DISCORD_LIMIT = 2000
TIMEZONE = timezone(timedelta(hours=int(os.environ.get("ALERT_TZ_OFFSET_HOURS", "0"))))

# service_name label (or policy name) -> (title, checklist shown while the incident is open)
ROUTES: dict[str, tuple[str, list[str]]] = {
    "{service-name}": ("{Device} data delivery", ["Device power and Wi-Fi", "Broker connection and webhook", "Function logs"]),
}


def _time(value) -> str:
    try:
        return datetime.fromtimestamp(float(value), TIMEZONE).strftime("%Y-%m-%d %H:%M:%S %Z")
    except (TypeError, ValueError, OverflowError, OSError):
        return "unknown"


def build_message(payload: dict, critical: bool) -> dict:
    incident = payload.get("incident") or {}
    state = str(incident.get("state", "unknown")).upper()
    service = ((incident.get("resource") or {}).get("labels") or {}).get("service_name") or incident.get("policy_name", "")
    if service in ROUTES and state in ("OPEN", "CLOSED"):
        title, checklist = ROUTES[service]
        closed = state == "CLOSED"
        lines = [
            f"**{'✅ Resolved' if closed else '⚠️ Alert'}: {title}**",
            f"{'Closed' if closed else 'Detected'} at {_time(incident.get('ended_at' if closed else 'started_at'))}",
        ]
        if not closed:
            lines += ["", "Check:"] + [f"- {item}" for item in checklist]
    else:
        lines = [f"**[{state}]** {incident.get('summary') or 'No summary'}"]
    if incident.get("url"):
        lines += ["", f"Details: {incident['url']}"]
    content = ("@everyone\n" if critical else "") + "\n".join(lines)
    return {
        "content": content[:DISCORD_LIMIT],
        # Only the ping we add ourselves; mentions inside alert text stay inert
        "allowed_mentions": {"parse": ["everyone"] if critical else []},
    }


@functions_framework.http
def notify_discord(request):
    expected = os.environ.get("ALERT_AUTH_TOKEN", "")
    if not expected:
        logging.error("ALERT_AUTH_TOKEN is not set")
        return {"error": "server not configured"}, 500
    if not hmac.compare_digest(request.args.get("auth_token", "").encode(), expected.encode()):
        return {"error": "unauthorized"}, 401

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return {"error": "JSON object required"}, 400

    webhook = os.environ.get("DISCORD_WEBHOOK_URL", "")
    if not webhook:
        logging.error("DISCORD_WEBHOOK_URL is not set")
        return {"error": "server not configured"}, 500

    message = build_message(payload, critical=request.args.get("channel") == "critical")
    try:
        response = requests.post(webhook, json=message, timeout=10)
    except requests.RequestException:
        logging.exception("Discord request failed")
        return {"error": "delivery failed"}, 502
    if response.status_code not in (200, 204):
        logging.error("Discord answered %s: %s", response.status_code, response.text[:500])
        return {"error": "delivery failed"}, 502  # Monitoring retries on errors; the details stay in the logs
    return {"status": "sent"}, 200
