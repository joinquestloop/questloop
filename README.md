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
