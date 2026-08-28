<h1 align="center">
  <img src="brainly-frontend/src/assets/brand/brain-expo-logo.svg" alt="" width="40" height="40" />
  &nbsp;Brain Expo
</h1>

<p align="center"><em>Knowledge you actually use.</em></p>

<p align="center">
  Brain Expo captures everything you read, watch and save — then tags,
  organizes and surfaces it exactly when you need it.
</p>

---

## What is Brain Expo?

Most of what you find online is lost the moment you close the tab. Bookmarks pile
up unread, good articles disappear into a sea of open windows, and the tweet you
half-remember from six months ago is effectively gone.

Brain Expo is a **second brain for the web**: a personal library where every link,
tweet, video, PDF and note you save is stored in one place, automatically
organized, and searchable long after you forgot you saved it.

### What it helps you do

- **Capture anything, instantly.** Links, tweets, YouTube videos, docs and your own
  notes — saved from anywhere on the web, without breaking your flow.
- **Find it again.** Everything is tagged and indexed, so a half-remembered phrase
  is enough to pull up the exact item months later.
- **Keep it organized without effort.** Group saves into collections, rename or
  merge tags, and let the structure grow as your library does.
- **Clip while you browse.** The Chrome extension drops the page you're reading
  straight into your library in one click.
- **Share what you've gathered.** Publish a collection, a tag, or a hand-picked set
  of items as a public link — ideal for research handoffs, reading lists and team
  knowledge. Links are scoped and revocable.
- **Revisit, not just collect.** A weekly digest email turns your saved-and-forgotten
  pile into things you actually come back to.

---

## How it's built

Brain Expo is a monorepo with three deployable pieces:

| Directory | What it is | Stack |
| --- | --- | --- |
| `brainly-frontend/` | The web app — landing page, dashboard, settings, shared views | React 19, Vite, TypeScript, Tailwind CSS v4, React Router, Motion, Clerk |
| `brainly-backend/` | The REST API — notes, collections, tags, sharing, email | Node, Express 5, TypeScript (ESM), Mongoose / MongoDB, Clerk, Resend, node-cron |
| `brainly-extension/` | The Chrome clipper — saves the current tab | React 19, Vite, TypeScript, Manifest V3 |

**Auth** is handled end-to-end by [Clerk](https://clerk.com): the frontend and the
extension send a session token, and every protected API route resolves the user
from that session only — an id in a request body is never trusted.

**Data model** (MongoDB via Mongoose):

- `Notes` — a saved item: title, content/URL, user annotation, tags, optional
  collection, derived `sourceDomain`. Indexed by `(userId, createdAt)` and
  `(userId, tags)` for the dashboard's two access patterns.
- `Collection` — a named group, unique per user.
- `Link` — a share link: a unique `hash` plus a `scope` of `all`, `collection`,
  `tag` or `items`. Revoking is a soft delete so a killed hash is never reissued.
- `User` — Clerk id, profile, onboarding topics.
- `EmailPreference` — digest opt-in, sections, day/hour, timezone, unsubscribes.

**Email** goes out through Resend, with a `node-cron` job that sends the weekly
digest every Monday at 09:00 UTC to subscribed users. Unsubscribe links are
signed with `UNSUBSCRIBE_SECRET` and work without a session.

### API surface

```
POST   /user/sync                 Create or update the local user from Clerk
GET    /user/me                   Current user
POST   /user/onboarding           Save onboarding topics

GET    /notes                     List (newest first, filterable)
POST   /notes                     Create
GET    /notes/:id                 Read one
PATCH  /notes/:id                 Update
DELETE /notes/:id                 Delete

POST   /notes/share               Create a scoped share link
GET    /notes/share               List your share links
DELETE /notes/share/:hash         Revoke a share link
GET    /notes/api/share/:hash     Public — resolve a share link

GET    /collections               List
POST   /collections               Create
PATCH  /collections/:id           Rename / reorder
DELETE /collections/:id           Delete

GET    /tags                      List with counts
PATCH  /tags/:name                Rename (merges on collision)
DELETE /tags/:name                Remove from all notes

GET    /email/preferences         Read digest preferences
PUT    /email/preferences         Update
POST   /email/send-now            Send yourself a digest immediately

POST   /unsubscribe               Public — one-click unsubscribe
```

---

## Running it locally

**Requirements:** Node 20+, npm, and a Clerk application. MongoDB is optional in
development — with no `MONGO_URI` the backend spins up an in-memory instance
automatically (it fails fast instead in production).

```bash
git clone <this-repo>
cd Second-Brain
```

### Backend

```bash
cd brainly-backend
npm install
npm run dev          # builds with tsc, then runs dist/index.js
```

`brainly-backend/.env`:

```env
PORT=8000
MONGO_URI=              # optional in dev; required in production
CLERK_SECRET_KEY=
RESEND_API_KEY=
EMAIL_FROM=
UNSUBSCRIBE_SECRET=
CORS_ORIGINS=           # optional comma-separated allowlist
```

### Frontend

```bash
cd brainly-frontend
npm install
npm run dev          # Vite dev server on :5173
```

`brainly-frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=
VITE_EXTENSION_ID=
```

### Extension

```bash
cd brainly-extension
npm install
npm run build
```

Then load `brainly-extension/dist` as an unpacked extension at
`chrome://extensions` (Developer mode → Load unpacked).

`brainly-extension/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
```

---

## Tests & CI

```bash
# backend — Vitest + supertest against mongodb-memory-server
cd brainly-backend && npm run test        # watch
cd brainly-backend && npm run ci          # build + tests with coverage

# frontend — Vitest + Testing Library (jsdom)
cd brainly-frontend && npm run test       # watch
cd brainly-frontend && npm run ci         # lint + build + tests with coverage
```

GitHub Actions runs both suites on pull requests and on pushes to `main`, each
workflow scoped by path so a frontend change doesn't rebuild the backend
(`.github/workflows/backend-ci.yml`, `frontend-ci.yml`).

---

## Repository layout

```
Second-Brain/
├── brainly-backend/
│   └── src/
│       ├── app.ts            Express app + route mounting
│       ├── index.ts          Boot: DB connect, share-scope backfill, cron
│       ├── routes/           notes, collections, tags, user, email, unsubscribe
│       ├── models/           notes (Notes + Links), collection, user, emailPreference
│       ├── services/         emailService, emailPreferences
│       ├── emails/           welcome, weeklyDigest, featureAnnouncement templates
│       ├── middlewares/      Clerk auth
│       └── cron/             weeklyDigest
├── brainly-frontend/
│   └── src/
│       ├── components/       landing, dashboard, sidebar, cards, modals, settings
│       ├── pages/            settings, admin, unsubscribe
│       ├── assets/brand/     logo
│       └── hooks, lib, theme, icons
├── brainly-extension/
│   └── src/                  popup views (login, save), api + auth utils
└── .github/workflows/        backend-ci, frontend-ci
```

---

© 2026 Brain Expo Inc. All rights reserved.
