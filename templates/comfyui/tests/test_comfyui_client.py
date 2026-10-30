"""Runs the client against a fake ComfyUI server (same endpoints and response shapes)."""

import asyncio
import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import pytest

from comfyui_client import ComfyClient, ComfyError, load_workflow, set_inputs

WORKFLOW = {
    "3": {"class_type": "CLIPTextEncode", "inputs": {"text": ""}, "_meta": {"title": "Positive prompt"}},
    "9": {"class_type": "SaveImage", "inputs": {}, "_meta": {"title": "Save"}},
}


class Fake(BaseHTTPRequestHandler):
    mode = "ok"
    polls = 0
    received = None

    def log_message(self, *args):
        pass

    def _json(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        Fake.received = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        if Fake.mode == "reject":
            return self._json(400, {"error": "ckpt_name not found"})
        self._json(200, {"prompt_id": "p1", "number": 1})

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/history/p1":
            Fake.polls += 1
            if Fake.mode == "slow" or Fake.polls < 3:
                return self._json(200, {})
            if Fake.mode == "error":
                return self._json(200, {"p1": {"status": {"status_str": "error", "completed": False, "messages": [["execution_error", {}]]}, "outputs": {}}})
            outputs = {"9": {"images": [{"filename": "a.png", "subfolder": "", "type": "output"}, {"filename": "t.png", "subfolder": "", "type": "temp"}]}}
            return self._json(200, {"p1": {"status": {"status_str": "success", "completed": True}, "outputs": outputs}})
        if url.path == "/view":
            name = parse_qs(url.query)["filename"][0]
            self.send_response(200)
            self.end_headers()
            self.wfile.write(f"bytes-of-{name}".encode())


@pytest.fixture()
def server():
    httpd = HTTPServer(("127.0.0.1", 0), Fake)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    Fake.polls, Fake.mode = 0, "ok"
    yield f"http://127.0.0.1:{httpd.server_port}"
    httpd.shutdown()
    httpd.server_close()


def test_set_inputs_by_title_without_mutating():
    updated = set_inputs(WORKFLOW, {"Positive prompt": {"text": "a lake"}})
    assert updated["3"]["inputs"]["text"] == "a lake" and WORKFLOW["3"]["inputs"]["text"] == ""
    with pytest.raises(ComfyError):
        set_inputs(WORKFLOW, {"Missing": {}})


def test_load_rejects_editor_format(tmp_path: Path):
    path = tmp_path / "w.json"
    path.write_text(json.dumps({"nodes": [], "links": []}))
    with pytest.raises(ComfyError, match="API format"):
        load_workflow(path)


def test_run_polls_and_returns_only_outputs(server):
    images = asyncio.run(ComfyClient(server, poll_interval_s=0.01).run(set_inputs(WORKFLOW, {"Positive prompt": {"text": "x"}})))
    assert images == [b"bytes-of-a.png"]
    assert Fake.received["prompt"]["3"]["inputs"]["text"] == "x"


@pytest.mark.parametrize("mode, message", [("reject", "ckpt_name not found"), ("error", "workflow failed"), ("slow", "timed out")])
def test_failures_are_reported(server, mode, message):
    Fake.mode = mode
    with pytest.raises(ComfyError, match=message):
        asyncio.run(ComfyClient(server, timeout_s=0.2, poll_interval_s=0.01).run(WORKFLOW))
