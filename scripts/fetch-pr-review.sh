#!/usr/bin/env bash
# Fetch all review data for a GitHub PR.
# Usage: ./scripts/fetch-pr-review.sh <PR_NUMBER>

set -euo pipefail

PR="${1:?Usage: $0 <PR_NUMBER>}"
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || git remote get-url origin | sed 's|.*github.com[:/]||;s|\.git$||')"

echo "==========================================="
echo " PR #${PR} — ${REPO}"
echo "==========================================="

echo ""
echo "--- PR Details ---"
gh pr view "$PR" --json title,state,author,baseRefName,headRefName,body \
  --template '{{.title}} ({{.state}})
Author: {{.author.login}}
Base:   {{.baseRefName}} ← {{.headRefName}}
{{if .body}}
Body:
{{.body}}{{end}}
'

echo ""
echo "--- Review Verdicts ---"
gh api "repos/${REPO}/pulls/${PR}/reviews" \
  --jq '.[] | "[\(.state)] \(.user.login): \(.body // "(no comment)")"' 2>/dev/null \
  || echo "(no reviews)"

echo ""
echo "--- Inline Code Comments ---"
gh api "repos/${REPO}/pulls/${PR}/comments" \
  --jq '.[] | "[\(.path):\(.line // .original_line // "?")] \(.user.login):\n  \(.body)\n"' 2>/dev/null \
  || echo "(no inline comments)"

echo ""
echo "--- Conversation Comments ---"
gh pr view "$PR" --comments --json comments \
  --template '{{range .comments}}[{{.author.login}}] {{timeago .createdAt}}:
  {{.body}}
{{end}}' 2>/dev/null \
  || echo "(no conversation comments)"
