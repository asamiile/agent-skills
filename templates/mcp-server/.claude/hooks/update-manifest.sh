#!/bin/bash
# PostToolUse hook (Write|Edit): when a content file is written, append a draft manifest entry
# and tell Claude to refine it. The tool input arrives as JSON on stdin; the path is tool_input.file_path
set -euo pipefail
file=$(python3 -c 'import json, sys; print(json.load(sys.stdin).get("tool_input", {}).get("file_path", ""))')
case "$file" in
  */src/knowledge_server/content/*.py) ;;
  *) exit 0 ;;
esac
[ "$(basename "$file")" = "__init__.py" ] && exit 0
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
before=$(grep -c '"draft": true' catalog/manifest.json 2>/dev/null || true)
python3 scripts/update_manifest.py --write >/dev/null || true
after=$(grep -c '"draft": true' catalog/manifest.json 2>/dev/null || true)
if [ "${after:-0}" -gt "${before:-0}" ]; then
  # additionalContext reaches Claude on its next request
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"A draft manifest entry was added for %s. Refine its title, concepts, use, good_for, and complexity in catalog/manifest.json, remove \\"draft\\", then run python3 scripts/update_manifest.py --write."}}\n' "${file##*/}"
fi
