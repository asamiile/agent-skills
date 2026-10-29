"""Shared bearer token for a single-user or internal API. Only the server-side proxy holds it, never the browser."""

import hmac
import os

from fastapi import Header, HTTPException, status


def verify_token(authorization: str | None = Header(None)) -> None:
    expected = os.environ.get("APP_API_TOKEN", "")
    if not expected:
        # Misconfiguration must fail closed, not open
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "APP_API_TOKEN is not configured")
    # Header(None), not a required header: a missing header then gets the same 401 as a wrong one, not a 422
    scheme, _, token = (authorization or "").partition(" ")
    # compare_digest takes the same time however many leading characters match, so timing reveals nothing
    if scheme.lower() != "bearer" or not hmac.compare_digest(token.encode(), expected.encode()):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or missing token", headers={"WWW-Authenticate": "Bearer"})
