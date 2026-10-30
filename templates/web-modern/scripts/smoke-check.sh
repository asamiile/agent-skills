#!/usr/bin/env bash
# Post-deploy smoke check: status codes, redirects, and key content of a deployed site
#
#   ./scripts/smoke-check.sh https://example.com
#
# Edit CHECKS for the site. Each line: <path> <expected status> [expected Location suffix or grep pattern]
#   - 3xx: the third field must match the end of the Location header
#   - 200: the third field, when present, must appear in the body (grep -E)
# Exits 1 if any check fails. Only reads; safe to run against production.
set -uo pipefail

BASE="${1:?Usage: smoke-check.sh <base-url>}"
BASE="${BASE%/}"

CHECKS=$(cat <<'LIST'
/                 308  /en
/en               200  <title>
/robots.txt       200  Sitemap:
/sitemap.xml      200  <urlset
/llms.txt         200  ^#
/no-such-page-xyz 404
LIST
)

fail=0
while read -r path status expect; do
  [ -z "$path" ] && continue
  headers=$(curl -s -o /tmp/smoke-body.$$ -D - --max-time 20 "$BASE$path")
  code=$(printf '%s\n' "$headers" | awk 'toupper($1) ~ /^HTTP/ {c=$2} END {print c}')
  location=$(printf '%s\n' "$headers" | awk 'tolower($1)=="location:" {print $2}' | tr -d '\r' | tail -1)
  result="ok"
  if [ "$code" != "$status" ]; then
    result="status $code, expected $status"
  elif [ -n "${expect:-}" ] && [ "${status:0:1}" = "3" ] && [[ "$location" != *"$expect" ]]; then
    result="redirects to '$location', expected *$expect"
  elif [ -n "${expect:-}" ] && [ "$status" = "200" ] && ! grep -qE -- "$expect" /tmp/smoke-body.$$; then
    result="body does not contain /$expect/"
  fi
  if [ "$result" = "ok" ]; then
    printf '✔ %-24s %s\n' "$path" "$code${location:+ → $location}"
  else
    printf '✖ %-24s %s\n' "$path" "$result"
    fail=1
  fi
done <<< "$CHECKS"
rm -f /tmp/smoke-body.$$
exit $fail
