#!/usr/bin/env bash
# Checks for project-specific information.
#   scripts/check-confidential.sh          check staged changes (called from pre-commit)
#   scripts/check-confidential.sh --all    check every tracked file (called from pre-push)
#
# What it checks
#   1. Terms listed in .confidential-terms (client names, project names, and so on; case-insensitive)
#   2. Email addresses
#   3. Absolute paths that contain a user name (/Users/xxx, /home/xxx, C:\Users\xxx)
# Exits with status 1 when anything is found.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

terms_file=".confidential-terms"
mode="staged"
[[ "${1:-}" == "--all" ]] && mode="all"

# Files excluded from the check (this mechanism's own script and template)
exclude=(
  ':!scripts/check-confidential.sh'
  ':!.confidential-terms.example'
)

if [[ "$mode" == "staged" ]]; then
  files=$(git diff --cached --name-only --diff-filter=ACMR -- . "${exclude[@]}")
else
  files=$(git ls-files -- . "${exclude[@]}")
fi
[[ -z "$files" ]] && exit 0

found=0

# Greps the files being checked. In staged mode, reads the content in the index.
scan() { # $1: grep options, $2: pattern, $3: heading
  local hits
  if [[ "$mode" == "staged" ]]; then
    hits=$(git grep --cached -n -I $1 -e "$2" -- $files || true)
  else
    hits=$(git grep -n -I $1 -e "$2" -- $files || true)
  fi
  if [[ -n "$hits" ]]; then
    echo "✖ $3"
    echo "$hits" | sed 's/^/    /'
    found=1
  fi
}

if [[ -f "$terms_file" ]]; then
  while IFS= read -r term || [[ -n "$term" ]]; do
    term="${term%%#*}"                       # strip comments
    term="$(echo "$term" | xargs)"           # trim whitespace
    [[ -z "$term" ]] && continue
    scan "-i -F" "$term" "Contains banned term \"${term}\""
  done < "$terms_file"
else
  echo "⚠ $terms_file not found. Copy .confidential-terms.example and list the source repositories' proper names in it." >&2
fi

scan "-E" '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' "Contains an email address"
scan "-E" '(/Users/|/home/|[A-Za-z]:\\Users\\)[A-Za-z0-9._-]+' "Contains an absolute path with a user name"

if [[ "$found" -ne 0 ]]; then
  echo
  echo "Replace project-specific information with placeholders such as {prefix}. If this is a false positive, ask the user before working around it."
  exit 1
fi
