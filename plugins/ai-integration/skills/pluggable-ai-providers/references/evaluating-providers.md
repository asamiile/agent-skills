# Evaluating providers

Keep one table in the project's docs, including the providers you rejected, so nobody re-evaluates them from zero.

| Provider | Status | Cost per cycle | Strengths | Limits | Notes (date checked) |
| --- | --- | --- | --- | --- | --- |
| {name} | Implemented / Planned / Rejected | {approx.} | {quality, speed, resolution, instruction following} | {resolutions, rate limits, content policy} | {why chosen or rejected} |

Check before choosing:

- **Access**: is the API available on the plan the project can pay for? Some consumer subscriptions do not include API access, and some APIs require an enterprise agreement with a monthly minimum
- **Output**: maximum resolution and aspect ratios, formats, whether reference images are accepted
- **Behavior**: how well it follows style rules (some models drift to illustration unless strongly constrained), refusal behavior
- **Text capability**: whether it can also do prompt expansion, or needs another provider for that
- **Operations**: rate limits, regions, data retention and training on inputs, SDK maturity
- **Local option**: hardware needed for acceptable latency (measure; see `ai-integration:run-local-ai-stack`)
