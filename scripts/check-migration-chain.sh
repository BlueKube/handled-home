#!/usr/bin/env bash
# Batch DX.1 — validates that any new migration files in supabase/migrations/
# include a `-- Previous migration: <filename>` header pointing at an existing
# file. Catches the orphan-migration trap documented in lessons-learned.md
# (Round 64 Phase 4 PR #7) before push: the Supabase↔GitHub integration
# blocks the entire PR's preview when ANY migration in the diff has no
# declared parent.
#
# Usage:
#   bash scripts/check-migration-chain.sh         # default: only files staged + unstaged + untracked
#   bash scripts/check-migration-chain.sh --all   # check every migration (audit; expect old files to fail)
#
# Exit codes:
#   0 — all checked migrations have a valid Previous migration: header
#   1 — one or more violations found (see stderr)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MIGRATIONS_DIR="supabase/migrations"
MODE="uncommitted"
if [ "${1:-}" = "--all" ]; then
  MODE="all"
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "❌ $MIGRATIONS_DIR does not exist; nothing to check."
  exit 0
fi

# Build the file list.
if [ "$MODE" = "uncommitted" ]; then
  # Newly added or modified .sql files in supabase/migrations/, untracked + tracked-with-changes.
  mapfile -t FILES < <(
    {
      git diff --cached --name-only -- "$MIGRATIONS_DIR/*.sql"
      git diff --name-only -- "$MIGRATIONS_DIR/*.sql"
      git ls-files --others --exclude-standard -- "$MIGRATIONS_DIR/*.sql"
    } | sort -u
  )
else
  mapfile -t FILES < <(find "$MIGRATIONS_DIR" -maxdepth 1 -name '*.sql' -type f | sort)
fi

if [ "${#FILES[@]}" = 0 ]; then
  echo "No migrations to check (mode: $MODE)."
  exit 0
fi

VIOLATIONS=0
for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue

  # First line must match `-- Previous migration: <filename>`
  first_line="$(head -n 1 "$f")"
  if ! [[ "$first_line" =~ ^--[[:space:]]+Previous[[:space:]]+migration:[[:space:]]+(.+)$ ]]; then
    echo "❌ $f"
    echo "   First line is not a 'Previous migration:' header."
    echo "   Got: $first_line"
    VIOLATIONS=$((VIOLATIONS + 1))
    continue
  fi

  prev_file="${BASH_REMATCH[1]}"
  prev_path="$MIGRATIONS_DIR/$prev_file"

  # The pointed-at file must exist (either on disk or, in the uncommitted
  # case, also as a sibling staged file).
  if [ ! -f "$prev_path" ]; then
    echo "❌ $f"
    echo "   Header points at $prev_file, but $prev_path does not exist."
    VIOLATIONS=$((VIOLATIONS + 1))
    continue
  fi

  # The pointed-at file must be older than the current one (chronological
  # ordering by filename prefix). Migrations follow YYYYMMDDHHMMSS_*.sql.
  current_ts="$(basename "$f" | cut -d_ -f1)"
  prev_ts="$(basename "$prev_file" | cut -d_ -f1)"
  if [ "$prev_ts" \> "$current_ts" ] || [ "$prev_ts" = "$current_ts" ]; then
    echo "❌ $f"
    echo "   Header points at $prev_file (timestamp $prev_ts) which is not older than $current_ts."
    VIOLATIONS=$((VIOLATIONS + 1))
    continue
  fi
done

if [ "$VIOLATIONS" = 0 ]; then
  echo "✅ ${#FILES[@]} migration(s) checked, all chains valid."
  exit 0
fi

echo
echo "$VIOLATIONS violation(s). Each new migration must start with a comment of the form:"
echo "  -- Previous migration: <filename-of-most-recent-migration-on-main>.sql"
echo "See lessons-learned.md → 'Migrations must declare \`-- Previous migration: …\`'."
exit 1
