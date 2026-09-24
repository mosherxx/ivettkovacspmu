# Raspberry Pi launch guide

The full application can run in Docker: public website, booking API, admin, SQLite database and uploaded photos. Resend remains an external email delivery provider. GitHub hosts the source; GitHub Pages is optional and cannot run bookings.

Use a Pi with a 64-bit OS (`uname -m` should show `aarch64`). A Pi 4 or 5 with 4 GB or more and an SSD is a practical starting point; the exact hardware has not yet been confirmed. Docker's Debian packages support ARM64. A 32-bit Pi installation is not the target for this Node 24 image. Allow extra memory/time for the production build, or build an ARM64 image on another machine with Docker Buildx. No ARM64 image has been executed in this development environment yet.

## 1. Run privately first

Install Docker Engine and its Compose plugin using the official instructions for your OS: https://docs.docker.com/engine/install/debian/

```sh
git clone https://github.com/mosherxx/ivettkovacspmu.git
cd ivettkovacspmu
cp .env.example .env
chmod 600 .env
```

Initially set `PUBLIC_ORIGIN=http://localhost:3000`, then:

```sh
docker compose up -d --build
docker compose ps
```

The port is bound to localhost. From your computer, use an SSH tunnel to the Pi (`ssh -L 3000:127.0.0.1:3000 your-user@your-pi`), then open http://localhost:3000/admin. For a fresh database only, sign in with admin/admin and immediately complete the mandatory password change. Existing Sites passwords and data do not transfer automatically. Configure the services, hours, recovery email and content before opening public access.

## 2. Connect the domains with HTTPS

Suggested primary address: **https://www.ivettkovacspmu.hu**.

A Cloudflare Tunnel is useful for a home Pi because it uses outbound connections and avoids router port forwarding. This setup requires the domains to use Cloudflare DNS. Add each domain to Cloudflare, carefully preserve its existing email/verification records, and replace its nameservers at the registrar with the exact nameservers Cloudflare assigns. Do not add the GitHub Pages A/CNAME records from the alternative Pages guide if the Pi will host the website.

1. In Cloudflare, create a remotely managed tunnel and choose Docker. Store its token as `TUNNEL_TOKEN` in the Pi's private `.env`; never commit it.
2. Add a published application route: hostname `www.ivettkovacspmu.hu`, service **http://web:3000**. The name `web` is the application container on the shared Compose network.
3. Set `PUBLIC_ORIGIN=https://www.ivettkovacspmu.hu` in `.env`.
4. Start the application and tunnel:

```sh
docker compose -f compose.yaml -f compose.tunnel.yaml up -d --build
docker compose -f compose.yaml -f compose.tunnel.yaml ps
```

5. Configure HTTPS-capable permanent redirects for `ivettkovacspmu.hu`, `ivettkovacspmu.com` and `www.ivettkovacspmu.com` to the primary www.hu address, preserving path and query string. Cloudflare Redirect Rules or your registrar's HTTPS forwarding service can provide them. Cloudflare redirects require proxied DNS records and active edge certificates for the source hostnames; use the dashboard's current redirect setup instructions. DNS by itself cannot redirect a browser.
6. Test all four hostnames, HTTPS, a real browser booking, admin confirmation, cancellation and reopening of the time slot.

Cloudflare guide: https://developers.cloudflare.com/tunnel/get-started/
Routing reference: https://developers.cloudflare.com/tunnel/concepts/routing/

If you prefer to keep DNS with your current provider, use a reverse proxy with HTTPS on the Pi or a VPS. Direct home hosting additionally requires reachable public IPs, port forwarding and possibly dynamic DNS; it may not work behind your ISP's CGNAT. The .hu domain currently uses Websupport DNS. The Pi model and OS still need confirmation. No DNS changes or public tunnel have been applied by this guide.

## 3. Enable automatic email

Create a Resend account, add and verify `ivettkovacspmu.hu` (or a dedicated sending subdomain), then copy the exact SPF/DKIM DNS records Resend provides to the authoritative DNS provider. Create a sending API key and set these runtime values in `.env`:

```dotenv
PUBLIC_ORIGIN=https://www.ivettkovacspmu.hu
RESEND_API_KEY=your-private-key
RESEND_FROM=Ivett Kovacs PMU <foglalas@ivettkovacspmu.hu>
ADMIN_RECOVERY_EMAIL=ivettkovacs5@gmail.com
```

