---
name: import-knowledge
description: Reads workflows, rules, and lessons learned from a given repository, strips project-specific information, generalizes them, and adds them to this skill collection. Use when the user points to a source repository path or URL and says things like "import from this repository", "turn what we learned in X into skills", or "add this project's know-how".
argument-hint: "[path-to-source-repository]"
---

# Import knowledge from a repository

Source: $ARGUMENTS

Follow the policy and rules in AGENTS.md. This repository is public, so treat everything you write as readable by anyone. Write everything in English. At the end of each step, check with the user and do not continue until they confirm.

## 1. Prepare the banned-term list

Before reading the source, register its project-specific names in `.confidential-terms`.

1. If `.confidential-terms` does not exist, copy it from `.confidential-terms.example`
2. Collect candidate names from the source's README, package.json, config files, git remote URL, directory names, and CSS class prefixes
3. Show the candidates to the user, let them add or remove entries, then write them to `.confidential-terms`
   - Client names (in any script, plus abbreviations and domains), project names, service names, organization names, repository names, project-specific prefixes
4. Never copy the contents of `.confidential-terms` anywhere outside this conversation

## 2. Read the source and list candidates

Only read the source; never modify it. Look for:

- Workflows that can be repeated
- Rules and directory structures that are always enforced
- Code that can be reused as a starting point
- Lessons learned from failures and the reasoning behind decisions

Present each candidate to the user in this table.

| Candidate | Type | Location | Plugin |
| --- | --- | --- | --- |
| (what the knowledge is) | Workflow / rule / starter code / lesson | Pick from the table below | Plugin name (shared or per-tool) |

| Type | Location |
| --- | --- |
| Workflow | `plugins/<plugin>/skills/<skill>/SKILL.md` (one skill is one workflow) |
| Rules and structure to always follow | `templates/<plugin>/AGENTS.md` |
| Starter code | `templates/<plugin>/` |
| Lessons learned and the reasoning behind decisions | The skill's `references/` |

Choose the plugin in this order:

1. If it only applies to one tool (Remotion, Next.js, Django, and so on), put it in that tool's plugin. If the plugin does not exist yet, ask the user before creating it. List its shared plugin (`motion-graphics`, `web-modern`, and so on) under `dependencies` in its `plugin.json`, and add it to `marketplace.json` and the README list
2. If it is tool-agnostic, put it in the plugin for the kind of work. Ask "Would this help in a repository of a different kind?" Start in the plugin for the kind of work, and move it to `core` once a second kind of work needs it
3. If the workflow is shared and only the tool differs, put the workflow in a skill of the shared plugin and the tool-specific technique in the tool's plugin

## 3. Generalize and write

Do not copy files; write the knowledge from scratch. Leave out the following, and replace anything that must remain with placeholders such as `{prefix}`, `{project}`, or `{brand-color}`:

- Client, project, and service names (in any script)
- Provided assets (images, copy, fonts, logos) and their file names
- Design values (concrete colors, spacing, sizes, breakpoints, easing values)
- Project-specific class names, IDs, CSS variables, environment variables, URLs, and API endpoints
- Personal names, email addresses, and local absolute paths

When a value drives a decision, write how to decide it instead of the value itself (for example, "convert from the design's base width to vw").

Follow the official SKILL.md specification when writing skills:

- The `description` says what the skill does and when to use it, with the main use case first. Include phrases a user would actually say
- Keep the body under 500 lines. Move details into `references/` and link them from the body

## 4. Check

1. Run `scripts/check-confidential.sh --all` and confirm it finds nothing
2. Reread every added or changed file for project-specific information the script cannot catch (paraphrased project names, distinctive values, descriptions of assets)
3. Confirm that `claude plugin validate .` and `claude plugin validate plugins/<plugin>` pass for each changed plugin

## 5. Update the list and ask before committing

1. Update the skill list in the README
2. Show the user a summary of the diff and ask whether to commit. Do not record where the knowledge came from, in files or in the commit message
3. Do not push (if a push is wanted, ask the user first)
