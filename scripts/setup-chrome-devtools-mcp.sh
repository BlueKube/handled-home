#!/usr/bin/env bash
# ── chrome-devtools-mcp setup ──────────────────────────────────────
# One-time per-container setup for chrome-devtools-mcp. Verifies
# chromium is reachable, smoke-tests a headless launch, and pre-warms
# the npm package cache so the MCP launches fast at next session start.
#
# When to run:
#   - Fresh Claude Code Web sandbox (the container is ephemeral; the
#     .claude.json registration from a previous container doesn't carry).
#   - After a Playwright chromium version bump (the path moves under
#     /opt/pw-browsers/chromium-<N>/...).
#   - Whenever `mcp__chrome-devtools__*` tools fail to load at session
#     start (run /mcp to confirm they're absent first).
#
# What this DOESN'T do:
#   - Install chromium. The Claude Code Web sandbox ships Playwright's
#     chromium pre-installed at /opt/pw-browsers/chromium-*/. If you're
#     on a different environment, install chromium yourself and either
#     symlink it under /opt or set CHROME_EXECUTABLE_PATH.
#   - Register the MCP. .mcp.json at the repo root handles registration;
#     this script is just verification + warmup.

set -euo pipefail

echo "── chrome-devtools-mcp setup ──"
echo

# 1. Locate chromium. Mirror the priority order in start-chrome-devtools-mcp.sh.
echo "1. Locating chromium..."
CHROME=""
if [ -n "${CHROME_EXECUTABLE_PATH:-}" ] && [ -x "$CHROME_EXECUTABLE_PATH" ]; then
  CHROME="$CHROME_EXECUTABLE_PATH"
  echo "   Using CHROME_EXECUTABLE_PATH: $CHROME"
else
  for cand in \
    /opt/pw-browsers/chromium-*/chrome-linux/chrome \
    /usr/bin/google-chrome \
    /usr/bin/google-chrome-stable \
    /usr/bin/chromium \
    /usr/bin/chromium-browser; do
    if [ -x "$cand" ]; then
      CHROME="$cand"
      echo "   Found: $cand"
      break
    fi
  done
fi

if [ -z "${CHROME:-}" ] || [ ! -x "$CHROME" ]; then
  echo "   ERROR: no chromium binary found."
  echo
  echo "   This script does NOT install chromium. Options:"
  echo "     - On the Claude Code Web sandbox: chromium should be at"
  echo "       /opt/pw-browsers/chromium-*/. If it's missing, file a"
  echo "       sandbox-image issue."
  echo "     - On a developer machine: install Google Chrome or Chromium,"
  echo "       then re-run with CHROME_EXECUTABLE_PATH=/path/to/chrome."
  exit 1
fi

# 2. Print version (sanity check).
echo
echo "2. Chromium version:"
"$CHROME" --version 2>/dev/null | sed 's/^/   /'

# 3. Headless smoke test against example.com. Uses the same flags as
#    start-chrome-devtools-mcp.sh so we test the actual launch path.
echo
echo "3. Headless launch smoke test..."
if timeout 12 "$CHROME" \
    --headless --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --dump-dom https://example.com \
    > /tmp/chrome-smoke.html 2>/dev/null \
   && grep -q "Example Domain" /tmp/chrome-smoke.html; then
  echo "   ✓ Headless launch successful, fetched and rendered example.com"
else
  echo "   ⚠ Smoke test inconclusive — chromium may have launched but"
  echo "     network/cert errors prevented loading the page. The MCP may"
  echo "     still work for local-deploy URLs. Continuing."
fi
rm -f /tmp/chrome-smoke.html

# 4. Pre-warm the npm cache so the first MCP launch isn't slow.
echo
echo "4. Pre-warming chrome-devtools-mcp npm package..."
if timeout 60 npx -y chrome-devtools-mcp@latest --version > /tmp/cdp-mcp-version.txt 2>&1; then
  echo "   ✓ Package fetched. Version: $(cat /tmp/cdp-mcp-version.txt | tail -1)"
else
  echo "   ⚠ Pre-warm timed out or failed. The MCP will still install"
  echo "     on first session-start use, just slower."
fi
rm -f /tmp/cdp-mcp-version.txt

echo
echo "── done ──"
echo
echo "Next steps:"
echo "  - Restart your Claude Code session for mcp__chrome-devtools__* tools to load."
echo "  - Run /mcp inside Claude Code to confirm the chrome-devtools server appears."
echo "  - .mcp.json at repo root handles registration on every session start."
