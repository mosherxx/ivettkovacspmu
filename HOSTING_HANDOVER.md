# Hosting company handover

## Read this first

This is the production reservation website for Ivett Kovacs PMU. The primary public address is `https://www.ivettkovacspmu.hu`. The private source repository is `https://github.com/mosherxx/ivettkovacspmu`. The application is a Next.js standalone server in Docker, with a SQLite database and uploaded files in the persistent `/data` volume. Cloudflare provides public DNS, HTTPS, and a tunnel; Resend sends transactional mail. The current laptop uses Docker Desktop and a Windows `cloudflared` service. A new Linux host can run the supplied `compose.yaml` and `compose.tunnel.yaml` together.

The source archive alone **does not contain reservations or uploads**. Restore the separate `ivett-data-*.tar.gz` archive before opening the new site to visitors. The archive contains customer personal data. Transfer it privately and restrict access. The source archive intentionally excludes `.env`, credentials, and tunnel tokens.

## Inventory and ownership

| Item | Where it lives | Handover action |
| --- | --- | --- |
| Source and deployment files | Private GitHub repository and source ZIP | Give provider repository access; keep owner access |
| Bookings, settings, admin account, gallery uploads, email outbox | Docker named volume `ivett_ivett-data` mounted at `/data` | Transfer the verified data archive separately |
| Production secrets | Local ignored `.env` and account dashboards | Create new provider credentials in a secret manager; never email the old `.env` |
| DNS and HTTPS | Cloudflare zones for `.hu` and possibly `.com` | Give scoped Cloudflare access and document the desired `.com` redirect |
| Domain registration | Websupport | Keep registration and nameserver control with owner or assign provider access |
| Outbound mail | Resend verified sender domain `ivettkovacspmu.hu` | Give provider access; issue a new sending key and rotate the old one after cutover |
| Backups | Current laptop `backups/` and provider's future backup system | Transfer a final backup; configure encrypted off-host backups and restore drills |

The existing `.hu` DNS and tunnel settings must be inspected in Cloudflare before cutover. Do not replace MX, SPF, DKIM, DMARC, or other mail records while changing the website route. Confirm the actual `.com` zone and redirect state rather than assuming they are complete.

The owner has already granted GitHub repository access. The remaining access handoff is Websupport, Cloudflare, the private `.env`, and the admin/account passwords. Follow [HOSTING_ACCESS_TRANSFER.md](HOSTING_ACCESS_TRANSFER.md) for the exact list and safe transfer sequence.

## Application behavior that matters during migration

- `compose.yaml` publishes only `127.0.0.1:3000` on the Docker host. The tunnel connects to the `web` service over Docker's internal network when run with `compose.tunnel.yaml`.
- `PUBLIC_ORIGIN` must be `https://www.ivettkovacspmu.hu`; it is used for origin checks, secure cookies, and recovery links.
- A booking creates a pending reservation and an immediate request receipt. Admin confirmation, rejection with a reason, and cancellation produce separate emails. The reservation stores the language selected on the public website (`hu` or `en`), and that language is used for every reservation status email.
- Mail delivery uses a durable `email_outbox` table. A provider acceptance is different from inbox delivery; inspect Resend events if a customer reports missing mail. Avoid manually retrying an ambiguous send without checking Resend, to prevent duplicates.
- The admin account and its password hash live in the database. A restored database keeps the current admin login. A blank database starts with a one-time `admin` / `admin` login and requires immediate password rotation; never publish a new blank database with that login.
- `DEEPL_API_KEY` is optional. Without it, automatic translation in admin is unavailable, but bookings still work.
- There is no payment processor in this repository.

## New Linux host: preparation

1. Provision a supported Linux server with Docker Engine and the Docker Compose plugin, outbound HTTPS, automatic security updates, a firewall, monitoring, and enough disk space for images plus multiple database backups. Use a dedicated operator account with controlled Docker access. Record the hostname, operator contacts, and recovery method in the provider's runbook.
2. Clone the private repository at a reviewed commit or extract the supplied source ZIP. Keep the checkout and secrets readable only by operators. Do not put the production SQLite database in Git.
3. Make a private `.env` beside `compose.yaml`, starting from `.env.example`. Set `PUBLIC_ORIGIN`, `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_RECOVERY_EMAIL`, and, if used, `DEEPL_API_KEY`. Set `TUNNEL_TOKEN` to a **new** Cloudflare tunnel token for the new host. Keep the file mode restrictive (`chmod 600 .env`). Do not log or paste secret values into tickets.
4. In Cloudflare Zero Trust, create a new remotely managed tunnel and a published application route for `www.ivettkovacspmu.hu` with service URL `http://web:3000`. Do not switch live DNS to it yet. The existing Windows tunnel route uses `http://127.0.0.1:3000`; the containerized tunnel must use the Docker service name `web`.
5. Build the image and create the stopped service/volume. Run these commands in the repository directory:

   ```sh
   docker compose -p ivett -f compose.yaml -f compose.tunnel.yaml build web
   docker compose -p ivett -f compose.yaml up --no-start web
   docker compose -p ivett -f compose.yaml ps -a
   ```

