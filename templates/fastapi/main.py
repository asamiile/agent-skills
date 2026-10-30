"""Minimal app showing the conventions the tests rely on: env read at import, token on every route, rate limits."""

import os

from fastapi import Depends, FastAPI, Request
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from auth import verify_token
from database import get_db
from providers import get_provider

# Caps runaway spend on paid APIs; one value shared by every generation endpoint
RATE_LIMIT_PER_HOUR = int(os.environ.get("RATE_LIMIT_PER_HOUR", "10"))

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=200)
    provider: str = "example_cloud"


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/generate", dependencies=[Depends(verify_token)])
@limiter.limit(f"{RATE_LIMIT_PER_HOUR}/hour")
async def generate(request: Request, body: GenerateRequest, db=Depends(get_db)) -> dict:
    provider = get_provider(body.provider)  # looked up per call, so tests can monkeypatch the module
    expanded = await provider.expand_prompt(body.prompt)
    paths = await provider.generate_batch(expanded, 4)
    return {"prompt": expanded, "previews": [{"path": p, "status": "success" if p else "failed"} for p in paths]}
