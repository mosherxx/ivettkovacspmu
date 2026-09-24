# Ivett Kovacs PMU

Hungarian-first bilingual website with a persistent appointment database.

## Opening booking

1. Admin access uses the initial username `admin` and password `admin`. The first login requires a new password of at least 12 characters before any management feature is accessible. Passwords are salted PBKDF2 hashes; sessions expire after eight hours. Five failed login attempts trigger a 15-minute lockout. Site sharing access is separate; publication remains private to the site owner.
2. Open `/admin`, review treatment durations and weekly working hours. All times use Europe/Budapest.
3. Clients choose a treatment, date and available start time. Pending bookings immediately reserve the full treatment duration. Atomic database insertion prevents overlapping reservations.
4. Confirm, reject, cancel or complete requests from the admin page. Cancellation and rejection release the slot, except where an unavailable/vacation block applies. Blocks do not cancel existing bookings; conflicting reservations are highlighted.
5. Confirmation, cancellation and rejection create durable email notifications and attempt sending through Resend when configured. Without configuration, contact clients directly; the admin displays queued notifications.

## Content and launch

- Prices were transcribed from the supplied price list.
- Contact information was supplied by the owner.
- Introductory copy is a draft for approval; no certifications or years of experience are claimed.
- The About section uses the owner-supplied profile.jpg with CSS feathered edges. The hero uses the original, labelled illustrative beauty image. The gallery stores uploaded work in R2, with captions and categories in D1. Visitors can filter by treatment and open a photo lightbox. The 15 supplied portfolio images are seeded into the gallery by migration; no test photos are published.
- Default booking hours are Monday–Friday 09:00–17:00 (approved by the owner). Provisional durations: PMU 180 minutes, consultation 60, correction 90, refresh 120. Existing saved durations are preserved; review these in admin.
- The .hu domain has not been purchased or connected.
- Before public launch, confirm the introduction, business/privacy information, and site access settings.

## Local development

Use `npm run dev`. Generate database migrations with `npm run db:generate`; `npm run build` creates Worker output. Apply new migration files only once to local D1 as described in the starter README. Production migrations are applied through Sites publication. Never rewrite applied migrations.

## Verification

Production build and TypeScript check passed. Local endpoint checks verified empty availability and denied unauthorized admin access. SQLite tests verified successful insert, overlapping/duplicate rejection, adjacent booking, window boundaries, start-time alignment, and cancellation releasing availability. No live client reservations were created by the tests.

## Gallery, FAQ and intake

- Admin tabs cover bookings/availability, gallery uploads and captions, bilingual FAQ editing, and password changes.
- Gallery accepts JPG, PNG, or WebP files up to 10 MB; browser upload removes metadata and converts to JPEG, preserving up to 4000 pixels on the longest edge. Hide a photo without deleting it by unchecking visibility.
- FAQ entries can be edited, reordered, added, or hidden in both languages.
- Booking requires name, email, phone and a previous-treatment answer; a yes answer requires details. Referral source is optional. All answers are stored with the booking and visible only to admin. Existing reservations are retained with history marked not recorded.
- Password changes revoke all sessions. The hosted ADMIN_INITIAL_HASH only initializes an absent admin account and never overrides a changed password.
- Local integration checks passed for login/password rotation, session restrictions, gallery upload/edit/hide, FAQ visibility, required intake fields, concurrent overlap prevention, cancellation and logout. Browser checks verified the photo overlay and gallery admin controls.

## Services, contact settings and translation

- Services & prices supports adding treatments and editing names, descriptions, HUF prices, durations, order and visibility. Hidden treatments cannot receive new bookings. Their historical reservations and gallery associations remain intact.
- Settings includes address, email, telephone and Instagram username. Public contact links and booking contact references read these saved values. The eight FAQ questions and both language versions were supplied by the owner on 23 September 2026. They remain editable in admin. Saved versions of the former placeholder FAQs are hidden rather than deleted.
- Availability follows weekly working hours plus optional extra opening windows. Full-day or partial-day blocks override both. Pending reservations hold the treatment duration until confirmed, rejected or cancelled.
- New bookings retain their quoted price and Hungarian service name. Changed prices require the client to review and resubmit; previous bookings are not repriced. Older bookings without a stored quote display no inferred historical amount.
- English fields are optional. With the hosted secret `DEEPL_API_KEY` configured, empty English service fields, photo captions and FAQ fields translate from Hungarian on save. Free keys ending in `:fx` use api-free.deepl.com; other keys use api.deepl.com. The key never goes to the browser. Only public content is translated; client booking data is never sent to the translation provider.
- Without a translation key, untranslated content falls back to Hungarian. Changing Hungarian content clears its previous English field so stale translations are not retained. Provider failure preserves the form and fails the save rather than silently claiming translation succeeded. Existing untranslated items are translated when saved again after connection.
- Automatic translation has not been enabled or tested against a live provider because no API key was supplied. Integration was checked against DeepL's official request-translation API documentation.
- Local tests passed for catalog authorization, adding/updating/hiding services, duration propagation, availability reasons, stale-price rejection, quote persistence, contact validation/propagation and Hungarian-only FAQ saving. TypeScript and production build passed.

## Resend setup and notification behavior

Configure server-side secrets `RESEND_API_KEY` and `RESEND_FROM` (for example `Ivett Kovacs PMU <appointments@your-verified-domain.hu>`) through Sites. Verify the sender domain in Resend first. The contact Gmail address is used as reply-to, not as an unverified sender. No credentials have been supplied and no real email was sent during development.

Notifications are created atomically with status transitions. The database keeps each event and its immutable request payload. A failed attempt does not undo the booking action. The admin can retry queued/failed sends; accepted means Resend accepted the request, not proof of delivery. Review bounces/delivery in Resend. There is no background retry scheduler. Once Resend is configured, use the retry control for any still-relevant queued messages. Superseded events are not sent.

Retries use the same provider idempotency key. After 23 hours from an uncertain first attempt, retry stops for manual provider review rather than risking duplicate mail beyond Resend's idempotency window. A short send lease prevents simultaneous sends and status changes during an active attempt. Emails include appointment details in the client's selected language and never previous-treatment or referral answers.

Latest local checks passed: weekday defaults, closed weekends, concurrent booking rejection, pending holds, confirmation guards, cancellation/rejection release, block precedence, unblock, authorization and notification queue creation. Admin UI verified in the local browser. Live Resend delivery is not tested without credentials.

## Hosting options and supplied photographs

See SELF_HOSTING.md for the GitHub Pages brochure build and full Docker deployment. The accidental `zala` directory rename was verified byte-for-byte against the tracked scripts and restored to `scripts`. Originals remain in the ignored local `photos` directory; published copies are in `public/photos`. Category counts: 11 hair, 3 powder, 1 lips. Gallery/category and lightbox transitions respect reduced-motion preferences.

### Operator-assisted password recovery

If email delivery is unavailable, an authorized deployment operator can set the secret `ADMIN_PASSWORD_RESET` to a JSON object containing a fresh UUID `id` and a PBKDF2 `hash` in the existing application format. Never commit the password, hash, or secret value. Deploy, then visit the admin page or sign in to apply it. The reset is applied transactionally once per ID, clears lockout and reset links, and invalidates existing sessions. After verifying sign-in, remove the secret and redeploy the same saved version. Reusing an applied ID does not change the password again.
