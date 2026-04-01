# BC WildWatch (MERN-style campus safety app)

BC WildWatch is a campus reporting web app where students can submit wildlife and danger sightings (snakes, bees, fires, etc.) and immediately inform the campus community.

## Core behavior

- **Student login with campus Microsoft email** via a dedicated login screen.
- **Severity routing**:
  - **High** → security (WhatsApp/SMS queue)
  - **Low/Medium** → faculty queue
- **Campus-wide visibility** of reports to increase awareness.
- **Anonymous student view** for privacy.
- **Faculty/Admin identity visibility** so staff can follow up with reporters.

## Tech notes

This implementation keeps the app fully JavaScript/TypeScript + React + Node style and is structured for MERN migration:

- React/Next.js UI (client-driven dashboard)
- Node-based API routes for auth/session/reporting
- Data layer abstraction in `lib/store.ts` (currently file-backed, replaceable with MongoDB)

## Environment variables

Create `.env.local`:

```bash
MICROSOFT_TENANT_DOMAIN=bcwildwatch.edu
SESSION_SECRET=replace-with-long-random-secret
FACULTY_EMAILS=faculty1@bcwildwatch.edu,faculty2@bcwildwatch.edu
ADMIN_EMAILS=admin@bcwildwatch.edu
TWO_FACTOR_ISSUER=BC WildWatch
```

## Two-factor authentication (no Entra dependency)

- Login is now a 2-step flow: campus email + authenticator TOTP code.
- On first sign-in, each campus email gets a unique setup key.
- Add the setup key to an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.) and enter the generated 6-digit code.
- 2FA secrets are stored in `data/two-factor-users.json` for this project.

## Run

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:3000`.
