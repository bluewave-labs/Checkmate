# Single sign-on (OIDC)

Checkmate can delegate sign-in to any OpenID Connect provider — Authentik, Keycloak, PocketID, Okta, Zitadel, PingFederate, Google, Microsoft Entra, and anything else that implements the standard.

It is **off by default**. An instance that sets none of these variables behaves exactly as it always has.

## Quick start

1. Create an application in your identity provider using the **authorization code** flow.
2. Register the callback URL. It must match `OIDC_REDIRECT_URI` exactly:
   `https://checkmate.example.com/api/v1/auth/sso/callback`
3. Add the settings below to the server's `.env` and restart.

```env
OIDC_ENABLED=true
OIDC_ISSUER=https://auth.example.com/application/o/checkmate/
OIDC_CLIENT_ID=checkmate
OIDC_CLIENT_SECRET=the-secret-your-provider-generated
OIDC_REDIRECT_URI=https://checkmate.example.com/api/v1/auth/sso/callback
```

A "Single sign-on" button appears on the login page. Checkmate fetches everything else — endpoints, signing keys, supported algorithms — from the issuer's discovery document.

> Configuration is deliberately environment-only, never editable through the settings UI. The client secret stays out of the database, and "edit `.env` and restart" remains the recovery path if the provider ever breaks.

## Settings

