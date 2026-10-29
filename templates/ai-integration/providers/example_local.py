"""Example provider. Replace the bodies with real API calls; keep the signatures."""

from __future__ import annotations

from .prompts import SYSTEM_PROMPT, user_message


async def expand_prompt(user_prompt: str) -> str:
    """Turn a short user prompt into a full model prompt (send SYSTEM_PROMPT + user_message(user_prompt))."""
    _ = (SYSTEM_PROMPT, user_message(user_prompt))
    raise NotImplementedError


async def generate_one(prompt: str) -> str | None:
    """Create one low-cost preview; return its stored path, or None on failure (never raise for a model error)."""
    raise NotImplementedError


async def generate_batch(prompt: str, count: int) -> list[str | None]:
    """Create `count` previews concurrently; failures are None so the caller can retry them one by one."""
    raise NotImplementedError


async def generate_final(prompt: str, reference_path: str) -> str | None:
    """Create the expensive final output from a chosen preview."""
    raise NotImplementedError
