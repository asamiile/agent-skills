# agent-skills

`asamiile`, a Claude Code plugin marketplace of workflows, rules, and lessons learned from visual, motion graphics, and web production work.

See [AGENTS.md](AGENTS.md) for the policy and rules. 

## Installation

### From GitHub

```bash
claude plugin marketplace add asamiile/agent-skills
claude plugin install core@asamiile
claude plugin install visual-webgl@asamiile     # install only what you need
claude plugin install motion-graphics@asamiile
claude plugin install web-modern@asamiile
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
| `core` | Workflows that apply to any kind of project | (none yet) |
| `visual-webgl` | Workflows for WebGL and Canvas visual production | (none yet) |
| `motion-graphics` | Tool-agnostic workflows for motion graphics and video production | (none yet) |
| `web-modern` | Framework-agnostic workflows for web development | (none yet) |

Per-tool plugins such as `remotion`, `nextjs`, and `django` are added as knowledge for those tools is imported. Installing a per-tool plugin also installs its shared plugin (`motion-graphics` or `web-modern`).

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