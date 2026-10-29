# Manual

Steps that need a person: judgment calls, consoles without an API, and renewals. Never write secret values here; name the secret and where it is stored.

## {Task, e.g. Merge the release pull request}

When: {trigger}. Who: {role}.

1. {step}
2. {step}

Check: {how to confirm it worked}

## {Renewal, e.g. Release token}

Expires: {date}. Symptom when expired: `{the exact error message the workflow prints}`.

1. Create a new {token type} with {exact permissions}, limited to {repository}
2. Store it: `gh secret set {NAME}`
3. Re-run {workflow} and confirm it passes
4. Update the expiry date in [README.md](README.md)
