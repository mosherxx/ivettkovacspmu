# Ivett Kovacs PMU

Hungarian-first bilingual website with a persistent appointment database.

## Opening booking

1. Admin access uses the initial username `admin` and password `admin`. The first login requires a new password of at least 12 characters before any management feature is accessible. Passwords are salted PBKDF2 hashes; sessions expire after eight hours. Five failed login attempts trigger a 15-minute lockout. Site sharing access is separate; publication remains private to the site owner.
2. Open `/admin`, set treatment durations, and add date-specific availability windows. All times use Europe/Budapest.
3. Clients choose a treatment, date and available start time. Pending bookings immediately reserve the full treatment duration. Atomic database insertion prevents overlapping reservations.
4. Confirm, cancel or complete requests from the admin page. Cancellation releases the slot. Closing an availability window leaves existing bookings intact.
5. Confirmations and cancellations do not send automatic email or SMS. Contact the client using the displayed links.

## Content and launch

- Prices were transcribed from the supplied price list.
- Contact information was supplied by the owner.
- Introductory copy is a draft for approval; no certifications or years of experience are claimed.
- Hero image is AI-generated illustrative artwork and is visibly labelled. The gallery stores uploaded work in R2, with captions and categories in D1. Visitors can filter by treatment and open a photo lightbox. No test photos are published.
- Booking remains unavailable until durations and availability are configured.
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
