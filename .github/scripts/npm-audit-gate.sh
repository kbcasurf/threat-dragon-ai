#!/usr/bin/env bash
# Runs `npm audit` in the current working directory and fails only on
# high/critical advisories that are not listed in .github/workflows/.npm-audit-ignore.txt.
# Run from a package directory (e.g. td.server or td.vue) that has a package-lock.json.
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
ignore_file="$repo_root/.github/workflows/.npm-audit-ignore.txt"

npm audit --omit=dev --json > audit.json || true

mapfile -t ignored < <(grep -vE '^\s*#|^\s*$' "$ignore_file")

mapfile -t findings < <(
  jq -r '
    .vulnerabilities // {}
    | to_entries[]
    | select(.value.severity == "high" or .value.severity == "critical")
    | .value.via[]
    | select(type == "object")
    | .url
  ' audit.json | sort -u
)

remaining=()
for finding in "${findings[@]}"; do
  skip=false
  for entry in "${ignored[@]}"; do
    if [ "$finding" = "$entry" ]; then
      skip=true
      break
    fi
  done
  if [ "$skip" = false ]; then
    remaining+=("$finding")
  fi
done

rm -f audit.json

if [ "${#remaining[@]}" -gt 0 ]; then
  echo "Unignored high/critical npm advisories found:"
  printf '  %s\n' "${remaining[@]}"
  echo ""
  echo "If these are known/accepted, add them to $ignore_file with a comment explaining why."
  exit 1
fi

echo "No unignored high/critical npm advisories."
