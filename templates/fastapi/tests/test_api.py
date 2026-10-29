import pytest


@pytest.mark.parametrize("headers", [{}, {"Authorization": "Bearer wrong"}, {"Authorization": "Basic test-token"}, {"Authorization": "test-token"}])
def test_requests_without_the_token_get_401(client, headers):
    response = client.post("/api/generate", json={"prompt": "a lake"}, headers=headers)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_missing_server_token_fails_closed(client, auth_headers, monkeypatch):
    monkeypatch.setenv("APP_API_TOKEN", "")
    assert client.post("/api/generate", json={"prompt": "x"}, headers=auth_headers).status_code == 500


def test_generate_uses_the_mocked_provider(client, auth_headers, fake_provider):
    response = client.post("/api/generate", json={"prompt": "a lake"}, headers=auth_headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["prompt"] == "expanded: a lake"
    assert [p["status"] for p in body["previews"]] == ["success", "failed", "success", "success"]
    fake_provider.generate_batch.assert_awaited_once_with("expanded: a lake", 4)


@pytest.mark.parametrize("prompt", ["", "x" * 201])
def test_prompt_length_is_validated(client, auth_headers, fake_provider, prompt):
    assert client.post("/api/generate", json={"prompt": prompt}, headers=auth_headers).status_code == 422
    fake_provider.expand_prompt.assert_not_awaited()
