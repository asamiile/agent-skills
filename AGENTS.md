# agent-skills

A collection of workflows, rules, and lessons learned from past production work, packaged as Claude Code plugins and skills for reuse in future projects. Published publicly on GitHub.
Knowledge is imported one repository at a time. The import workflow lives in `.claude/skills/import-knowledge/SKILL.md`.

## Language

- Write everything in this repository in English: documentation, skills, manifests, templates, script messages, comments, and commit messages
- Talking with the user in another language is fine; only what gets committed must be English

## Policy

### Structure

- The repository is a plugin marketplace named `asamiile` (`.claude-plugin/marketplace.json`)
- Plugins are split by kind of work, and tool-specific knowledge goes into per-tool plugins. One skill is one workflow
- Plugin names have no prefix (`core`, `remotion`, and so on)

| Plugin | Contents |
| --- | --- |
| `core` | Workflows that apply to any kind of project |
| `visual-webgl` | Workflows for WebGL and Canvas visual production |
| `motion-graphics` | Tool-agnostic workflows for motion graphics and video production |
| `web-modern` | Framework-agnostic workflows for web development |
| `web-animation` | Workflows for animation on web pages (fallbacks, visual tests, frame capture, performance) |
| `generative-art` | Tool-agnostic workflows for generative art and creative coding |
| `mcp-server` | Workflows for building, cataloging, testing, and publishing MCP servers |

Per-tool plugins that exist:

| Plugin | Shared plugin |
| --- | --- |
| `gsap` | `web-animation` |
| `wordpress` | `web-modern` |
| `py5` | `generative-art` |
| `remotion` | `motion-graphics` |
| `nextjs` | `web-modern` |
| `cloud-run` | `web-modern` |

Create a per-tool plugin only when an imported repository yields knowledge for that tool. Do not create empty plugins. Planned per-tool plugins:

| Plugin | Shared plugin |
| --- | --- |
| Other video tools (for example `after-effects`) | `motion-graphics` |
| `nuxt` (frontend) | `web-modern` |
| `django`, a TypeScript backend (name decided when it is created) | `web-modern` |

- A per-tool plugin lists its shared plugin in the `dependencies` field of its `plugin.json`, so both are installed together
- Do not create plugins named after a combination of tools (such as `nextjs-django`). A project installs one plugin per tool it uses

```text
.claude-plugin/marketplace.json   Marketplace definition
plugins/<plugin>/
  .claude-plugin/plugin.json      Plugin definition
  skills/<skill>/SKILL.md         Workflow
  skills/<skill>/references/      Lessons learned and the reasoning behind decisions
templates/<plugin>/               AGENTS.md templates and starter code
```

### Where things go

- When unsure, ask: "Would this help in a repository of a different kind?" Start in the plugin for the kind of work, and move it to `core` once a second kind of work needs it
- Tool-agnostic workflows go in the shared plugin for the kind of work (`motion-graphics`, `web-modern`, and so on). Workflows and techniques that only apply to one tool go in that tool's plugin (`remotion`, `nextjs`, and so on)
- When the workflow is shared and only the tool differs, put the workflow in a skill of the shared plugin and the tool-specific technique in the tool's plugin
- By type:

| Type | Location |
| --- | --- |
| Workflow | A skill (`SKILL.md`) |
| Rules and structure to always follow | An AGENTS.md template in `templates/` |
| Starter code | `templates/` |
| Lessons learned and the reasoning behind decisions | The skill's `references/` |

### Writing skills

- Follow the latest official documentation. Do not guess
- A skill's `description` says what the skill does and when to use it, with the main use case first. Include phrases a user would actually say. (`description` and `when_to_use` together are truncated at 1,536 characters)
- Keep `SKILL.md` under 500 lines. Move details into `references/` and link them from the body
- After a change, run `claude plugin validate .` and `claude plugin validate plugins/<plugin>`

## Rules

- The repository is public. Treat everything committed as readable by anyone
- Ask the user before pushing
- Do not bring in project-specific information. Replace client names (in any script, including katakana and romaji), provided assets, design values, and project-specific class names with placeholders such as `{prefix}`
- Extract only generalized knowledge from source repositories. Never copy files as-is
- Do not record which repository knowledge came from, anywhere in this repository (files, commit messages, or comments). Even an anonymized log reveals when imports happened and what kinds of projects they came from
- Ask the user before adding an external library and before committing
- When something is unclear, ask the user instead of guessing
- The license is MIT (`LICENSE`). This is another reason never to include code from source repositories as-is

### Confidentiality checks

These mechanisms keep project-specific information out of the repository:

- `.confidential-terms`: a list of banned terms from the source repositories (client names, project names, prefixes, and so on). Listed in `.gitignore` and never committed. The template is `.confidential-terms.example`
- `scripts/check-confidential.sh`: checks for banned terms, email addresses, and absolute paths that contain a user name. `--all` checks every tracked file
- `.githooks/pre-commit`: checks the staged changes on every commit
- `.githooks/pre-push`: checks every tracked file on every push
- After cloning, run `git config core.hooksPath .githooks` to enable the hooks
- Do not bypass a finding with `--no-verify`. Replace the text, or ask the user
- Update `.confidential-terms` before reading a source repository (see the `import-knowledge` skill)
- Anything pushed stays in the commit history even after the file is deleted. If confidential information has been pushed, stop and tell the user