## Data transfer and cutover

1. Agree on a short maintenance window. Stop new bookings on the old host before taking the **final** backup; otherwise reservations made after the snapshot are lost on the new host. Preserve the old host and its volume for rollback until reconciliation is complete.
2. On the old Windows laptop, from the repository directory, run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup-windows.ps1`. It briefly stops `web`, writes `backups/ivett-data-*.tar.gz`, verifies the tar, adds a SHA-256 sidecar, and restarts `web`. For a final cutover, stop the old `web` again immediately after the backup or disable the old public tunnel, so the old database receives no more writes.
3. Transfer that final archive and its `.sha256` file through an encrypted channel. On Linux, verify `sha256sum -c ivett-data-*.tar.gz.sha256` from the archive directory. The file name in the sidecar must match the archive name.
4. Restore while the new `web` is stopped. From the repository directory, with `BACKUP_FILE` set to the absolute path of the verified archive:

   ```sh
   docker compose -p ivett -f compose.yaml stop web
   docker compose -p ivett -f compose.yaml run --rm --no-deps --user 0:0 \
     -v "$BACKUP_FILE:/restore.tar.gz:ro" --entrypoint sh web \
     -c 'tar -xzf /restore.tar.gz -C /data && chown -R node:node /data'
   docker compose -p ivett -f compose.yaml up -d web
   docker compose -p ivett -f compose.yaml ps
   curl -fsS http://127.0.0.1:3000/api/catalog >/dev/null
   ```

   The restore command **replaces the new volume's contents**. Use it only on a fresh or intentionally disposable volume. On a host with existing production data, take a new backup and restore into a separate test volume first.
5. Before DNS cutover, check the admin dashboard using a secure temporary access path and compare reservation counts, recent entries, services, availability, and uploaded images against the old host. Do not expose the default admin login.
6. Start the tunnel with `docker compose -p ivett -f compose.yaml -f compose.tunnel.yaml up -d`. In Cloudflare, point the published `www.ivettkovacspmu.hu` route/CNAME to the new tunnel. Keep all mail DNS records intact. Verify public `GET /api/catalog` returns JSON, the homepage and admin login load, and the TLS certificate is valid. Make a controlled test reservation in the correct language and confirm its receipt plus admin confirmation/rejection mail in Resend and the recipient inbox; clearly mark and remove or close the test booking afterward.
7. Confirm `.com` bare and `www` names redirect to the primary `.hu` address if that is the owner-approved desired behavior. Check both HTTP and HTTPS and preserve the path/query if intended.
8. Once the owner accepts the new site, remove the old tunnel route or stop the old service so there is only one writer. Revoke old tunnel and Resend credentials after the new credentials are proven. Keep the old volume and final backup until the agreed rollback window ends.

## Normal operation on the new host

```sh
docker compose -p ivett -f compose.yaml -f compose.tunnel.yaml ps
docker compose -p ivett -f compose.yaml -f compose.tunnel.yaml logs --tail=100 web tunnel
curl -fsS https://www.ivettkovacspmu.hu/api/catalog >/dev/null
```

Docker restart policies handle container restarts. Configure the Docker daemon to start on boot and independently monitor the public URL, the container health status, backup age, disk free space, and Resend failures. Keep a current patch and incident process. For updates, take a consistent backup, deploy a reviewed Git commit, rebuild `web`, verify health and booking/email flows, and retain the previous image and backup for rollback. Do not use `docker compose down -v` or prune the named data volume.

Run a daily consistent backup with `scripts/backup-linux.sh` (or an equivalent provider backup job). Its brief web outage is intentional for SQLite consistency. Store encrypted copies off-host with retention and test restoring to a disposable volume regularly. A backup on the same disk is not disaster recovery.

## Access transfer checklist

- [ ] Provider has private repository access and knows the deployed Git commit.
- [ ] Provider has scoped Cloudflare access for DNS, tunnel, redirect rules, and certificate diagnostics.
- [ ] Provider has Resend access and a new sending API key; sender domain remains verified.
- [ ] Owner retains Websupport registrar and Cloudflare account recovery access, or explicitly transfers it.
- [ ] Provider receives the final verified data archive through a secure channel and confirms restore counts/images.
- [ ] Provider receives required admin login through a password manager or rotates it during handover.
- [ ] Provider documents backup location, encryption, retention, restore test, monitoring, and on-call contact.
- [ ] Owner and provider agree on maintenance window, rollback window, and final cutover sign-off.

For symptom-by-symptom diagnosis, see [HOSTING_TROUBLESHOOTING.md](HOSTING_TROUBLESHOOTING.md). [DEPLOYMENT_TECHNICAL.md](DEPLOYMENT_TECHNICAL.md) documents the current Windows installation.
