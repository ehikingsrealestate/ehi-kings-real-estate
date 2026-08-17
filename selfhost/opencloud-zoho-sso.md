# OpenCloud → "Login with Zoho" (company SSO)

Turns the company Drive (cloud.207-180-245-46.sslip.io) into Zoho-SSO: staff
click "Login with Zoho", sign in with their company email, and an OpenCloud
account is auto-created on first login. Not applied yet — needs a Zoho OAuth
client (I can't reach the Zoho admin console).

## Step 1 — create the Zoho OAuth client (you, ~2 min)
1. Go to https://api-console.zoho.com → **Add Client** → **Server-based Applications**.
2. Name: `Ehi-Kings Cloud`. Homepage: `https://cloud.207-180-245-46.sslip.io`.
3. Authorized Redirect URIs (add all three):
   - `https://cloud.207-180-245-46.sslip.io/`
   - `https://cloud.207-180-245-46.sslip.io/oidc-callback.html`
   - `https://cloud.207-180-245-46.sslip.io/oidc-silent-redirect.html`
4. Create → copy the **Client ID** and **Client Secret**. Send them to me
   (or add to `/root/ehikings/.env` as `ZOHO_CLIENT_ID` / `ZOHO_CLIENT_SECRET`).

## Step 2 — I apply this (swaps OpenCloud's built-in login for Zoho)
Add to the `opencloud` service env in docker-compose.yml, then recreate:

```yaml
      # External OIDC (Zoho) instead of the built-in IdP
      OC_OIDC_ISSUER: "https://accounts.zoho.com"
      WEB_OIDC_CLIENT_ID: "${ZOHO_CLIENT_ID}"
      WEB_OIDC_METADATA_URL: "https://accounts.zoho.com/.well-known/openid-configuration"
      PROXY_OIDC_ISSUER: "https://accounts.zoho.com"
      PROXY_OIDC_REWRITE_WELLKNOWN: "true"
      PROXY_AUTOPROVISION_ACCOUNTS: "true"
      PROXY_USER_OIDC_CLAIM: "email"
      PROXY_USER_CS3_CLAIM: "username"
      PROXY_ACCESS_TOKEN_VERIFY_METHOD: "none"
      OC_EXCLUDE_RUN_SERVICES: "idp"
```

Notes:
- Zoho region matters — if the company Zoho is EU/IN, swap `accounts.zoho.com`
  for `accounts.zoho.eu` / `accounts.zoho.in` in all three URLs above.
- Auto-provisioned users land with the default role; an OpenCloud admin can
  promote them. Keeping the built-in `admin` account as a break-glass login is
  wise (revert by removing these env lines).
- Zoho returns opaque access tokens, hence `verify-method: none` +
  `rewrite-wellknown` so OpenCloud validates via userinfo.
