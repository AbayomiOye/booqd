# Booqd

Nigeria’s beauty booking platform. Next.js 16, React 19, Prisma, Supabase Postgres and Tailwind CSS.

## Connect Supabase

Project: https://supabase.com/dashboard/project/wjufuurljgdrhayvxgqd?showConnect=true

1. Copy `.env.example` to `.env`. Fill `DATABASE_URL` with the transaction pooler connection (6543), and `DIRECT_URL` with the session pooler connection (5432). Copy the exact host from Supabase; percent-encode special characters in the database password. The HTTPS project URL is not a database credential.
2. Generate `JWT_SECRET` with `openssl rand -hex 32`. Keep all database credentials server-side and out of Git.
3. Run `npm ci`, then `npm run db:deploy` on a **new, empty Booq’d database**. These Prisma migrations manage only the app’s public tables, not Supabase Auth/Storage.
4. Run `npm run db:check` to verify storage, retrieval, cancellation, RLS and grants. Its test rows are rolled back. Node 20.9+ is required for the `--env-file` scripts.
5. Run `npm test`, `npm run build`, and `npm run dev`.

If the database already has Booq’d tables, inspect its schema and back up the data before deployment. If it exactly matches the original schema, baseline with `npx prisma migrate resolve --applied 20261006193000_initial`, then deploy the booking-details migration. Do not baseline an unknown schema. Existing bookings receive snapshots from their current services; invalid existing durations or prices must be corrected before migration.

For Vercel, configure the same environment variables in project settings and run `db:deploy` from a controlled release environment before shipping the new application. Next.js reads `.env`; Prisma CLI does not automatically read `.env.local`.

## Booking behavior

Bookings save client, provider and service IDs, start/end times, status, and the service name, price and duration at booking time. Times are interpreted and displayed in `Africa/Lagos` (WAT). A transaction locks the provider row while checking overlaps and creating the appointment, preventing simultaneous API requests from booking the same provider interval. Closed bookings cannot be revived.

Signed-in customers can retrieve their bookings at `/bookings` and cancel active bookings. Providers retrieve their appointments in `/provider` and confirm, decline or complete them. API access is restricted by verified sessions and current database roles. JWT secrets must have at least 32 characters.

The app retains its own account system; Supabase supplies Postgres. Browser `anon` and `authenticated` roles have no direct table privileges, and RLS is enabled on all app tables. Database access through Prisma uses a trusted server database role; never put its connection string in a `NEXT_PUBLIC_` variable. A Supabase publishable key alone cannot operate this integration.

## Before public launch

- Keep dependency advisories under review with `npm audit`. Next.js, React and Tailwind have been upgraded, with the resolved dependency audit verified during this change.
- Run `npm run build` then `npm run test:e2e` for Playwright coverage of customer bookings, provider status changes, account isolation, forged cookies and simultaneous booking conflicts. Build and development scripts use Webpack. The suite uses the installed Google Chrome (`channel: chrome`) and a local production server on port 3100. It creates unique disposable Supabase fixtures and cleans only those records; use a test project for routine CI. Screenshots are captured for desktop and mobile booking history.
- Add rate limiting for login, registration and booking endpoints; email verification/password recovery; and monitoring/backups appropriate to the release.
- Demo data uses known passwords. Seed only a disposable development database with `ALLOW_DEMO_SEED=true npm run db:seed`; production seeding is blocked.

UI upgrades add live service availability, a booking review step, accessible search/location/budget/category filters, upcoming/past booking history, saved weekly provider hours and a provider calendar. Availability returns only time slots, never customer details. Booking creation validates the saved schedule inside the existing provider lock. Changing hours does not alter existing appointments.

Run the 13 Playwright scenarios with `npm run test:e2e`. To verify an already deployed site, set `PLAYWRIGHT_BASE_URL=https://booqd-wine.vercel.app` when running that command. The suite still uses the database from `.env` for its disposable fixtures, so it must match the deployed project.

Payments, notifications, review collection and portfolio uploads are not implemented. Portfolio displays use actual saved images or clearly neutral placeholders.


## Admin activity dashboard

`/admin` is restricted to current database `ADMIN` roles, with the same gate on `/api/admin/overview`. It shows accurate all-time totals, booking statuses, completed service value (not collected revenue), a 14-day booking trend, and searchable/paginated activity, bookings, providers and users. Activity records start with this release and record successful sign-ins, registrations, booking requests/status changes, service changes and working-hour edits. Mutation logs are written in the same transaction as the change. Passwords/hashes/tokens are never included in the dashboard payload.

The designated administrator must register with her own password. After the platform owner confirms she controls that account, use `node --env-file=.env scripts/grant-admin.cjs "confirmed-admin@example.com"`, substituting the confirmed account email. This grants an existing account the ADMIN role without changing its password. Public registration never grants admin access based on an email or requested role.
