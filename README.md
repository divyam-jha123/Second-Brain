# Brain Expo

**Save, organize, and share your web knowledge — your personal “second brain”, reimagined.**

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black)](#deployment) [![Backend](https://img.shields.io/badge/Backend-Render-5B2EFF)](#deployment) [![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF)](#ci)

## Live demo

- **Frontend**: `https://brainexpo.me/`
- **Backend API**: `https://second-brain-miuh.onrender.com/`

## Screenshots

- **Landing**: `https://github.com/divyam-jha123/Second-Brain/blob/main/docs/screenshots/landingPage.png`
- **Dashboard**: `https://github.com/divyam-jha123/Second-Brain/blob/main/docs/screenshots/dashboard.png`
- **Share flow**: `https://github.com/divyam-jha123/Second-Brain/blob/main/docs/screenshots/share.png`

## Features

- **Auth & onboarding**
  - Email/password + social sign-in via Clerk
  - Protected routes for authenticated users
- **Content capture**
  - Create notes with a title + link/content
  - Supports common content types (Tweets, YouTube, Docs, LinkedIn)
- **Organize & browse**
  - Filter notes by type (All / Tweets / Videos / Docs)
  - Card-based UI with preview + expanded modal
- **Share**
  - Generate a share link to view a read-only dashboard
- **Developer experience**
  - Separate CI pipelines for frontend and backend
  - Unit/component tests (frontend) + integration-style route tests (backend)
- **Browser extension**
  - Save titles and links directly from any browser tab
- **Email notifications**
  - Welcome emails, weekly updates, and feature announcements via a dedicated email service

## Tech stack

### Frontend

- **React 19** + **TypeScript**
- **Vite** (build/dev)
- **React Router**
- **Tailwind CSS**
- **Vitest + Testing Library** (tests)

### Backend

- **Node.js** + **Express** + **TypeScript**
- **MongoDB** via **Mongoose**
- **CORS** (restricted allowlist support)
- **Vitest + Supertest** (tests)

### Auth

- **Clerk**
  - `@clerk/react` (frontend)
  - `@clerk/express` (backend middleware)

## Architecture overview

1. **Frontend (Vercel)** serves the SPA and handles routing (`/sign-in/*`, `/sign-up/*`, `/dashboard`, `/share/:hash`).
2. **Clerk** handles authentication UI and issues a session token.
3. **Frontend → Backend** requests include `Authorization: Bearer <token>` obtained from Clerk.
4. **Backend (Render)** verifies auth via Clerk middleware and reads/writes data in **MongoDB**.

## Folder structure

```txt
brainexpo/
├─ brainly-frontend/
│  ├─ src/
│  ├─ public/
│  ├─ index.html
│  └─ vercel.json
├─ brainly-backend/
│  ├─ src/
│  │  ├─ routes/
│  │  ├─ models/
│  │  └─ middlewares/
│  └─ tests/
├─ brainly-extension/
│  ├─ src/
│  └─ public/
└─ .github/
   └─ workflows/
```

## Installation & local setup

### Prerequisites

- **Node.js 20+** — check with `node -v`
- **npm** — comes with Node

> **Zero external services needed for local dev.** Clerk auth keys are pre-filled in `.env.example`. MongoDB is also optional — if you leave `MONGO_URI` blank, the server automatically starts an in-memory MongoDB (data resets on restart). Only a real MongoDB connection is needed for production.

### Step 1 — Clone the repo

```bash
git clone <your-repo-url>
cd brainexpo
```

### Step 2 — Set up the backend

```bash
cd brainly-backend
npm install
cp .env.example .env
```

The `.env.example` file is ready to use as-is for local development — no changes needed. If you want data to persist between restarts, open `brainly-backend/.env` and add your MongoDB connection string:

```bash
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/brainly
```

Otherwise, just start the server — it will use an in-memory database automatically:

```bash
npm run build
npm run dev
```

✅ Backend is now running at `http://localhost:8000`

### Step 3 — Set up the frontend

Open a **new terminal**:

```bash
cd brainly-frontend
npm install
cp .env.example .env
npm run dev
```

No extra config needed — the Clerk publishable key and backend URL are already set in `.env.example`.

✅ Frontend is now running at `http://localhost:5173`

### Step 4 — (Optional) Set up the browser extension

```bash
cd brainly-extension
npm install
cp .env.example .env
npm run dev
```

### You're all set! 🚀

Open `http://localhost:5173` in your browser to see the app.

### Troubleshooting

| Problem | Fix |
|---|---|
| App data lost on restart | Set `MONGO_URI` in `brainly-backend/.env` to use a real MongoDB instance for persistence |
| Clerk sign-in not working | The test keys only work in development mode — don't use them in production |
| CORS errors in browser console | Ensure `CORS_ORIGINS=http://localhost:5173` is set in `brainly-backend/.env` |

## API endpoints

Base URL: `https://second-brain-miuh.onrender.com`

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/notes` | ✅ | List notes for current user |
| GET | `/notes/:id` | ✅ | Fetch a note by id |
| POST | `/notes/create-note` | ✅ | Create a note (`{ title, link }`) |
| DELETE | `/notes/:id` | ✅ | Delete a note |
| POST | `/notes/share` | ✅ | Create/remove share link (`{ share: true/false }`) |
| GET | `/notes/api/share/:hash` | ❌ | Read-only shared notes by hash |
| POST | `/user/sync` | ✅ | Upsert user profile (`{ username, email }`) |

## CI

GitHub Actions workflows are split by deployment target:

- `/.github/workflows/frontend-ci.yml`
- `/.github/workflows/backend-ci.yml`

Local equivalents:

```bash
cd brainly-frontend && npm run ci
cd ../brainly-backend && npm run ci
```

## Deployment

### Frontend (Vercel)

- **Root directory**: `brainly-frontend`
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **SPA rewrites**: handled by `brainly-frontend/vercel.json` (required for Clerk routes like `/sign-up/verify-email-address`)

### Backend (Render)

- **Root directory**: `brainly-backend`
- **Build command**: `npm ci && npm run build`
- **Start command**: `npm start`
- **Env**: set `MONGO_URI`, `CLERK_SECRET_KEY`, and `CORS_ORIGINS`


## Future improvements

- Add proper request validation (zod / yup) and consistent error responses
- Add pagination/search for notes
- Add tags and tag filtering (backend + UI)
- Add E2E tests (Playwright)
- Add rate limiting + request logging

## Contributing

Contributions are welcome.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-change`
3. Run checks locally:

```bash
cd brainly-frontend && npm run ci
cd ../brainly-backend && npm run ci
```

4. Open a PR with a clear summary and screenshots (for UI changes)



