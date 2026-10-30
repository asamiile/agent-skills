"""
HTTP function that receives device readings from an MQTT broker's webhook and stores them in BigQuery.

Security: the broker sends a shared secret in a header; requests without it are rejected before anything is
parsed. Errors are logged in full but answered with a generic message, so internals never reach the caller.
LOCAL_TEST_MODE=true validates and echoes the row without writing, for `functions-framework` runs on a laptop.
"""

from __future__ import annotations

import datetime
import hmac
import json
import logging
import math
import os

import functions_framework

DATASET = os.environ.get("BQ_DATASET", "{dataset}")
TABLE = os.environ.get("BQ_TABLE", "{table}")
SECRET_HEADER = "X-Ingest-Secret"
LOCAL_TEST_MODE = os.environ.get("LOCAL_TEST_MODE", "false").lower() == "true"

# Field -> (type, required, (min, max) or None). Ranges catch unit mix-ups and sensor faults at the door
SCHEMA = {
    "device_id": (str, True, None),
    "temperature": (float, False, (-40.0, 85.0)),
    "humidity": (float, False, (0.0, 100.0)),
    "pressure": (float, False, (300.0, 1100.0)),
}

_client = None


def _bigquery():
    global _client
    if _client is None:
        from google.cloud import bigquery  # imported lazily: local tests and test mode do not need it

        _client = bigquery.Client()
    return _client


def validate(payload: object) -> tuple[dict | None, str | None]:
    if not isinstance(payload, dict):
        return None, "JSON object required"
    unknown = set(payload) - set(SCHEMA) - {"device_time"}
    if unknown:
        return None, f"unknown fields: {', '.join(sorted(unknown))}"
    row = {}
    for field, (kind, required, bounds) in SCHEMA.items():
        value = payload.get(field)
        if value is None:
            if required:
                return None, f"{field} is required"
            row[field] = None
            continue
        if kind is float:
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                return None, f"{field} must be a number"
            value = float(value)
            if bounds and not bounds[0] <= value <= bounds[1]:
                return None, f"{field} out of range"
        elif not isinstance(value, kind) or not value or len(value) > 64:
            return None, f"{field} must be a non-empty string"
        row[field] = value
    # Server receive time is the reliable clock; keep the device's own time too when it sends one
    row["received_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="milliseconds")
    row["device_time"] = payload.get("device_time") if isinstance(payload.get("device_time"), str) else None
    return row, None


@functions_framework.http
def ingest(request):
    expected = os.environ.get("INGEST_SECRET", "")
    supplied = request.headers.get(SECRET_HEADER, "")
    if not expected:
        logging.error("INGEST_SECRET is not set")
        return {"error": "server not configured"}, 500
    if not hmac.compare_digest(supplied.encode(), expected.encode()):
        return {"error": "unauthorized"}, 401

    row, problem = validate(request.get_json(silent=True))
    if problem:
        return {"error": problem}, 400

    if LOCAL_TEST_MODE:
        logging.info("[test mode] %s", json.dumps(row))
        return {"status": "ok", "test_mode": True, "row": row}, 200

    try:
        client = _bigquery()
        errors = client.insert_rows_json(f"{client.project}.{DATASET}.{TABLE}", [row])
    except Exception:
        logging.exception("BigQuery insert failed")
        return {"error": "storage failed"}, 500
    if errors:
        logging.error("BigQuery rejected the row: %s", errors)  # usually a schema mismatch; see the table schema
        return {"error": "storage rejected the row"}, 500
    return {"status": "ok"}, 200
