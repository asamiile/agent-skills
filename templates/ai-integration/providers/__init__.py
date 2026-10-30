"""
Provider registry. Every provider module exposes the same async functions (see CONTRACT), so the app
can switch providers per request and per step without knowing which one it is talking to.

Call providers as `get_provider(name).expand_prompt(...)`, never `from providers.x import expand_prompt`:
an imported function is a copy of the reference, so tests that monkeypatch the module would not reach it.
"""

from __future__ import annotations

from types import ModuleType
from typing import Literal

from . import example_cloud, example_local

ProviderName = Literal["example_cloud", "example_local"]

# The functions every provider module must define; checked at import time so a missing one fails fast
CONTRACT = ("expand_prompt", "generate_one", "generate_batch", "generate_final")

_PROVIDERS: dict[str, ModuleType] = {
    "example_cloud": example_cloud,
    "example_local": example_local,
}

for _name, _module in _PROVIDERS.items():
    _missing = [fn for fn in CONTRACT if not callable(getattr(_module, fn, None))]
    if _missing:
        raise ImportError(f"provider {_name!r} is missing {', '.join(_missing)}")


def get_provider(name: str) -> ModuleType:
    try:
        return _PROVIDERS[name]
    except KeyError:
        raise ValueError(f"unknown provider: {name!r}") from None


def available_providers(configured: dict[str, bool]) -> list[str]:
    """Providers whose credentials or services are configured, for the UI's provider picker."""
    return [name for name in _PROVIDERS if configured.get(name)]
