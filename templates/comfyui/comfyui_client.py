"""
Minimal async client for ComfyUI's HTTP API.

Flow: load a workflow saved in "API format" → set inputs by node title → POST /prompt → poll
GET /history/{prompt_id} until outputs appear → GET /view for each output image.
Workflows are JSON files in the repository, so changes to them are reviewed like code.
"""

from __future__ import annotations

import asyncio
import copy
import json
import time
import uuid
from pathlib import Path
from typing import Any

import httpx


class ComfyError(RuntimeError):
    pass


def load_workflow(path: Path) -> dict[str, Any]:
    workflow = json.loads(path.read_text(encoding="utf-8"))
    if not all(isinstance(node, dict) and "class_type" in node for node in workflow.values()):
        raise ComfyError(f"{path} is not in API format (export it with 'Save (API)')")
    return workflow


def set_inputs(workflow: dict[str, Any], values: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """Return a copy with inputs set by node title: {"Positive prompt": {"text": "..."}}.

    Titles (set in the ComfyUI editor) survive re-exports; numeric node IDs do not.
    """
    result = copy.deepcopy(workflow)
    by_title = {node.get("_meta", {}).get("title"): node for node in result.values()}
    for title, inputs in values.items():
        node = by_title.get(title)
        if node is None:
            raise ComfyError(f"no node titled {title!r} in the workflow")
        node["inputs"].update(inputs)
    return result


class ComfyClient:
    def __init__(self, base_url: str, *, timeout_s: float = 900, poll_interval_s: float = 2.0):
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s  # CPU-only runs take minutes per image; make it configurable
        self.poll_interval_s = poll_interval_s
        self.client_id = str(uuid.uuid4())

    async def run(self, workflow: dict[str, Any]) -> list[bytes]:
        async with httpx.AsyncClient(base_url=self.base_url, timeout=30) as http:
            queued = await http.post("/prompt", json={"prompt": workflow, "client_id": self.client_id})
            if queued.status_code != 200:
                # ComfyUI explains invalid workflows (missing model, bad input) in the body
                raise ComfyError(f"queue rejected ({queued.status_code}): {queued.text[:500]}")
            prompt_id = queued.json()["prompt_id"]

            deadline = time.monotonic() + self.timeout_s
            while True:
                history = (await http.get(f"/history/{prompt_id}")).json()
                entry = history.get(prompt_id)
                if entry:
                    status = entry.get("status", {})
                    if status.get("status_str") == "error":
                        raise ComfyError(f"workflow failed: {json.dumps(status.get('messages', []))[:500]}")
                    if status.get("completed", True) and entry.get("outputs"):
                        break
                if time.monotonic() > deadline:
                    raise ComfyError(f"timed out after {self.timeout_s:.0f}s (prompt {prompt_id})")
                await asyncio.sleep(self.poll_interval_s)

            images = []
            for output in entry["outputs"].values():
                for image in output.get("images", []):
                    if image.get("type") != "output":
                        continue  # previews and temp files are not results
                    response = await http.get("/view", params={k: image[k] for k in ("filename", "subfolder", "type")})
                    response.raise_for_status()
                    images.append(response.content)
            if not images:
                raise ComfyError("workflow finished without output images (is there a SaveImage node?)")
            return images
