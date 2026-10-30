# Writing tool and parameter descriptions

The model sees only names, descriptions, and schemas. Everything it needs to call a tool well has to be there.

## Parameters

With FastMCP, put the description on the parameter with `Annotated[type, Field(description=...)]`. It ends up in the JSON schema the client sends to the model.

For each parameter, state:

- What it matches or controls, with one realistic example value
- The accepted range and the default (`1-50. Default 5.`)
- What happens at the edges (values are clamped; absolute paths are rejected)
- Where valid values come from (`Use search results`, `See the manifest-summary resource for categories`)

## Tools

The docstring becomes the tool description. Cover:

- One line on what the tool is for
- What it returns, field by field when the shape is not obvious
- What it never does (`never returns file contents`, `read-only`)
- What an empty result means (`An empty list means nothing matched; it is not an error`). Without this, agents retry with ever wider queries
- The next tool to call, so the intended order is visible from any single tool

## Errors

- Refusals (bad path, unknown category) raise an exception with a message that says what is allowed. FastMCP returns it as an error result the agent can read and correct
- For an unknown choice in an enumerated field (a mood, a profile), return the list of valid values in the error, so the next call can succeed

## Names

Short verbs on the domain noun (`search`, `get_summary`, `get_source`). Avoid near-duplicates: two tools that both "get" an entry with slightly different output invite the wrong choice. If two exist, each description says when to use the other one instead.
