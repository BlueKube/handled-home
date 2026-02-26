

# Wire Up Resend for Transactional Email

## Steps

### 1. Store the RESEND_API_KEY secret
Use the `add_secret` tool to prompt you for the Resend API key value.

### 2. Store RESEND_FROM_EMAIL secret
Add a second secret `RESEND_FROM_EMAIL` with value `Handled Home <notifications@handled-home.com>` so emails come from the correct domain.

### 3. Update send-email edge function
Change the fallback `from` address from `notifications@handl.homes` to `notifications@handled-home.com` (line 80).

### 4. Redeploy send-email
Deploy the updated edge function so it picks up the new secrets.

### 5. Update documentation
Update `docs/edge-function-inventory.md` to mark `send-email` as fully active (not infrastructure-only).

---

**No database changes needed.** The infrastructure (delivery records, processor pipeline, health dashboard) is already in place from Sprint C5. Once the secret is added, emails will flow automatically on the next notification processor run.

