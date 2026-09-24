# Hosting Ivett Kovacs PMU

Two builds share the same design, photos, Hungarian/English content and service list.

| | GitHub Pages | Docker |
|---|---|---|
| Services, prices, biography, contact, FAQ | Yes | Yes |
| Category gallery and enlarged photos | Yes | Yes |
| Reservations and availability | No; buttons lead to contact details | Yes |
| Admin editing and uploads | No | Yes |
| Stored data | Content committed in the repository | SQLite and uploaded files in a Docker volume |

## GitHub Pages

1. Push this project into your GitHub repository. Keep `.env`, database files and local test data out of Git; the supplied ignore files already exclude them.
2. In repository Settings → Pages, choose **GitHub Actions** as the publishing source.
3. Run **Publish brochure to GitHub Pages** from Actions. The workflow calculates the repository base path, builds and publishes `out/pages`.

Local build: `npm ci` then `npm run build:pages`.
For a project URL such as `https://owner.github.io/ivett/`, build with `PAGES_BASE_PATH=/ivett/ npm run build:pages`. Use `/` for a custom domain or an account-level Pages site. The workflow handles this automatically from the Pages configuration.

The static build uses `lib/services.ts`, `lib/catalog.ts`, `lib/content.ts`, `lib/portfolio.ts` and `public/photos`. Changes made through Docker or Sites admin are **not automatically copied into GitHub Pages**. Update the source content and rerun the workflow. Pages has no admin, reservations, API server, email credentials or client booking records.

The purchased domains are `www.ivettkovacspmu.hu` (primary) and `www.ivettkovacspmu.com` (redirect). See DOMAIN_SETUP.md for the DNS and Pages configuration.

## Docker: full website

Install Docker Engine with Compose, then run from the project directory:

```sh
docker compose up -d --build
```

Open `http://localhost:3000`. Admin is at `/admin`; initial login is **admin / admin**, with mandatory password change. Existing passwords survive rebuilds. The container runs as an unprivileged user.

The database, reservation history, edited services/FAQ/contact details and uploaded images live in the `ivett-data` named volume, mounted at `/data`. Migrations run transactionally on first database use, and are tracked so restarts do not reapply them. Run a single application instance with this volume. Do not use `docker compose down -v` unless you intend to erase the data.

For remote access, put an HTTPS reverse proxy on the same host in front of `127.0.0.1:3000`. Set `PUBLIC_ORIGIN=https://your-domain.hu` in your local `.env`. This exact origin is used for request protection and secure session cookies. The default port binding is local-only so the initial setup is not exposed before you configure it. The standalone server does not inherit the private Sites access gate: once your proxy exposes it, its public website is reachable, while `/admin` still requires the app's login.

Optional `.env` settings:

```dotenv
PUBLIC_ORIGIN=https://your-domain.hu
RESEND_API_KEY=
RESEND_FROM=
DEEPL_API_KEY=
```

Resend requires a verified sender and API key. DeepL enables automatic translation for newly edited public content. Secrets are supplied at runtime, excluded from the image, and never sent to the static site. The existing Sites database and uploads are not migrated into Docker automatically; a fresh container starts with the source content and these 15 supplied gallery photos.

### Backup and updates

Stop the web container before taking a consistent backup of the entire `ivett-data` volume (database, WAL files and uploads together); restart after backing up. Restore into an empty volume with ownership writable by the image's `node` user. Back up before applying updates, then rerun `docker compose up -d --build`. Keep backups outside the Docker host.

### Validation

The Pages build was checked under `/ivett/`. The production Next.js standalone build passed, and a disposable local instance was checked for automatic migrations, all supplied photos, FAQ, password rotation, authorization, origin protection, uploads/hiding, overlapping reservations, confirmation, cancellation, and persistence after process restart. Docker was not installed on the development computer, so the actual image/Compose launch still needs verification on a Docker host. Live email delivery still requires Resend configuration.

To repeat the API check against a **new disposable local instance only**:

```sh
python3 tests/docker-smoke.py http://localhost:3100
```

This test changes the disposable admin password and creates test data. Never run it against your working studio database.
