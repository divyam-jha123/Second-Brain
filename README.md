# Brain Expo

**Save, organize, and share your web knowledge — your personal “second brain”, reimagined.**

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black)](#deployment) [![Backend](https://img.shields.io/badge/Backend-Render-5B2EFF)](#deployment) [![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF)](#ci)

## Live demo

- **Frontend**: `https://brainexpo.me/`
- **Backend API**: `https://second-brain-miuh.onrender.com/`

## Screenshots

- **Landing**: `docs/screenshots/landingPage.png`
- **Dashboard**: `docs/screenshots/dashboard.png`
- **Share flow**: `docs/screenshots/share.png`

## Features

- **Auth & onboarding**
  - Email/password + social sign-in via Clerk
  - Protected routes for authenticated users
- **Content capture**
  - Create notes with a title + link/content
  - Supports common content types (Tweets, YouTube, Docs)
- **Organize & browse**
  - Filter notes by type (All / Tweets / Videos / Docs)
  - Card-based UI with preview + expanded modal
- **Share**
  - Generate a share link to view a read-only dashboard
- **Developer experience**
  - Separate CI pipelines for frontend and backend
  - Unit/component tests (frontend) + integration-style route tests (backend)

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
└─ .github/
   └─ workflows/
```

## Environment variables

### Frontend (`brainly-frontend`)

Create `brainly-frontend/.env`:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_...
# Optional (defaults to the deployed Render backend or localhost depending on config)
VITE_BACKEND_URL=https://second-brain-miuh.onrender.com
# Optional alias supported in some setups
VITE_API_URL=https://second-brain-miuh.onrender.com
```

### Backend (`brainly-backend`)

Create `brainly-backend/.env`:

```bash
PORT=8000
MONGO_URI=mongodb+srv://...

# Clerk (required)
CLERK_SECRET_KEY=sk_...

# CORS allowlist (comma-separated)
# Example:
# CORS_ORIGINS=https://brainexpo.me,https://www.brainexpo.me,http://localhost:5173
CORS_ORIGINS=
```

## Installation & local setup

### Prerequisites

- Node.js (recommended: **20+**)
- npm
- A MongoDB instance (local or Atlas)

### 1) Clone

```bash
git clone <your-repo-url>
cd brainexpo
```

### 2) Backend

```bash
cd brainly-backend
npm install
cp .env.example .env # if you have one; otherwise create .env manually
npm run build
npm run dev
```

Backend runs on `http://localhost:8000` (or your `PORT`).

### 3) Frontend

```bash
cd ../brainly-frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

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

## License

This project is currently **unlicensed**. If you want to open-source it, add a `LICENSE` file (MIT is a common choice).

