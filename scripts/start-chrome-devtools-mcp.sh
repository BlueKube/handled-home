#!/usr/bin/env bash
# ── chrome-devtools-mcp launcher ───────────────────────────────────
# Wrapper called by .mcp.json. Locates the chromium binary at runtime
# (so Playwright bumps don't break things) and execs chrome-devtools-mcp
# with the sandbox-specific flags.
#
# Why this is a wrapper, not inline args in .mcp.json:
#   - The chromium path on the Claude Code Web cloud sandbox includes a
#     version-pinned directory (chromium-1194 today; will rev to 1195+
#     when Playwright bumps). Hardcoding the path makes .mcp.json fragile.
#   - Different machines (developer laptop, future cloud env) may have
#     chromium at different paths. The probe finds it without an env var
#     dance.
#   - Some flags are sandbox-specific (--no-sandbox, --acceptInsecureCerts).
#     Keeping them in a script lets us update them in one place.
#
# Per-environment override:
#   Set CHROME_EXECUTABLE_PATH to point at a specific chromium binary;
#   that takes precedence over the probe.

set -euo pipefail

# Locate chromium. Priority order: explicit env var, sandbox path, system.
CHROME=""
if [ -n "${CHROME_EXECUTABLE_PATH:-}" ] && [ -x "$CHROME_EXECUTABLE_PATH" ]; then
  CHROME="$CHROME_EXECUTABLE_PATH"
else
  for cand in \
    /opt/pw-browsers/chromium-*/chrome-linux/chrome \
    /usr/bin/google-chrome \
    /usr/bin/google-chrome-stable \
    /usr/bin/chromium \
    /usr/bin/chromium-browser \
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    /Applications/Chromium.app/Contents/MacOS/Chromium; do
    if [ -x "$cand" ]; then
      CHROME="$cand"
      break
    fi
  done
fi

if [ -z "${CHROME:-}" ] || [ ! -x "$CHROME" ]; then
  echo "ERROR: no chromium binary found." >&2
  echo "  Run: bash scripts/setup-chrome-devtools-mcp.sh" >&2
  echo "  Or set CHROME_EXECUTABLE_PATH=/path/to/chrome." >&2
  exit 1
fi

# Sandbox-specific flags. See CLAUDE.md §12 "Chrome DevTools MCP" for
# why each one is required.
exec npx -y chrome-devtools-mcp@latest \
  --executablePath "$CHROME" \
  --headless \
  --isolated \
  --acceptInsecureCerts \
  --chromeArg=--no-sandbox \
  --chromeArg=--disable-dev-shm-usage \
  --no-usage-statistics \
  --no-performance-crux \
  "$@"
