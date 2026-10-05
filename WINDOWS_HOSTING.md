# Hosting the reservation service on this Windows laptop

This is the full booking service, with SQLite data and uploaded gallery images in the Docker `ivett-data` volume. Docker publishes port 3000 only on `127.0.0.1`; Cloudflare Tunnel provides public HTTPS. Keep one web container attached to the data volume.

For architecture, deployment internals, update procedure, and detailed troubleshooting, see [DEPLOYMENT_TECHNICAL.md](DEPLOYMENT_TECHNICAL.md).

## 1. Host prerequisites

Install WSL 2 and Docker Desktop with the WSL 2 backend. WSL installation may need a Windows administrator and a restart. Start Docker Desktop once, accept its license, and wait until `docker info` succeeds. This laptop must remain powered, awake, connected to the Internet, and signed in for Docker Desktop to run. Configure Windows power settings accordingly. The supplied Compose file has `restart: unless-stopped` for both containers.

Docker Desktop is a desktop runtime, so this laptop is a single point of failure. Keep enough free disk space for Docker images, the live database, and backups; monitor it regularly.

## 2. Private setup first

In this directory, create or update the ignored `.env` file. Do not commit it. Set:

```dotenv
PUBLIC_ORIGIN=https://www.ivettkovacspmu.hu
RESEND_API_KEY=
RESEND_FROM="Ivett Kovacs PMU <foglalas@ivettkovacspmu.hu>"
ADMIN_RECOVERY_EMAIL=ivettkovacs5@gmail.com
TUNNEL_TOKEN=
```

Use the exact public hostname chosen in Cloudflare. The `RESEND_FROM` address must belong to a domain verified in Resend. Verify its DNS records before sending. Generate a Resend API key with sending permission and keep it private. The recovery email receives password reset links; it is separate from the public contact address.

Build and start only the web service at first:

```powershell
docker compose -f compose.yaml up -d --build web
docker compose -f compose.yaml ps
```

Open `http://127.0.0.1:3000/admin`. On a fresh Docker volume, sign in with `admin` / `admin` and immediately set a unique password of at least 12 characters. Existing data and passwords in other hosting systems do not transfer into this volume. Review the services, prices, durations, opening hours, blocks, contact details, gallery, FAQ, and legal pages before publishing the tunnel.

## 3. Cloudflare Tunnel and Resend

The domain's authoritative DNS must be in Cloudflare. Preserve existing mail, SPF, DKIM, MX, and verification records during a nameserver change. In Cloudflare, create a remotely managed tunnel and a published application route for the chosen hostname. Cloudflare creates the hostname routing record for the tunnel. Put its token in `.env` as `TUNNEL_TOKEN`.

The prepared Windows `cloudflared` service uses `http://127.0.0.1:3000` as the route's service URL, because it runs on the host. After changing the admin password and creating the route, run `scripts/install-tunnel-service.ps1` in an Administrator PowerShell window. It installs the verified Cloudflare binary as an automatic Windows service and starts it. No public inbound port is needed.

If the public site fails with HTTP 530 after a restart and `Get-Service cloudflared` shows `Stopped`, open PowerShell as Administrator in this project directory and run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\repair-tunnel-service.ps1`. This refreshes the service token from the private `.env` file and starts the automatic service. Then check `Get-Service cloudflared` and the public website.

The repository also has an optional containerized tunnel. If Docker Hub access is available, point its route to `http://web:3000` and start it with:

```powershell
docker compose -f compose.yaml -f compose.tunnel.yaml up -d
docker compose -f compose.yaml -f compose.tunnel.yaml ps
```

Test the HTTPS site in a private browser window, a test reservation, admin confirmation and cancellation, the request receipt and status emails, recovery email, and availability after cancellation. The request receipt explicitly says the appointment is still pending; the later admin action sends a separate confirmation. Do not send real client data while testing.

Resend uses a verified sender domain and SPF/DKIM records from its dashboard. Its API key and the tunnel token are secrets: keep them only in `.env` or another private secret store. A sender address does not create an incoming mailbox; customer replies go to the public contact address configured in the site.

## 4. Startup and backups

Run `scripts/register-startup.ps1` to add Docker Desktop to this user's Windows Startup folder. The Compose services restart automatically after Docker starts. This works after sign-in; a logged-out or sleeping laptop will not serve bookings.

Run `scripts/backup-windows.ps1` once while the web container is running, inspect the resulting `backups/ivett-data-*.tar.gz` and `.sha256`, then run `scripts/register-backup-task.ps1` to schedule it daily at 03:00. The script stops only the web container for a consistent archive, verifies the archive, and restarts the web container in a `finally` block. It retains local archives for 14 days. The scheduled task uses this Windows user and runs only while the user is signed in; missed runs start when available.

Local backups protect against accidental data changes but not loss of the laptop or its disk. Copy verified archives to an external drive or network location as soon as one is available. Keep a protected copy of `.env` in a password manager or encrypted backup, separately from the public repository. Test restoration into an isolated Docker volume before relying on backups.

## 5. Routine checks

```powershell
docker compose -f compose.yaml ps
docker compose -f compose.yaml logs --tail 100 web
Get-Service cloudflared
Get-ScheduledTask -TaskName 'Ivett Reservation Backup'
```

Back up before updating the application or Docker images. Do not run `docker compose down -v`, which removes the data volume. See [SELF_HOSTING.md](SELF_HOSTING.md) for the application's data model and recovery behavior.
