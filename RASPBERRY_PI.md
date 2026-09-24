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

If you prefer to keep DNS with your current provider, use a reverse proxy with HTTPS on the Pi or a VPS. Direct home hosting additionally requires reachable public IPs, port forwarding and possibly dynamic DNS; it may not work behind your ISP's CGNAT. The registrar/DNS provider and Pi model are still needed to tailor the final steps. No DNS changes or public tunnel have been applied by this guide.

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
