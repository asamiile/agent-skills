---
name: build-device-data-pipeline
description: Builds and debugs the path from a sensor device to a database - the device publishes JSON over MQTT (Adafruit IO, Shiftr.io, or another broker), the broker's webhook posts it to an HTTP function that checks a shared secret and validates the payload, and the function writes rows to BigQuery or another store - with a local test mode, server-side timestamps, consistent changes to topics and payloads on both ends, and a fixed order for tracing lost data. Use when the user says things like "send sensor data to the cloud", "store my weather station readings", "the data stopped arriving", "set up the MQTT webhook", or "save device data to BigQuery".
---

# Build a device-to-cloud data pipeline

Starter files, in this repository: `templates/electronics/cloud/device_ingest/` (`main.py`, `test_main.py`, `requirements.txt`). Deployment details: [references/deploy-and-trace.md](references/deploy-and-trace.md). Alerts when data stops: `cloud-run:alert-to-discord`.

## 1. Design the message once

Write down the topic name, the JSON fields with types, units, and valid ranges, and the device ID scheme, and keep it next to both the firmware and the function. Any change to a topic, field, or ID changes the publisher and every consumer in the same change.

## 2. Device

- Publish small JSON objects at a fixed interval from a non-blocking loop; reconnect with back-off when Wi-Fi or the broker drops
- Include the device ID; include the device's own time only if it is synchronized (NTP), and send it as a separate field
- Log each publish result to the serial monitor during development

## 3. Broker

Pick one broker per data flow and keep their settings separate (credentials, topics). For a webhook, the topic filter must match the device's topic exactly; the method is POST with JSON; the URL is the deployed function's; the webhook is enabled. Add the shared secret as a header in the webhook settings.

## 4. Function

The template:

- Rejects requests without the shared secret (constant-time comparison) before parsing anything, and fails closed when the secret is not configured. Without it, anyone with the URL can write rows
- Validates fields, types, and ranges, and rejects unknown fields
- Stamps the server's receive time in UTC with milliseconds, which is the reliable clock for joining data sources
- Logs failures in full but answers with a generic message, so internals never reach the caller
- `LOCAL_TEST_MODE=true` validates and echoes the row without writing, for local runs with the functions framework

## 5. Storage

Create the table with a schema matching the row (types, nullable fields), partitioned by time for large volumes. Grant the function's service account only the permissions needed to insert data into that dataset.

## 6. When data stops

Trace in this order and stop at the first place the data is missing: device serial log → broker's received-message history → webhook delivery history → function logs → table schema and permissions. Each step names its cause (Wi-Fi, topic mismatch, disabled webhook, rejected secret or payload, schema mismatch).
