---
name: protect-fastapi-endpoints
description: Protects a FastAPI app that is not meant to be public or that spends money per request - a shared bearer token compared in constant time that fails closed when unset and answers a missing header with 401, the token kept on the frontend's server side only, per-endpoint rate limits with slowapi, input length limits in Pydantic, and a single place to apply them to every route. Use when the user says things like "add an API token", "only my frontend should call the API", "limit how many images can be generated per hour", "missing header returns 422", or "secure the internal API".
---

# Protect FastAPI endpoints

Starter files, in this repository: `templates/fastapi/auth.py` and `templates/fastapi/main.py`.

## 1. Shared token

For a single-user or internal app, one shared bearer token is enough:

- Read it from the environment; if it is unset, return 500 for every protected request (fail closed), never skip the check
- Accept the header as optional (`Header(None)`) and handle absence yourself: a required header makes FastAPI answer 422 before your code runs, which differs from the 401 for a wrong token
- Compare with `hmac.compare_digest`, which takes the same time however much of the token matches
- Return `WWW-Authenticate: Bearer` with 401
- Apply it to every route except health checks and static files, with `dependencies=[Depends(verify_token)]` on each route or on the router

The browser never holds the token: it calls the frontend's own server routes, which add it (`nextjs:proxy-long-backend-requests`). For several users, switch to real authentication with per-user scoping; a shared token has no notion of who is calling.

## 2. Rate limits

- `slowapi` with a limit from an environment variable, on every endpoint that triggers paid or heavy work (create, retry, finalize). The endpoint needs a `request: Request` parameter for the limiter
- Behind a proxy, the client address is the proxy's; key the limit on a trusted forwarded header or on the token instead, or the limit becomes global by accident
- Raise the limit in tests through the environment

## 3. Input limits

Constrain every user field in the Pydantic model (`min_length`, `max_length`, enums for choices). The model rejects bad input with 422 before any external call.

## 4. Check

Tests for: no header, wrong token, wrong scheme, server token unset, over-long input, and the 429 after the limit (`fastapi:test-fastapi-app`).
