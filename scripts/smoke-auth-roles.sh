#!/usr/bin/env bash
# API-level auth + role smoke for the three bkennington+ test users.
#
# Unlike scripts/smoke-auth.mjs (which needs a browser and a network path
# to handledhome.app), this one talks to the Supabase domain directly —
# gwbwnetatpgnqgarkvht.supabase.co — which is allowlisted in restricted
# sandboxes. Proves each user can sign in + has the expected role in
# public.user_roles.
#
# Usage (from repo root):
#   CUSTOMER_PASSWORD=... PROVIDER_PASSWORD=... ADMIN_PASSWORD=... \
#     bash scripts/smoke-auth-roles.sh
#
# Emails + anon key are baked in (publishable, not secret).

set -u
PUB_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-sb_publishable_5fziyk9a4b_Ml7J6bPnPkQ_Ns9KrHeF}"
SB_URL="${VITE_SUPABASE_URL:-https://gwbwnetatpgnqgarkvht.supabase.co}"

fail=0

check() {
  local label="$1" email="$2" password="$3" expected_role="$4"

  if [ -z "$password" ]; then
    echo "[SKIP] $label: password env var not set"
    return
  fi

  local login
  login=$(curl -s -X POST "$SB_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $PUB_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")

  local token
  token=$(echo "$login" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("access_token",""))' 2>/dev/null)
  if [ -z "$token" ]; then
    echo "[FAIL] $label: sign-in failed (first 200 chars): $(echo "$login" | head -c 200)"
    fail=$((fail+1))
    return
  fi

  local roles
  roles=$(curl -s "$SB_URL/rest/v1/user_roles?select=role" \
    -H "apikey: $PUB_KEY" \
    -H "Authorization: Bearer $token")

  local has
  has=$(echo "$roles" | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  print('yes' if any(r.get('role')=='$expected_role' for r in d) else 'no')
except Exception as e:
  print('parse_err:'+str(e))
" 2>/dev/null)

  if [ "$has" = "yes" ]; then
    echo "[PASS] $label: auth OK, $expected_role role present"
  else
    echo "[FAIL] $label: $expected_role role missing. got: $roles"
    fail=$((fail+1))
  fi
}

check "customer" "bkennington+customer@bluekube.com" "${CUSTOMER_PASSWORD:-}" "customer"
check "provider" "bkennington+provider@bluekube.com" "${PROVIDER_PASSWORD:-}" "provider"
check "admin"    "bkennington+admin@bluekube.com"    "${ADMIN_PASSWORD:-}"    "admin"

if [ "$fail" -gt 0 ]; then
  echo "---"
  echo "$fail role check(s) failed"
  exit 1
fi
