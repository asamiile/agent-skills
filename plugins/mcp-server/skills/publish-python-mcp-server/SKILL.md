---
name: publish-python-mcp-server
description: Publishes a Python MCP server (or any small Python package) to PyPI so users can run it with uvx - CI with lint, manifest check, and tests across Python versions, versioning and changelog with release-please, building with uv, and uploading through PyPI Trusted Publishing without stored tokens, plus Dependabot for actions and a check of the installed package. Use when the user says things like "publish this MCP server", "release to PyPI", "make it installable with uvx", "set up releases", or "automate versioning and the changelog".
---

# Publish a Python MCP server to PyPI

Starter files, in this repository: `templates/mcp-server/pyproject.toml`, `.github/workflows/test.yml`, `.github/workflows/release.yml`, `.github/dependabot.yml`.

Publishing is public and hard to undo (a version number can never be reused on PyPI). Confirm the package name, the license, and that the content may be redistributed before the first release.

## 1. Package metadata

- `name` (the PyPI name; check it is free), `description`, `readme`, `license`, `requires-python`, `authors`, `[project.urls]`
- `[project.scripts]` gives the command MCP clients run
- Non-Python data is included explicitly, and a smoke test of the installed wheel passes (see `mcp-server:build-knowledge-mcp-server`)

## 2. CI on every push and pull request

`test.yml`: install with `uv sync --group dev`, run the linter, the manifest check (`mcp-server:maintain-agent-manifest`), and the tests on each supported Python version. Make it required before merging.

## 3. Versions and changelog: release-please

- Write commit messages as Conventional Commits (`feat:`, `fix:`, `feat!:` for breaking changes). release-please reads them
- On each push to `main` it opens or updates a release pull request with the next version and the changelog. Merging that pull request creates the tag and the GitHub release
- With `release-type: python` it updates the version in `pyproject.toml`. If the version also appears elsewhere (a `__version__`), configure it as an extra file or read the version from package metadata instead

## 4. Upload: Trusted Publishing

1. On PyPI, add a trusted publisher for the project: owner, repository, workflow file name (`release.yml`), and environment name (`pypi`). For a brand-new project, use a "pending" publisher
2. In GitHub, create the `pypi` environment and add required reviewers if releases should be approved
3. The publish job has `permissions: id-token: write`, runs only when release-please created a release, builds with `uv build`, and uploads with `pypa/gh-action-pypi-publish`. No API token is stored anywhere

## 5. Keep it maintained

- Dependabot for `github-actions` (monthly) keeps action versions current
- Pin the MCP SDK below its next major, and raise the bound deliberately after testing
- After each release, run `uvx --from {package-name} {command}` once from a clean machine or container

## 6. Before the first release

- [ ] Package name available on PyPI, and the README's install section uses it
- [ ] Wheel contains the data files; installed smoke test passes
- [ ] Trusted publisher and environment configured
- [ ] The user has approved making it public
