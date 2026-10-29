"""Tests for the read-only MCP server: discovery, path safety, and size limits."""

import pytest

from knowledge_server import server


def test_manifest_paths_exist():
    for entry in server.entries():
        assert (server.CONTENT_ROOT / entry["path"]).is_file(), entry["path"]


def test_search_result_can_be_fetched():
    results = server.search(query=server.entries()[0]["title"], limit=1)
    assert results
    fetched = server.get_source(path=results[0]["path"])
    assert fetched["path"] == results[0]["path"]
    assert fetched["content"]


def test_search_without_match_returns_empty_list():
    assert server.search(query="zzzz-no-such-term", category="zzzz") == []


def test_summary_has_no_source():
    path = server.entries()[0]["path"]
    summary = server.get_summary(path=path)
    assert "content" not in summary
    assert summary["path"] == path


@pytest.mark.parametrize("path", ["../pyproject.toml", "/etc/hosts", "", "a/../../server.py"])
def test_rejects_paths_outside_content(path):
    with pytest.raises(server.AccessError):
        server.get_source(path=path)


def test_max_chars_is_clamped_and_reported():
    path = server.entries()[0]["path"]
    result = server.get_source(path=path, max_chars=1)
    assert len(result["content"]) <= 1
    assert result["truncated"] is (len((server.CONTENT_ROOT / path).read_text()) > 1)
    huge = server.get_source(path=path, max_chars=10**9)
    assert len(huge["content"]) <= server.ABSOLUTE_MAX_CHARS


def test_packaged_manifest_matches_source_of_truth():
    """The package ships a copy of the manifest; it must not drift from the edited one."""
    source = server.PACKAGE_DIR.parents[1] / "catalog" / "manifest.json"  # the file people and scripts edit
    if not source.exists():
        pytest.skip("not a repository checkout")
    assert source.read_text(encoding="utf-8") == server.MANIFEST_PATH.read_text(encoding="utf-8")
