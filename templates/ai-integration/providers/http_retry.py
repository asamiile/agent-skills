"""Retry for raw HTTP calls to model providers: transient failures only, short backoff."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable

import httpx

RETRY_DELAYS_SECONDS = (2, 5, 10)


async def request_with_retry(
    send: Callable[[], Awaitable[httpx.Response]],
    delays: tuple[float, ...] = RETRY_DELAYS_SECONDS,
) -> httpx.Response:
    """Call `send()`; retry on 5xx, 429, and transport errors (dropped connection, timeout).

    Other 4xx responses come back at once: a bad prompt, a bad key, or a policy refusal
    will not succeed on retry, and retrying them only adds latency and cost.
    """
    for delay in (*delays, None):
        try:
            response = await send()
        except httpx.TransportError:
            if delay is None:
                raise
            await asyncio.sleep(delay)
            continue
        retryable = response.status_code >= 500 or response.status_code == 429
        if not retryable or delay is None:
            return response
        # Honor the provider's own back-off hint when it gives one
        retry_after = response.headers.get("retry-after", "")
        await asyncio.sleep(float(retry_after) if retry_after.replace(".", "", 1).isdigit() else delay)
    raise AssertionError("unreachable")
