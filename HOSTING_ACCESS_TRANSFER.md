# Private access transfer checklist

The provider already has GitHub access. This checklist covers the remaining access needed to operate the site. Keep actual passwords, API keys, recovery codes, and the production `.env` out of GitHub and ordinary support tickets. Give each person only the access they need; keep owner recovery access and MFA.

Websupport does not supply a runtime token to the website; it controls domain registration and nameserver delegation. Cloudflare does require a tunnel token on the new host, but the provider can create a new one after receiving access to the owner's Cloudflare account. The provider can fill the other `.env` values with credentials it manages.

## Websupport (domain registrar)

1. Identify the Websupport account that owns `ivettkovacspmu.hu` and `ivettkovacspmu.com`. Confirm both renewal dates, payment method, registrant contact, and account recovery method.
2. Give the provider delegated access if the account supports it. Otherwise share the login through a password manager with a temporary password and MFA handoff plan. Do not put registrar credentials in the source ZIP.
3. Ask the provider to confirm the authoritative nameservers for each domain. For `.hu`, Cloudflare currently serves website DNS; Websupport remains the registrar. A nameserver change can break both website and mail, so require a DNS export and change record before any edit.
4. Keep ownership and billing responsibility explicit in the hosting contract. Have the provider record who can approve DNS and renewal changes.

## Cloudflare (DNS, HTTPS, tunnel, redirects)

1. Grant the provider access to the Cloudflare account/zones for the relevant domains using their own login and MFA. Prefer scoped account or zone access over sharing the owner's password.
2. The provider needs to inspect/edit DNS records, Tunnel configuration and published application routes, and redirect rules. Confirm which account owns the current tunnel and whether the `.com` zone is active in the same account.
3. For takeover, create a new tunnel/token on the provider host. The old laptop tunnel token is in the private `.env`; do not reuse it indefinitely. After cutover and verification, revoke the old token and remove the old connector/route.
4. Export or document all existing DNS records, especially mail MX, SPF, DKIM, DMARC, Resend records, and CNAME targets. Keep the public origin `www.ivettkovacspmu.hu` unless the owner approves a canonical-domain change.

## Runtime `.env` and email

1. Give the provider the supplied `provider.env.template` and have them create their own private `.env` on the new host. The current production `.env` is deliberately not in the portable bundle. If a value must be preserved during migration, transfer only that value through a password manager or encrypted file transfer.
2. These are the variables present in the current file: `PUBLIC_ORIGIN`, `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_RECOVERY_EMAIL`, `DEEPL_API_KEY`, `TUNNEL_TOKEN`, and `ADMIN_INITIAL_HASH`. In the current Docker Compose deployment, `PUBLIC_ORIGIN`, `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_RECOVERY_EMAIL`, `DEEPL_API_KEY`, and `TUNNEL_TOKEN` are used. `ADMIN_INITIAL_HASH` is not passed by `compose.yaml`; a restored database already contains the admin password hash.
3. The provider should create and store **new** Resend and Cloudflare tunnel credentials for its host, update its `.env`, verify email and tunnel operation, then revoke the old keys. The Cloudflare account/zone stays under the owner's existing account unless the owner explicitly transfers it. Keep the Resend sending domain DNS verified. Do not paste key values into logs or chat.
4. Confirm that `PUBLIC_ORIGIN=https://www.ivettkovacspmu.hu` and `RESEND_FROM` uses an address on the verified sending domain. Do not treat `.env.example` as a production secret file.

## Passwords and recovery

1. Transfer the website admin login through a password manager, or have the owner sign in during cutover and rotate it to a provider-managed credential. The password hash in the restored database does not reveal the password.
2. Give the provider separate login invitations for Resend and Cloudflare if possible. Transfer Websupport login only as needed. Preserve the owner's recovery methods and MFA. Never send one message containing all passwords and the database backup.
3. Confirm access to the private `ADMIN_RECOVERY_EMAIL` inbox or designate an owner who can act on password recovery requests. If the provider must operate it, set a new private recovery address and test the flow.
4. Rotate shared passwords and API tokens after the new host is stable and the provider confirms access. Record who holds emergency access and how the owner can revoke it.

## Receipt for provider to sign off

- [ ] Websupport ownership, renewal, nameservers, and delegated access confirmed for `.hu` and `.com`.
- [ ] Cloudflare account and both domain zones inspected; DNS export saved; new tunnel works.
- [ ] Provider created a private `.env` from the template, with provider-managed credentials and a new tunnel token from the owner's Cloudflare account.
- [ ] Admin login and recovery inbox tested; owner retains recovery access.
- [ ] Verified final database/upload backup restored; public booking and email tests passed.
- [ ] Old credentials revoked after successful cutover.
