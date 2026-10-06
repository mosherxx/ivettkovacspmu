# Hosting troubleshooting runbook

Use this order for an incident. Run commands from the repository directory. On the new Linux host, the Compose command in examples means `docker compose -p ivett -f compose.yaml -f compose.tunnel.yaml`; on the current Windows laptop use `docker compose -f compose.yaml` and `Get-Service cloudflared` for the host tunnel. Record the time, public URL, observed HTTP status, and relevant logs before changing anything. Never paste `.env`, API keys, tunnel tokens, customer data, or full email payloads into a public ticket.

## 1. Site unavailable or wrong content

1. Run `curl -i --max-time 15 https://www.ivettkovacspmu.hu/api/catalog`. Healthy means HTTP 200 with JSON. Also check the homepage and an uploaded image. A 200 with an old Websupport placeholder is still an incident.
2. Check `docker compose -p ivett -f compose.yaml -f compose.tunnel.yaml ps`. `web` should be healthy and `tunnel` running. Check `docker compose -p ivett -f compose.yaml -f compose.tunnel.yaml logs --tail=150 web tunnel` for startup, SQLite, or tunnel errors. On Windows check `docker compose ps`, `Get-Service cloudflared`, and the Windows service event log.
3. Check local origin: `curl -i http://127.0.0.1:3000/api/catalog` on the Docker host. If this fails, inspect Docker Engine, free disk, image startup, and the `/data` volume before changing DNS. Restart only the failed service after the cause is understood: `docker compose -p ivett -f compose.yaml -f compose.tunnel.yaml up -d web`.
4. If local origin works but public URL fails, inspect the Cloudflare tunnel connector and the published application route. For a containerized tunnel, service URL must be `http://web:3000`; for the current Windows service, `http://127.0.0.1:3000`. Local HTTP is expected: public HTTPS ends at Cloudflare and the tunnel carries traffic securely to the host.
5. Check Cloudflare DNS for `www`: it should route to the active tunnel, with no conflicting old A/AAAA records. Check the registrar nameservers still point to Cloudflare. Preserve MX, SPF, DKIM, and DMARC. Diagnose Cloudflare 502 as an origin/route problem; 1016 or an inactive tunnel as a DNS/tunnel availability problem. Check Cloudflare's dashboard for the exact error rather than assuming every 5xx has the same cause.
6. If only the `.com` aliases fail, inspect that zone's DNS and redirect rule separately. The primary app origin remains `.hu` unless the owner changes the canonical domain.

## 2. Website loads but reservations fail

1. Capture the response code and a timestamp from the browser's Network panel for `POST /api/booking`. A `GET` request to a booking endpoint is not evidence that the reservation was submitted; inspect the actual POST and its response.
2. Compare `PUBLIC_ORIGIN` in the private environment with the browser origin. It must be exactly `https://www.ivettkovacspmu.hu`. After changing it, recreate the web container: `docker compose -p ivett -f compose.yaml -f compose.tunnel.yaml up -d --force-recreate web`. A mismatch can cause 403.
3. Check `web` logs and the container health result. Confirm `/data` is mounted and writable and the disk is not full. On a test or restored copy, check SQLite integrity with `sqlite3 /data/ivett.sqlite 'PRAGMA integrity_check;'` if sqlite3 is available; never run ad hoc writes against the live database.
4. If a slot appears available but booking returns conflict, refresh availability and compare existing bookings, time blocks, business hours, and service duration in admin. Concurrent bookings can legitimately compete for the same slot.
5. After any repair, make one controlled test booking, verify it appears in admin and the receipt arrives, then close it cleanly. Do not repeatedly submit real customer bookings while debugging.

## 3. Transactional email missing or in the wrong language

