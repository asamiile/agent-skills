# agent-skills

A Claude Code plugin marketplace of workflows, rules, and lessons learned from visual, motion graphics, and web production work.

See [AGENTS.md](AGENTS.md) for the policy and rules. 

## Installation

### From GitHub

```bash
claude plugin marketplace add asamiile/agent-skills
claude plugin install core@asamiile
claude plugin install visual-webgl@asamiile     # install only what you need
claude plugin install motion-graphics@asamiile
claude plugin install web-modern@asamiile
claude plugin install web-animation@asamiile
claude plugin install gsap@asamiile            # also installs web-animation
claude plugin install wordpress@asamiile       # also installs web-modern
claude plugin install generative-art@asamiile
claude plugin install py5@asamiile             # also installs generative-art
claude plugin install remotion@asamiile        # also installs motion-graphics
claude plugin install mcp-server@asamiile
claude plugin install nextjs@asamiile          # also installs web-modern
claude plugin install cloud-run@asamiile       # also installs web-modern
claude plugin install mobile-app@asamiile
claude plugin install expo@asamiile            # also installs mobile-app
claude plugin install macos@asamiile           # also installs core
claude plugin install ableton-live@asamiile
claude plugin install ai-integration@asamiile
claude plugin install fastapi@asamiile         # also installs web-modern
claude plugin install comfyui@asamiile         # also installs ai-integration
claude plugin install electronics@asamiile
claude plugin install arduino@asamiile         # also installs electronics
```

Inside a session, `/plugin marketplace add asamiile/agent-skills` also adds the marketplace.

### From a local path

```bash
claude plugin marketplace add /path/to/agent-skills
claude plugin install core@asamiile
```

When the marketplace is added from a local path, skills are read directly from that directory. Edits take effect at the next session start, or when you run `/reload-plugins` in a session.

### Inspect and remove

```bash
claude plugin list                            # installed plugins
claude plugin details core                    # skills in a plugin
claude plugin marketplace remove asamiile     # remove the marketplace and its plugins
```

Run a skill with `/<plugin>:<skill>`. Claude may also use a skill on its own when its description matches the task.

## Plugins and skills

| Plugin | Contents | Skills |
| --- | --- | --- |
| `core` | Workflows that apply to any kind of project | `lock-down-confidential-project`, `bounded-agent-loop`, `audit-content-quality`, `proofread-copy`, `auto-fix-from-errors`, `set-up-release-flow`, `distribute-source-template`, `ship-companion-installer`, `watch-platform-updates`, `document-operations`, `sync-bilingual-docs` |
| `visual-webgl` | Workflows for WebGL and Canvas visual production | `canvas-webgl-performance` |
| `motion-graphics` | Tool-agnostic workflows for motion graphics and video production | `verify-render-outputs`, `export-for-mobile`, `offload-renders` |
| `web-modern` | Framework-agnostic workflows for web development | `screen-specs-and-qa`, `verify-production-release`, `publish-content-for-ai`, `change-database-schema`, `track-api-costs`, `harden-local-docker-app` |
| `web-animation` | Workflows for animation on web pages | `animation-fallbacks`, `visual-regression-test`, `capture-animation-frames`, `measure-animation-performance` |
| `gsap` | GSAP-specific techniques (depends on `web-animation`) | `animation-tuning-mock` |
| `wordpress` | Delivering front-end work for a WordPress theme (depends on `web-modern`) | `package-wordpress-embed` |
| `generative-art` | Tool-agnostic workflows for generative art and creative coding | `autonomous-artwork-loop`, `polish-artwork-from-feedback`, `write-artwork-article` |
| `py5` | py5-specific techniques (depends on `generative-art`) | `py5-sketch-setup` |
| `remotion` | Remotion-specific techniques (depends on `motion-graphics`) | `remotion-project-structure`, `remotion-render-pipeline`, `duration-variants` |
| `mcp-server` | Building, cataloging, testing, and publishing MCP servers | `build-knowledge-mcp-server`, `maintain-agent-manifest`, `publish-python-mcp-server` |
| `nextjs` | Next.js-specific techniques (depends on `web-modern`) | `proxy-locale-and-auth`, `ai-facing-content-routes`, `proxy-long-backend-requests` |
| `cloud-run` | Deploying to Google Cloud Run (depends on `web-modern`) | `deploy-to-cloud-run`, `alert-to-discord` |
| `mobile-app` | Tool-agnostic workflows for smartphone apps | `submit-to-app-store`, `set-up-in-app-purchases`, `connect-to-local-devices`, `migrate-local-storage` |
| `expo` | Expo and React Native techniques (depends on `mobile-app`) | `expo-release-pipeline`, `expo-development-builds`, `test-react-native-app` |
| `macos` | macOS signing and notarization (depends on `core`) | `sign-and-notarize-macos` |
| `ableton-live` | Ableton Live Remote Scripts | `build-remote-script` |
| `ai-integration` | Apps that call LLM and image-generation APIs or local models | `pluggable-ai-providers`, `two-step-generation`, `safe-prompt-expansion`, `run-local-ai-stack` |
| `fastapi` | FastAPI-specific techniques (depends on `web-modern`) | `test-fastapi-app`, `protect-fastapi-endpoints` |
| `comfyui` | Driving ComfyUI from code (depends on `ai-integration`) | `drive-comfyui-from-code` |
| `electronics` | Microcontroller, single-board computer, and IoT projects | `organize-hardware-projects`, `manage-device-credentials`, `build-device-data-pipeline` |
| `arduino` | Arduino CLI builds and firmware (depends on `electronics`) | `build-with-arduino-cli` |

Starter code and AGENTS.md templates for these skills are in [templates/](templates/).

Per-tool plugins such as `django` are added as knowledge for those tools is imported. Installing a per-tool plugin also installs its shared plugin (`motion-graphics`, `web-modern`, `web-animation`, `generative-art`, `mobile-app`, `ai-integration`, `electronics`, or `core`).

## Working on this repository

After cloning, enable the confidentiality checks that run before each commit and push.

```bash
git config core.hooksPath .githooks
cp .confidential-terms.example .confidential-terms   # list banned terms (never committed)
```

To import knowledge, open Claude Code in this repository and run `/import-knowledge <path-to-source-repository>`.

Validate after every change.

```bash
claude plugin validate .
claude plugin validate plugins/<plugin>
scripts/check-confidential.sh --all
```

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Support

If you find this helpful, consider supporting the work:

[![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/asamiile)


## Author

[Asami.K](https://asami.tokyo/)