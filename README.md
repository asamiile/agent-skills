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
| `core` | Workflows that apply to any kind of project | `lock-down-confidential-project`, `bounded-agent-loop` |
| `visual-webgl` | Workflows for WebGL and Canvas visual production | `canvas-webgl-performance` |
| `motion-graphics` | Tool-agnostic workflows for motion graphics and video production | `verify-render-outputs`, `export-for-mobile`, `offload-renders` |
| `web-modern` | Framework-agnostic workflows for web development | (none yet; starter code in `templates/web-modern/`) |
| `web-animation` | Workflows for animation on web pages | `animation-fallbacks`, `visual-regression-test`, `capture-animation-frames`, `measure-animation-performance` |
| `gsap` | GSAP-specific techniques (depends on `web-animation`) | `animation-tuning-mock` |
| `wordpress` | Delivering front-end work for a WordPress theme (depends on `web-modern`) | `package-wordpress-embed` |
| `generative-art` | Tool-agnostic workflows for generative art and creative coding | `autonomous-artwork-loop`, `polish-artwork-from-feedback`, `write-artwork-article` |
| `py5` | py5-specific techniques (depends on `generative-art`) | `py5-sketch-setup` |
| `remotion` | Remotion-specific techniques (depends on `motion-graphics`) | `remotion-project-structure`, `remotion-render-pipeline`, `duration-variants` |
| `mcp-server` | Building, cataloging, testing, and publishing MCP servers | `build-knowledge-mcp-server`, `maintain-agent-manifest`, `publish-python-mcp-server` |

Starter code and AGENTS.md templates for these skills are in [templates/](templates/).

Per-tool plugins such as `nextjs` and `django` are added as knowledge for those tools is imported. Installing a per-tool plugin also installs its shared plugin (`motion-graphics`, `web-modern`, `web-animation`, or `generative-art`).

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