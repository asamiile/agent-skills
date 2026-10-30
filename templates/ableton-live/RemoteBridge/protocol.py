"""
JSON messages between the script and its clients. Mirror these shapes in the client's types.

  client → script   {"type": "command", "action": "...", "params": {...}, "id": "optional"}
  script → client   {"type": "response", "id": "...", "ok": true|false, "error": "..."}   (only when the command had an id)
  script → client   {"type": "state", "topic": "...", "value": ...}                          (pushed on every change)

Live is the source of truth: clients may update optimistically, but the next "state" message wins.
"""

import json


def decode_command(raw):
    """Return {"action", "params", "id"} or None for anything malformed."""
    try:
        message = json.loads(raw)
    except ValueError:
        return None
    if not isinstance(message, dict) or message.get("type") != "command":
        return None
    action = message.get("action")
    params = message.get("params", {})
    request_id = message.get("id")
    if not isinstance(action, str) or not action or not isinstance(params, dict):
        return None
    if request_id is not None and not isinstance(request_id, str):
        return None
    return {"action": action, "params": params, "id": request_id}


def encode_response(request_id, ok=True, error=None):
    message = {"type": "response", "id": request_id, "ok": ok}
    if error:
        message["error"] = error
    return json.dumps(message)


def encode_state(topic, value, **extra):
    message = {"type": "state", "topic": topic, "value": value}
    message.update(extra)
    return json.dumps(message)
