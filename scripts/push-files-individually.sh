#!/usr/bin/env bash
#
# Adds, commits, and pushes every changed/untracked file one at a time.
# Usage: ./scripts/push-files-individually.sh [branch]
#   branch defaults to the current checked-out branch.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

BRANCH="${1:-$(git branch --show-current)}"

# --untracked-files=all expands untracked directories into their individual files
# instead of listing the directory as a single entry.
mapfile -t FILES < <(git status --porcelain=v1 --untracked-files=all | cut -c4-)

if [ "${#FILES[@]}" -eq 0 ]; then
  echo "Nothing to commit — working tree is clean."
  exit 0
fi

echo "Found ${#FILES[@]} file(s) to push individually to '${BRANCH}'."

for file in "${FILES[@]}"; do
  # Skip if a previous iteration already committed this path (e.g. it was
  # nested inside a directory git had listed separately before expansion).
  if git diff --quiet -- "$file" 2>/dev/null && git diff --cached --quiet -- "$file" 2>/dev/null && [ -z "$(git status --porcelain -- "$file")" ]; then
    continue
  fi

  echo ""
  echo "==> $file"

  git add -- "$file"
  git commit -m "Add/update $file"
  git push origin "$BRANCH"
done

echo ""
echo "Done. All files committed and pushed individually to '${BRANCH}'."
