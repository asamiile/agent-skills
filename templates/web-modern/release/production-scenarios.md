# Production check: {feature}

Run after deploying a change to {feature}. Covers the whole path: {form → API → admin screen → email → notification}.

**Cost and limits**: {which steps call paid APIs, send real email, or count against rate limits}. Steps marked *(on change only)* run only when the logic they test changed.

## Preconditions

- Frontend: {URL} · Backend: {URL} · Admin: {URL}
- Access to: {admin account, notification channel, test inbox}

## Steps

| No. | Action | Expected |
| --- | --- | --- |
| 1 | {submit the public form with test data} | {completion message} |
| 2 | {check the notification channel} | {notification arrives; no "[dev]" or staging prefix in production} |
| 3 | {open the admin list} | {the item appears with the initial status} |
| 4 | {open the item} | {status changes as specified} |
| 5 | {trigger the paid or external action} | {result is correct; language matches the input} |
| 6 | {check the real side effect, e.g. the test inbox} | {email arrived} |
| 7 *(on change only)* | {disable the notification webhook and repeat step 1} | {submission still succeeds; a failed notification never blocks the main action} |
| 8 *(on change only)* | {exceed the rate limit from one client} | {requests above the limit get 429} |

## Known pitfalls

- {Errors swallowed on purpose (for example notifications) leave no log; check the receiving side first}

## Cleanup

- {Delete or archive the test item through the admin screen}
