# Cross-screen scenarios

Flows that span several screens. Each step names the spec ID it relies on.

## XS-01: {flow name}

Preconditions: {account, data}

| Step | Screen (spec ID) | Action | Expected |
| --- | --- | --- | --- |
| 1 | SCR-{A} | {action} | {result} |
| 2 | SCR-{B} | {action} | {result, including what changed because of step 1} |

Cleanup: {how to remove what this scenario created, through the UI or the API}
