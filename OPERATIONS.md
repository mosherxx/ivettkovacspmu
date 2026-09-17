# Ivett Kovacs PMU

Hungarian-first bilingual website with a persistent appointment database.

## Opening booking

1. Admin access uses ChatGPT sign-in, with the email verified against the hosted `ADMIN_EMAIL` setting (currently `ivettkovacs5@gmail.com`). Site sharing access is separate; this initial publication is private to the site owner.
2. Open `/admin`, set treatment durations, and add date-specific availability windows. All times use Europe/Budapest.
3. Clients choose a treatment, date and available start time. Pending bookings immediately reserve the full treatment duration. Atomic database insertion prevents overlapping reservations.
4. Confirm, cancel or complete requests from the admin page. Cancellation releases the slot. Closing an availability window leaves existing bookings intact.
5. Confirmations and cancellations do not send automatic email or SMS. Contact the client using the displayed links.

## Content and launch

- Prices were transcribed from the supplied price list.
- Contact information was supplied by the owner.
- Introductory copy is a draft for approval; no certifications or years of experience are claimed.
- Hero image is AI-generated illustrative artwork and is visibly labelled. Actual portfolio work links to the artist's Instagram; original work photographs can replace this arrangement when supplied.
- Booking remains unavailable until durations and availability are configured.
- The .hu domain has not been purchased or connected.
- Before public launch, confirm the introduction, business/privacy information, and site access settings.

## Local development

Use `npm run dev`. Generate database migrations with `npm run db:generate`; `npm run build` creates Worker output. Apply new migration files only once to local D1 as described in the starter README. Production migrations are applied through Sites publication. Never rewrite applied migrations.

## Verification

Production build and TypeScript check passed. Local endpoint checks verified empty availability and denied unauthorized admin access. SQLite tests verified successful insert, overlapping/duplicate rejection, adjacent booking, window boundaries, start-time alignment, and cancellation releasing availability. No live client reservations were created by the tests.