| Variable | Default | Notes |
|---|---|---|
| `OIDC_ENABLED` | `false` | Master switch. |
| `OIDC_ISSUER` | — | Issuer URL. Must be `https` unless `OIDC_ALLOW_INSECURE_ISSUER` is set, with no query string, fragment or embedded credentials. |
| `OIDC_CLIENT_ID` | — | Required when enabled. |
| `OIDC_CLIENT_SECRET` | — | Required when enabled. |
| `OIDC_REDIRECT_URI` | — | Required when enabled, and must match the provider's registration exactly. Must end in `/api/v1/auth/sso/callback`, and be `https` unless `OIDC_ALLOW_INSECURE_ISSUER` is set. |
| `OIDC_SCOPES` | `openid profile email` | |
| `OIDC_BUTTON_LABEL` | — | Overrides the translated button label, in every locale. |
| `OIDC_ALLOW_LOCAL_LOGIN` | `true` | `false` disables email and password sign-in entirely. |
| `OIDC_REQUIRE_VERIFIED_EMAIL` | `true` | See [Email addresses](#email-addresses). |
| `OIDC_AUTO_PROVISION` | `false` | See [Who can sign in](#who-can-sign-in). |
| `OIDC_DEFAULT_ROLE` | `user` | Role for auto-provisioned users. `user` or `admin` only. |
| `OIDC_ALLOW_INSECURE_ISSUER` | `false` | Permits `http://` for the issuer and the redirect URI, on a trusted network. |

Misconfigurations are caught at boot: the server refuses to start and names the offending variable.

## Who can sign in

Set up an administrator account with email and password **before** enabling SSO. Checkmate will not let single sign-on create the first account, because the first account is an instance owner and that must not go to whoever happens to arrive first.

Once a provider identity has authenticated, Checkmate resolves it in this order:

1. **An account already linked to this provider identity** — signed in.
2. **An account with the same verified email, not yet linked to anyone** — signed in, and the provider's subject id is stored against it. Role and team are left alone; those are managed in Checkmate, not by the provider. An account already linked to a *different* provider identity is refused, so re-linking takes an administrator.
3. **A pending invite for that email** — the invite is consumed and an account is created with the invite's role and team.
4. **`OIDC_AUTO_PROVISION=true`** — an account is created with `OIDC_DEFAULT_ROLE`, on the administrator's team.
5. **Otherwise** — refused, with a message telling the person to ask an administrator for an invite.

So with the defaults, an account has to exist or be invited first. To pre-authorise people:

- **Invite them** from Settings, as you would for a password account. They never need to use the invite link; signing in with SSO consumes it.
- **Create the account directly**, which is scriptable and does not require a password:

  ```bash
  curl -X POST https://checkmate.example.com/api/v1/auth/users \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"firstName":"Ada","lastName":"Lovelace","email":"ada@example.com","role":["user"]}'
  ```

  Roles can be changed later with `PATCH /api/v1/auth/users/:userId`.

Accounts created through SSO have no password. They cannot sign in with one, and password recovery will not issue them a reset link.

## Email addresses

Checkmate matches a provider identity to an account by email the first time, then remembers the provider's subject id and prefers that afterwards — so an account survives someone changing their email address at the provider, and a recycled address cannot inherit an old account.

Because that first match is by email, **only federate with a provider you trust to assert email addresses**. By default Checkmate requires the provider to say the address is verified, and treats a missing `email_verified` claim as unverified. If your provider does not emit the claim — some PocketID and Authentik setups do not — set `OIDC_REQUIRE_VERIFIED_EMAIL=false`, and be sure your provider does not let users set their own address.

Even with that setting off, **claiming an account that already exists always requires a verified address**. Relaxing the check lets people be provisioned from an invite; it never lets an unverified claim take over an existing account.

Addresses are compared after trimming and lowercasing, matching how accounts are stored. Plus-addressing is not normalised: `ada+work@example.com` and `ada@example.com` are different accounts. Unicode compatibility folding is deliberately not applied, so an address using lookalike characters does not match the ASCII account it resembles.

## Disabling password sign-in

`OIDC_ALLOW_LOCAL_LOGIN=false` turns off password sign-in, password recovery and invited registration. It is enforced on the server, not just hidden in the UI.

**If your provider breaks, set `OIDC_ALLOW_LOCAL_LOGIN=true` and restart.** This is the reason the setting lives in the environment and not in the database: an operator who can edit `.env` can always get back in. There is no separate recovery command.

First-run setup stays available while no administrator account exists, so an instance can still be set up from scratch with this set to `false`.

## Known limitations

- **Sessions outlive deprovisioning.** Checkmate's session token is self-contained with no refresh and no server-side revocation, and `TOKEN_TTL` defaults to `99d`. Disabling someone at the provider stops them signing in again, but does not end a session they already have. **Set a shorter `TOKEN_TTL` (for example `12h`) when you enable SSO.**
- **Roles are not synchronised from claims.** A role is set when the account is created and changed only in Checkmate. There is no group-to-role mapping yet.
- **Role and team changes need a new sign-in** to take effect, as they are carried in the session token. This is not specific to SSO.
- **One provider at a time.**
- **No RP-initiated logout.** Signing out of Checkmate does not sign you out of the provider.
- **`response_mode=query` only.** `form_post` is not supported.
- **Sign-in always lands on the uptime dashboard**, rather than returning to the page you were on.
- **Accounts created before this release from a mixed-case invite** may have a mixed-case email stored and will not be matched. An administrator can correct the address on the user's record.
- **The callback page trusts the token it is handed** until the first API call rejects it. A crafted link can therefore make the UI briefly render as if signed in; no data is reachable, since every request is still authorised by the server.

## Troubleshooting

**The server will not start.** The log names the variable and the reason. Most often the issuer is not `https` (use `OIDC_ALLOW_INSECURE_ISSUER=true` on a LAN) or a required field is missing.

**The button does not appear.** `OIDC_ENABLED` is not `true`, or the server did not restart. Check `GET /api/v1/auth/sso`.

**"This sign-in attempt expired or was started in another browser."** The flow cookie was missing or too old. It lasts ten minutes. If it happens every time, the browser is dropping the cookie: confirm `CLIENT_HOST` uses `https` when Checkmate is served over `https`, since the cookie's `Secure` flag is derived from it.

**"Could not complete sign-in with your identity provider."** The code exchange failed. The underlying reason is in the server log — never in the browser, deliberately, since the provider controls that text. Usually the redirect URI registered at the provider does not match `OIDC_REDIRECT_URI` exactly, or the client secret is wrong.

**"No Checkmate account matches this account."** The person has no account and no pending invite. See [Who can sign in](#who-can-sign-in).

**"This account is linked to a different single sign-on identity."** The address matches an account already bound to another provider subject — usually a recycled address. An administrator should rename or remove the old account.

**Certificate errors against an internal provider.** Trust the CA rather than disabling verification — there is no option to skip TLS checks. See the [Custom CA Trust Guide](./custom-ca-trust.md).

**Checkmate behind a reverse proxy.** Make sure the proxy forwards the original `Host` header, and set `CLIENT_HOST` and `OIDC_REDIRECT_URI` to the public URLs. Checkmate never derives them from the incoming request.