Use an address belonging to the domain actually verified in Resend. Gmail is the reply-to and recovery inbox, not the authenticated sending domain. Resend sending alone does not create a mailbox at foglalas@; incoming replies currently go to the public contact email. Restart the containers after changing environment settings.

The admin's Confirm, Cancel and Reject actions send the corresponding Hungarian/English email according to the booking language. Submitting a request shows an on-screen acknowledgment; it does not yet confirm the appointment. Failed/queued email states are visible in admin, with retry controls. Provider acceptance is not proof of inbox delivery; check a real test email and Resend delivery logs before launch. Password recovery uses the same email provider.

Resend documentation: https://resend.com/docs/dashboard/domains/introduction

## 4. Data and launch checks

The `ivett-data` volume holds reservation records, admin credentials, settings, gallery order and uploaded images. Rebuilding keeps this data. Never run `docker compose down -v` against the live service. Keep a single web instance per volume.

The reservation History view shows appointment dates from the past 30 days. Older records remain in All reservations; this is a browsing filter, not an automatic deletion policy. Arrange the actual retention period separately before introducing scheduled deletions.

Before launch:
- Decide whether existing Sites bookings, settings and uploads need migration. This is a separate export/import operation; a fresh Pi database contains source defaults only. Avoid accepting bookings on both installations during the switch.
- Check prices, durations, opening hours, vacation dates, contact details, profile photo and both languages.
- Rotate the initial password privately; configure and test password recovery.
- Verify a real test booking, confirmation/cancellation emails and the anonymous calendar.
- Back up the complete data volume with the application stopped, then restart; store backups off the Pi and test restoration. Include the private runtime settings in a separate protected backup.
- Keep the Pi powered and online, maintain OS/container updates, and check disk space. Home power/internet downtime makes reservations unavailable.

The Next production build and local SQLite integration can be checked here, but an actual Docker/ARM64 launch, DNS routing and live email delivery must be verified on the host after configuration.


## Detailed domain cutover: Websupport → Cloudflare Free

The domains can remain registered and renewed at Websupport. Only their authoritative DNS moves. Use the Free plan for both zones; no paid certificate or fixed public IP is required for this tunnel setup. Hardware, electricity, internet, domain renewals and any usage exceeding email-provider free allowances remain separate costs.

1. Add `ivettkovacspmu.hu` and `ivettkovacspmu.com` to Cloudflare. Choose Free for each. Review the imported records against Websupport's DNS panel; automatic scanning is not a complete backup.
2. In the .hu zone preserve the exact Resend TXT value at `resend._domainkey`. Preserve these CNAMEs as **DNS only** (grey cloud): `rsend` → `rsend-euw1.forge.rmta.net`, and `send` → `send.forge.rmta.net`. Also preserve any existing MX, SPF, DKIM and other verification records. The long DKIM public key is available in your verified Resend domain panel.
3. If DNSSEC is enabled at the old DNS provider, follow Cloudflare's migration instructions and remove the old DS record before changing nameservers. Once the new zone is active, enable Cloudflare DNSSEC and publish its new DS record through the registrar. Do not carry the old DS value over.
4. At Websupport's domain/nameserver settings, replace the existing nameservers with the exact pair assigned by Cloudflare for that domain. Repeat for .com with its own assigned pair. Wait until both Cloudflare zones show Active. Keep the old DNS records during propagation.
5. Complete the tunnel steps above. The published hostname `www.ivettkovacspmu.hu` points to `http://web:3000`; let the tunnel dashboard create its DNS record. Remove only a conflicting old website record at that hostname. Do not route visitors to GitHub Pages if they need bookings/admin.
6. For redirect-only hostnames add **proxied** A records using the documentation-only address `192.0.2.1`: .hu zone `@`; .com zone `@` and `www`. These are placeholders for Cloudflare edge redirects, not your Pi's address. Replace conflicting A/AAAA/CNAME records at those names, preserving unrelated mail records.
7. In each zone, open Rules → Redirect Rules and create Single Redirects using the following wildcard patterns. Set HTTP status **301** and enable **Preserve query string**:

| Zone | Incoming wildcard | Target URL |
|---|---|---|
| .hu | `http*://ivettkovacspmu.hu/*` | `https://www.ivettkovacspmu.hu/${2}` |
| .com | `http*://ivettkovacspmu.com/*` | `https://www.ivettkovacspmu.hu/${2}` |
| .com | `http*://www.ivettkovacspmu.com/*` | `https://www.ivettkovacspmu.hu/${2}` |

