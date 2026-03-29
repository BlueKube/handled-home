#!/bin/bash
# Runs after every Claude response. Catches common workflow violations.

WARNINGS=0

# 1. Check for client-side API keys (security)
KEY_COUNT=$(grep -r "VITE_.*API_KEY\|VITE_.*SECRET\|VITE_.*TOKEN" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".env" | wc -l)
if [ "$KEY_COUNT" -gt 0 ]; then
  echo "🚨 SECURITY: Found $KEY_COUNT client-side API key/secret/token references in src/"
  WARNINGS=$((WARNINGS + 1))
fi

# 2. Check for stale batch specs (cleanup)
SPEC_COUNT=$(ls docs/working/batch-specs/*.md 2>/dev/null | wc -l)
PLAN_STATUS=$(grep -c "⬜\|🟡" docs/working/plan.md 2>/dev/null || echo "0")
if [ "$SPEC_COUNT" -gt 0 ] && [ "$PLAN_STATUS" -eq 0 ]; then
  echo "⚠️  CLEANUP: $SPEC_COUNT batch specs in docs/working/batch-specs/ but no incomplete batches — archive them"
  WARNINGS=$((WARNINGS + 1))
fi

# 3. Check for oversized components (architecture)
for f in src/pages/*.tsx src/components/*.tsx; do
  [ -f "$f" ] || continue
  LINES=$(wc -l < "$f")
  if [ "$LINES" -gt 500 ]; then
    BASENAME=$(basename "$f")
    echo "⚠️  DECOMPOSE: $BASENAME is $LINES lines (target: under 300)"
    WARNINGS=$((WARNINGS + 1))
  fi
done

# 4. Check for uncommitted changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  UNCOMMITTED=$(git status --porcelain | wc -l)
  echo "⚠️  GIT: $UNCOMMITTED uncommitted file(s) — commit and push before ending session"
  WARNINGS=$((WARNINGS + 1))
fi

if [ "$WARNINGS" -gt 0 ]; then
  echo "---"
  echo "Found $WARNINGS warning(s). Address before proceeding."
fi