1. In admin, locate the reservation and its email state. The site records pending receipts and status messages in `email_outbox`; `accepted` means Resend accepted the API call, not that the recipient inbox received it. `failed`, `manual_review`, or a queued state requires investigation.
2. In the web logs near the reservation time, look for a provider HTTP status or send failure without printing message contents. In Resend, search the recipient and provider message ID; check delivered, bounced, suppressed, or rejected events. Check spam folders and recipient address spelling.
3. Confirm `RESEND_API_KEY` and `RESEND_FROM` exist in the runtime environment, the key is active and has sending permission, and the sender domain is verified. Confirm required Resend SPF/DKIM/CNAME records in Cloudflare. Restart `web` after changing environment values.
4. If Resend accepted a message but the app state is ambiguous, compare the provider event before retrying. The app sends an idempotency key per booking event, but manual resends can still confuse customers. Escalate `manual_review` instead of blindly replaying it.
5. Reservation emails use the language stored when the visitor submitted the form on the public site. Check the booking's `language` (`en` or `hu`) and the generated outbox payload. Admin panel language does not determine customer email language. Admin password recovery mail is a separate flow selected by the recovery page language.
6. For a rejection email, confirm the reservation transitioned from pending to rejected and an admin rejection reason was entered. Cancellation applies to an already confirmed appointment; rejection applies to a pending request. Status changes should be made through admin, not direct SQL.

## 4. Admin login or password recovery fails

1. Verify public HTTPS, correct canonical host, and browser cookies. Try a private window before resetting an account.
2. Inspect web logs and `PUBLIC_ORIGIN`; recovery links require the correct origin. Confirm `ADMIN_RECOVERY_EMAIL` points to a private inbox and that Resend is working.
3. Use the password reset flow, then verify the old session is invalidated as expected. Do not clear the database to regain access: that would erase reservations and settings. If account recovery is impossible, preserve a backup and escalate to a controlled data repair by the provider.

## 5. Backup failed, restore needed, or disk full

1. Check the latest archive's timestamp and `.sha256` file. On Windows, inspect Task Scheduler task `Ivett Reservation Backup`; on Linux, inspect the configured systemd timer/cron and `scripts/backup-linux.sh` output. A successful scheduler exit with no new archive is not a successful backup.
2. Verify the checksum (`sha256sum -c NAME.tar.gz.sha256` on Linux) and tar listing (`tar -tzf NAME.tar.gz`). Check that the archive includes `ivett.sqlite` and uploaded data as applicable. Keep the database backup private.
3. For a restore, stop writes, take a fresh backup of the current volume, and restore into a **new disposable volume** first. Check SQLite integrity and reservation counts there. Only then replace production data in a planned maintenance window. The cutover instructions in `HOSTING_HANDOVER.md` are for a fresh target volume, not an in-place repair.
4. If disk is full, determine whether Docker build cache, old images, logs, or backup retention is responsible. Free known disposable material, then recheck database writeability and create a fresh verified backup. Never run `docker compose down -v`, `docker volume prune`, or delete the only verified data copy.
5. A local-only backup cannot recover from loss of the host disk. Restore an encrypted off-host copy and rotate credentials if the host may be compromised.

## 6. Update or rollback failed

1. Record the deployed Git commit, image ID, backup file, and failure symptoms. Check migration/startup logs and health status.
2. If the problem is code-only, deploy the previous reviewed commit/image while keeping the same data volume, then verify the public site and booking flow. If the new release changed the database schema, review migration compatibility before rolling code back.
3. If data restoration is required, stop booking writes and follow the disposable-volume restore drill first. Reconcile reservations received since the backup; a restore can lose newer bookings.
4. After recovery, verify public HTTPS, admin bookings, uploaded images, Resend events, and backups. Document the cause and preventive action.

## Current laptop-specific checks

```powershell
cd 'C:\Users\Kovács Márk\Desktop\Ivett'
docker compose -f compose.yaml ps
docker compose -f compose.yaml logs --tail 100 web
Get-Service cloudflared
Get-ScheduledTaskInfo -TaskName 'Ivett Reservation Backup'
curl.exe -I https://www.ivettkovacspmu.hu/api/catalog
```

Docker Desktop currently starts after Windows user sign-in, and a sleeping laptop cannot serve the site. If the Windows tunnel service is stopped, use the administrator repair steps in `DEPLOYMENT_TECHNICAL.md` and `scripts/repair-tunnel-service.ps1`. For a permanent takeover, move the service and backups to the provider host, set Docker to start at boot, and monitor from outside that host.