The first wildcard matches the optional `s` in HTTPS, and the second captures the path. Do not redirect `www.ivettkovacspmu.hu` back to itself.

8. Under SSL/TLS → Edge Certificates, wait for Universal SSL to be Active for both domains and enable Always Use HTTPS. Set minimum TLS 1.2. Certificates are issued and renewed free by Cloudflare. Do not purchase a certificate for this setup.
9. The public path is browser → HTTPS → Cloudflare → encrypted Tunnel → cloudflared container → HTTP over the local Docker network → application. No public port 3000 and no router port forwarding are needed. The local HTTP hop is deliberate; do not configure an HTTPS origin service unless the local application actually serves TLS.
10. Leave Cloudflare's normal HTML/API caching defaults. Do not add Cache Everything rules for `/admin`, `/api/*` or booking pages. Check that no existing rule caches responses containing client data or stale availability.
11. Test each hostname using a private browser window. Verify HTTPS, redirect paths, gallery images, login, a test booking, confirmation email, cancellation email, recovery and reopened availability. Confirm the Pi keeps working after a reboot.

References:
- Free SSL: https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/enable-universal-ssl/
- Redirect setup: https://developers.cloudflare.com/fundamentals/manage-domains/redirect-domain/
- Redirect wildcard example: https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-all-another-domain/
- DNSSEC migration: https://developers.cloudflare.com/dns/dnssec/

## Free security measures and current limitations

HTTPS protects traffic in transit; it does not make an application immune to attacks. The current app includes server-side admin checks, hashed passwords, expiring server-side sessions, HttpOnly/SameSite cookies (Secure with an HTTPS PUBLIC_ORIGIN), origin checks on mutations, a failed-login lockout, single-use expiring recovery tokens and parameterized database queries. Public calendar responses omit client names and contact data. Email templates escape client-supplied text before inserting it into HTML.

Use a unique admin password generated by a password manager. Enable MFA on Cloudflare, Websupport, GitHub, Resend and the recovery mailbox wherever available. The app itself does not currently have native admin MFA. Cloudflare Access can optionally add another login gate for admin paths, but plan it around `/admin/*` and authenticated APIs without blocking public gallery/catalog/booking endpoints or recovery links.

Keep Raspberry Pi OS and Docker up to date, use SSH keys, and do not expose SSH or the application port on your router. The supplied containers run the app without root and keep uploads/data in the persistent volume. Store `.env` with mode 600 and never commit it or backups to the public repository. Rotate credentials that have been shared in messages before public launch, replacing the server secret before revoking the old key.

Public booking requests are not yet protected by a CAPTCHA or a dedicated booking rate limiter. The origin check is not an anti-bot control: automated callers can imitate it. Before advertising the booking service publicly, add server-verified Cloudflare Turnstile and booking request limits to reduce fake reservations. This guide does not claim those controls are already implemented. Cloudflare's free protections can help with network abuse, but are not a substitute for application checks.

Backups and security updates are ongoing work. Use an SSD where possible and maintain an off-device backup. The current history filter is 30 days, but there is no automatic record-deletion policy. Review retention and privacy documents against the actual hosting/email setup before accepting real client records.

## Repeatable backup and update commands

These commands stop the website briefly so the database and uploads form one consistent snapshot. Run in the checkout on the Pi. Use a private backup destination, not a public web folder.

```sh
mkdir -p backups
chmod 700 backups
docker compose stop web
docker compose run --rm --no-deps --user root -v "$PWD/backups:/backup" --entrypoint sh web -c 'tar czf /backup/ivett-data.tar.gz -C /data .'
chmod 600 backups/ivett-data.tar.gz
docker compose start web
```

Copy the archive to a separate protected device and rename/version it so the next backup does not overwrite your only recovery point. If backup fails, restart `web` before investigating. Keep `.env` separately in a protected password manager or encrypted backup.

After a backup, update source and rebuild:

```sh
git pull --ff-only
docker compose -f compose.yaml -f compose.tunnel.yaml up -d --build
docker compose -f compose.yaml -f compose.tunnel.yaml ps
```

Restore rehearsal: create an isolated checkout/project with a fresh volume, keep its tunnel off, restore the archive into `/data` with the web process stopped, set ownership to the image's node user (UID/GID 1000), then start and verify records/uploads locally. Never overwrite a live volume as a test.
