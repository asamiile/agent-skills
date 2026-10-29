---
name: test-fastapi-app
description: Sets up pytest for a FastAPI app - environment variables set before the app is imported (overriding values docker compose already injected), a fresh temporary SQLite database per test through dependency_overrides, external services (AI providers, payment, email) replaced with AsyncMock on the module attribute the code looks up, rate limits raised for tests, and tests for auth, validation, and per-item failures. Use when the user says things like "write tests for the API", "tests hit the real rate limit", "my monkeypatch doesn't take effect", "tests share database state", or "mock the external API in FastAPI tests".
---

# Test a FastAPI app

Starter files, in this repository: `templates/fastapi/conftest.py`, `templates/fastapi/tests/test_api.py`, and the small app they test (`main.py`, `auth.py`, `database.py`).

## 1. Environment first

Modules read configuration at import. In `conftest.py`, assign the test values to `os.environ` **before** importing the app. Use plain assignment, not `setdefault`: when tests run inside docker compose, the real `.env` values are already present and `setdefault` keeps them (the real token, the production rate limit).

## 2. One database per test

The `client` fixture creates a temporary SQLite file, builds the schema, and swaps it in with `app.dependency_overrides[get_db]`; it clears the override and deletes the file afterwards. Tests never see each other's rows. When the app runs migrations at startup, point `DATABASE_URL` at a throwaway file too.

## 3. Replace external calls

Patch the attribute on the module the app looks up at call time (`monkeypatch.setattr(provider_module, "generate", AsyncMock(...))`). Patching only works when the app calls `module.fn` through a registry or the module object; `from module import fn` copies the reference at import and the patch never reaches it.

Use `AsyncMock` for async functions, and assert both the response and how the mock was called (`assert_awaited_once_with`), including that it was **not** called when validation should stop the request.

## 4. What to cover

- Auth: no header, wrong token, wrong scheme, and the server's own token missing (must fail closed)
- Validation: empty and over-long inputs give 422 before any external call
- Per-item failures: a batch with a failed item is stored and returned as failed, and the retry endpoint replaces only that item
- Rate limits: one test with a low limit that expects 429 after the limit (reload the module with the lower value, or configure the limiter per test)

## 5. CI

Run `pytest` in CI with the same Python version as the container. Keep a separate `requirements-dev.txt` for test-only packages.
