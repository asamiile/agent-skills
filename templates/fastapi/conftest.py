"""
Test setup. Environment variables are assigned before the app is imported, because modules read them at import.
Plain assignment, not setdefault: inside docker compose the real .env values are already set, and setdefault
would keep them (the real rate limit, the real token).
"""

import os
import tempfile
from collections.abc import Iterator
from unittest.mock import AsyncMock

os.environ["APP_API_TOKEN"] = "test-token"
os.environ["RATE_LIMIT_PER_HOUR"] = "1000"
os.environ["DATABASE_URL"] = "sqlite:///" + tempfile.mkstemp(suffix=".db")[1]

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

import database  # noqa: E402
import main  # noqa: E402
from providers import example_cloud  # noqa: E402


@pytest.fixture()
def client() -> Iterator[TestClient]:
    """A TestClient on a fresh SQLite file per test, swapped in through dependency_overrides."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    engine = create_engine(f"sqlite:///{path}", connect_args={"check_same_thread": False})
    # Base.metadata.create_all(bind=engine)  # create the schema from the models
    session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = session_local()
        try:
            yield db
        finally:
            db.close()

    main.app.dependency_overrides[database.get_db] = override_get_db
    try:
        with TestClient(main.app) as test_client:
            yield test_client
    finally:
        main.app.dependency_overrides.clear()
        engine.dispose()
        os.remove(path)


@pytest.fixture()
def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {os.environ['APP_API_TOKEN']}"}


@pytest.fixture()
def fake_provider(monkeypatch):
    """Replace the provider's network calls; patch the module attribute so get_provider() returns the fakes."""
    monkeypatch.setattr(example_cloud, "expand_prompt", AsyncMock(side_effect=lambda p: f"expanded: {p}"))
    monkeypatch.setattr(example_cloud, "generate_batch", AsyncMock(return_value=["/a.png", None, "/c.png", "/d.png"]))
    return example_cloud
