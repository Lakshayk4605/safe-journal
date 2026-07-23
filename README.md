# Safe Journal — Full Stack

An AI-powered journaling and wellness app: Next.js frontend + Express/TypeScript/
Prisma/PostgreSQL backend, fully wired together.

```
safe-journal/
  backend/    Express API — see backend/README.md and backend/REPORT.md
  frontend/   Next.js App Router UI — see frontend/lib/api/ for the API client layer
  docker-compose.yml   Runs the entire stack together
```

## How the frontend talks to the backend

- `frontend/lib/api-client.ts` — a typed `fetch` wrapper against the backend's REST
  API. Sends `credentials: 'include'` on every request so the backend's httpOnly
  auth cookies flow correctly, and auto-retries once through `/auth/refresh` on a
  401 so a page left open past the 15-minute access-token lifetime doesn't force a
  re-login.
- `frontend/lib/api/*.ts` — one typed module per backend resource (`auth`, `journal`,
  `mood`, `chat`, `reports`, `users`), each a thin wrapper returning the exact
  shapes the backend controllers send back.
- `frontend/lib/auth-context.tsx` — a React context holding the signed-in user,
  used by `app/(app)/layout.tsx` to gate every authenticated page (dashboard,
  journal, ai-chat, reports, settings) behind a session check, redirecting to
  `/auth/login` otherwise.
- `frontend/lib/mood-map.ts` — the frontend's `Mood` type is lowercase
  (`'excellent'`), the backend's Prisma enum is uppercase (`'EXCELLENT'`); this
  converts between them at the API boundary so the rest of the UI code is
  untouched.

## What changed structurally in the frontend

- **Route group added**: `app/dashboard/layout.tsx` (with the sidebar `<Navigation>`)
  previously only wrapped `/dashboard` — `/journal`, `/ai-chat`, `/reports`, and
  `/settings` had no sidebar at all. Moved all five into `app/(app)/` with one
  shared layout that renders the sidebar and enforces the auth guard everywhere it's
  needed. `(app)` is a route group — it doesn't appear in the URL.
- **`recharts`** was used in the reports page but missing from `package.json` —
  added it.
- **Voice journal recording** was fully simulated (a `setTimeout` toggling state) —
  replaced with real `MediaRecorder`/`getUserMedia` capture, uploaded to the
  backend's Cloudinary-backed endpoint on save.
- **AI Help button** on the new-entry page now actually requests an AI reflection
  from the backend at creation time and takes you to the entry so you can read it.
- **Share button** on entry detail copies the entry's URL to the clipboard (the
  backend has `isShared`/`shareToken` columns modeled but no public, unauthenticated
  viewing route implemented — flagging that gap rather than faking it).
- **Settings → Two-Factor Authentication / Active Sessions** are shown disabled
  with "coming soon" — the backend doesn't implement these (see backend/REPORT.md's
  flagged assumption), so they're honestly non-functional rather than faked.

## Running locally (without Docker)

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env        # fill in JWT/COOKIE secrets — see backend/README.md
npm install
npm run prisma:migrate:deploy
npm run dev                  # http://localhost:4000

# Terminal 2 — frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                  # http://localhost:3000
```

Open `http://localhost:3000`, sign up, and you're in — the signup call sets the
backend's httpOnly session cookies, which the frontend's `fetch` calls carry on
every subsequent request automatically.

## Running the full stack with Docker

```bash
cp backend/.env.example backend/.env   # fill in secrets first
docker compose up --build
```

This starts Postgres, Redis, the API (`http://localhost:4000`, runs
`prisma migrate deploy` automatically on boot), the BullMQ worker, and the
frontend (`http://localhost:3000`), all wired together. `NEXT_PUBLIC_API_URL` is
passed as a Docker build arg pointing at `http://localhost:4000/api/v1` — the
**host-reachable** address, not the internal `http://api:4000` docker-network
name, since `NEXT_PUBLIC_*` values are inlined into the browser bundle at build
time and the browser itself (not the frontend container) makes those calls.

`backend/docker-compose.yml` still exists separately if you want to run just the
backend (e.g. while developing the frontend against `npm run dev`).

## Known gaps (carried over honestly, not silently patched)

- No public/unauthenticated "shared entry" viewing page — the DB models `isShared`/
  `shareToken` but the frontend's Share button only copies the (auth-gated) URL.
- No 2FA, no session-listing/revocation UI.
- Cookie `SameSite=Strict` config assumes frontend and API share a registrable
  domain (true for `localhost:*` in dev, and for this docker-compose setup). If you
  deploy frontend and API on genuinely different domains in production, you'll need
  to either put both behind one reverse-proxy origin, or relax to `SameSite=None;
  Secure` on the backend's auth cookies.
