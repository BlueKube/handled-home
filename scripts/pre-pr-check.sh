#!/usr/bin/env bash
# Batch DX.1 — runs Tier 1 + 2 gates in parallel and reports a concise summary.
#
# Replaces the manual `tsc + build + vitest` invocation that recurs every
# PR. Outputs a per-gate ✅/❌ table on stdout and exits non-zero if any
# gate fails so a wrapping `/pre-pr` slash command can short-circuit the
# PR open if anything is red.
#
# Usage:
#   bash scripts/pre-pr-check.sh
#
# Env:
#   PRE_PR_SKIP_BUILD=1   Skip `npm run build` (for TS-only / docs-only PRs).
#                          Documented per CLAUDE.md §13: "npm run build is
#                          redundant on schema-only / TS-only batches."
#   PRE_PR_SKIP_VITEST=1  Skip `vitest` (only set this if no test files
#                          touched).

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SKIP_BUILD="${PRE_PR_SKIP_BUILD:-0}"
SKIP_VITEST="${PRE_PR_SKIP_VITEST:-0}"

LOG_DIR="$(mktemp -d)"
trap 'rm -rf "$LOG_DIR"' EXIT

run_gate() {
  local name="$1"
  local cmd="$2"
  local logfile="$LOG_DIR/${name}.log"
  if eval "$cmd" >"$logfile" 2>&1; then
    echo "OK"
  else
    echo "FAIL"
  fi
}

echo "Running pre-PR gates from $REPO_ROOT…"
echo

# Run gates in the background and collect results.
( run_gate "tsc"    "npx tsc --noEmit" )    > "$LOG_DIR/tsc.result"    &
TSC_PID=$!

if [ "$SKIP_BUILD" != "1" ]; then
  ( run_gate "build" "npm run build" )      > "$LOG_DIR/build.result"  &
  BUILD_PID=$!
else
  echo "skip" > "$LOG_DIR/build.result"
  BUILD_PID=""
fi

if [ "$SKIP_VITEST" != "1" ]; then
  ( run_gate "vitest" "npx vitest run" )    > "$LOG_DIR/vitest.result" &
  VITEST_PID=$!
else
  echo "skip" > "$LOG_DIR/vitest.result"
  VITEST_PID=""
fi

# Wait for each that we started.
wait "$TSC_PID"
[ -n "$BUILD_PID" ]  && wait "$BUILD_PID"
[ -n "$VITEST_PID" ] && wait "$VITEST_PID"

TSC_RES="$(cat "$LOG_DIR/tsc.result")"
BUILD_RES="$(cat "$LOG_DIR/build.result")"
VITEST_RES="$(cat "$LOG_DIR/vitest.result")"

emoji_for() {
  case "$1" in
    OK)   echo "✅" ;;
    FAIL) echo "❌" ;;
    skip) echo "⏭️ " ;;
    *)    echo "?" ;;
  esac
}

printf "%-12s %s\n" "tsc"    "$(emoji_for "$TSC_RES") $TSC_RES"
printf "%-12s %s\n" "build"  "$(emoji_for "$BUILD_RES") $BUILD_RES"
printf "%-12s %s\n" "vitest" "$(emoji_for "$VITEST_RES") $VITEST_RES"
echo

ANY_FAIL=0
for r in "$TSC_RES" "$BUILD_RES" "$VITEST_RES"; do
  [ "$r" = "FAIL" ] && ANY_FAIL=1
done

if [ "$ANY_FAIL" = "1" ]; then
  echo "One or more gates failed. Log tails:"
  for name in tsc build vitest; do
    res="$(cat "$LOG_DIR/${name}.result")"
    if [ "$res" = "FAIL" ]; then
      echo
      echo "── ${name} (last 40 lines) ──"
      tail -40 "$LOG_DIR/${name}.log"
    fi
  done
  exit 1
fi

echo "All gates passed."
exit 0
