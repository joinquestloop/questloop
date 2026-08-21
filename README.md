# QuestLoop landing page

The first landing page for [questloop.app](https://questloop.app).

> Join a quest. Make progress. Share proof. Repeat.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase

Copy `.env.example` to `.env.local` and add the project URL and browser-safe
publishable key. Never put a secret key, service-role key, or database password
in a `NEXT_PUBLIC_` variable.

The shared browser client is available from `lib/supabase.ts` for authentication
and public app data. The production project's browser-safe URL and publishable
key are included directly because they are public configuration and this avoids
Cloudflare build-variable formatting issues. Privileged keys must never be added
there.

## Production build

```bash
npm run build
```

## Deploy to Cloudflare

Connect the GitHub repository in Cloudflare Pages with these settings:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist/pages`
- Environment variable: `NODE_VERSION=22.13.0`

The build produces a static Pages bundle, so the first release stays fast and needs no server runtime.

The early-access form sends signups to the QuestLoop Early Access form in Loops and includes clear loading, success, and retry states.
