import importlib

import flask
import pytest


class Response:
    def __init__(self, status, text=""):
        self.status_code, self.text = status, text


@pytest.fixture()
def fn(monkeypatch):
    monkeypatch.setenv("ALERT_AUTH_TOKEN", "tok")
    monkeypatch.setenv("DISCORD_WEBHOOK_URL", "https://discord.example/webhook")
    import main

    main = importlib.reload(main)
    main.ROUTES = {"save-data": ("Sensor data delivery", ["Device power", "Function logs"])}
    sent = []
    monkeypatch.setattr(main.requests, "post", lambda url, json, timeout: sent.append(json) or Response(204))
    return main, sent


def call(main, payload, query="?auth_token=tok"):
    app = flask.Flask(__name__)
    with app.test_request_context("/" + query, json=payload, method="POST"):
        return main.notify_discord(flask.request)


def incident(**fields):
    return {"incident": {"state": "open", "summary": "CPU high", **fields}}


def test_requires_the_token(fn):
    main, sent = fn
    for query in ("", "?auth_token=bad"):
        assert call(main, incident(), query)[1] == 401
    assert sent == []


def test_known_service_gets_title_and_checklist(fn):
    main, sent = fn
    body = incident(resource={"labels": {"service_name": "save-data"}}, started_at=0, url="https://console/x")
    assert call(main, body)[1] == 200
    content = sent[0]["content"]
    assert "Alert: Sensor data delivery" in content and "- Device power" in content and "Details: https://console/x" in content


def test_alert_text_cannot_ping_everyone(fn):
    main, sent = fn
    call(main, incident(summary="@everyone free money"))
    assert sent[0]["allowed_mentions"] == {"parse": []}
    call(main, incident(), "?auth_token=tok&channel=critical")
    assert sent[1]["content"].startswith("@everyone") and sent[1]["allowed_mentions"] == {"parse": ["everyone"]}


def test_long_messages_are_cut_to_discord_limit(fn):
    main, sent = fn
    call(main, incident(summary="x" * 5000))
    assert len(sent[0]["content"]) == main.DISCORD_LIMIT


def test_discord_errors_are_not_echoed(fn, monkeypatch):
    main, _ = fn
    monkeypatch.setattr(main.requests, "post", lambda *a, **k: Response(400, "webhook token invalid: abc123"))
    body, status = call(main, incident())
    assert status == 502 and "abc123" not in str(body)


def test_bad_body(fn):
    main, _ = fn
    assert call(main, ["not", "an", "object"])[1] == 400
