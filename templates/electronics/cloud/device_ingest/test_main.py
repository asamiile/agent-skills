import importlib
import json

import flask
import pytest


@pytest.fixture()
def app(monkeypatch):
    monkeypatch.setenv("INGEST_SECRET", "s3cret")
    monkeypatch.setenv("LOCAL_TEST_MODE", "false")
    import main

    main = importlib.reload(main)
    stored = []

    class FakeClient:
        project = "proj"

        def insert_rows_json(self, table, rows):
            stored.append((table, rows))
            return []

    main._client = FakeClient()
    return main, stored


def call(main, body, secret="s3cret"):
    flask_app = flask.Flask(__name__)
    headers = {main.SECRET_HEADER: secret} if secret is not None else {}
    with flask_app.test_request_context(json=body, headers=headers, method="POST"):
        return main.ingest(flask.request)


def test_stores_a_valid_reading(app):
    main, stored = app
    body, status = call(main, {"device_id": "d1", "temperature": 21.5, "humidity": 40})
    assert status == 200 and body == {"status": "ok"}
    table, rows = stored[0]
    assert table == f"proj.{main.DATASET}.{main.TABLE}"
    assert rows[0]["temperature"] == 21.5 and rows[0]["pressure"] is None and rows[0]["received_at"].endswith("+00:00")


@pytest.mark.parametrize("secret", [None, "", "wrong"])
def test_rejects_missing_or_wrong_secret(app, secret):
    main, stored = app
    assert call(main, {"device_id": "d1"}, secret=secret)[1] == 401
    assert stored == []


@pytest.mark.parametrize(
    "body, message",
    [
        ([1, 2], "JSON object required"),
        ({"temperature": 20}, "device_id is required"),
        ({"device_id": "d1", "temperature": "hot"}, "temperature must be a number"),
        ({"device_id": "d1", "humidity": 140}, "humidity out of range"),
        ({"device_id": "d1", "temperature": True}, "temperature must be a number"),
        ({"device_id": "d1", "rogue": 1}, "unknown fields: rogue"),
    ],
)
def test_rejects_bad_payloads(app, body, message):
    main, stored = app
    response, status = call(main, body)
    assert status == 400 and response["error"] == message and stored == []


def test_storage_errors_do_not_leak(app):
    main, _ = app

    class Broken:
        project = "proj"

        def insert_rows_json(self, *_):
            raise RuntimeError("internal detail: credentials path /secret/key.json")

    main._client = Broken()
    response, status = call(main, {"device_id": "d1"})
    assert status == 500 and "internal" not in json.dumps(response)


def test_missing_server_secret_fails_closed(app, monkeypatch):
    main, _ = app
    monkeypatch.setenv("INGEST_SECRET", "")
    assert call(main, {"device_id": "d1"})[1] == 500
