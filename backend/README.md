# Safe Journal — Backend API

Production-ready backend for the Safe Journal AI journaling application. Built with
Node.js, Express, TypeScript, PostgreSQL (Prisma), and a clean, layered architecture.

See `REPORT.md` for the full frontend reverse-engineering analysis this backend was
built against.

## Stack

- **Runtime:** Node.js 20, Express 4, TypeScript (strict)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT access tokens + rotating refresh tokens, HttpOnly cookies, bcrypt
- **Validation:** Zod
- **Uploads:** Cloudinary (via multer, in-memory)
- **Email:** Resend
- **Jobs/Queue:** BullMQ + Redis
- **Logging:** Pino
- **Docs:** Swagger / OpenAPI at `/docs`
- **Tests:** Jest + Supertest
- **Deploy:** Docker + Docker Compose

## Architecture

```
src/
  controllers/   HTTP handlers — parse req, call services, shape responses
  services/      Business logic, orchestration, transactions
  repositories/  Prisma data-access layer
  routes/        Express routers, wiring middleware + validation + controllers
  middlewares/   auth, roles, validation, rate limiting, errors, uploads
  validators/    Zod schemas per feature
  utils/         ApiError, ApiResponse, JWT, password hashing, pagination
  config/        env, logger, prisma client, redis, cloudinary, swagger
  interfaces/    shared TS types
  constants/     shared constants
  emails/        email HTML templates
  jobs/          BullMQ queues/workers
  tests/         Jest test suites
prisma/
  schema.prisma  full data model
  seed.ts        creates an admin + demo user with sample data
```

## Redis & Background Jobs

The core API (`npm run dev` / `npm start`) **never opens a Redis connection** —
only the separate background-jobs process does. This means:

- Redis is fully optional for local API development. If it's not running, the API
  starts and serves requests normally.
- To run background jobs (daily journal reminders, streak resets), start the worker
  as its own process: `npm run worker`. This is also wired up as its own `worker`
  service in `docker-compose.yml`.
- Each BullMQ `Queue`/`Worker` builds its own Redis connection from plain options
  (`src/config/redis.ts`) rather than sharing one live client instance — this is
  deliberate: sharing a live `ioredis` instance across packages is what causes
  TypeScript's "Type 'Redis' is not assignable to type 'ConnectionOptions'" error
  whenever more than one copy of `ioredis` ends up in the dependency tree. `package.json`
  also pins a single `ioredis` version tree-wide via `overrides` as defense in depth.

## Migrations

`prisma/migrations/20260101000000_init` is the baseline migration and matches
`schema.prisma` exactly. Run `npm run prisma:migrate:deploy` (or let
`docker-compose.yml`'s `api` service do it automatically on container start) to
apply it. For any future schema changes, use `npm run prisma:migrate` locally to
generate a new migration on top of this baseline.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# then fill in secrets — see "Generating secrets" below
```

### 3. Run with Docker (recommended — includes Postgres + Redis)

```bash
npm run docker:up
```

This builds the API image, starts Postgres + Redis, runs `prisma migrate deploy`,
then boots the server on `http://localhost:4000`.

### 4. Or run locally against your own Postgres/Redis

```bash
npm run prisma:migrate      # create the database schema
npm run prisma:seed         # optional: admin + demo user
npm run dev                 # starts on http://localhost:4000
npm run worker              # optional, separate process: starts BullMQ background jobs (requires Redis)
```

### Generating secrets

```bash
openssl rand -hex 32   # run 3x for JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, COOKIE_SECRET
```

### API docs

Once running, Swagger UI is available at `http://localhost:4000/docs`.

### Seeded accounts (after `npm run prisma:seed`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@safejournal.app` | `AdminPass123` |
| Demo user | `alex.chen@example.com` | `DemoPass123` |

### Running tests

```bash
npm test
```

Pure unit tests (password/JWT utils) run with no setup. The auth integration suite
in `src/tests/auth.test.ts` needs a real Postgres reachable via `DATABASE_URL` with
migrations applied — it auto-skips if the database isn't reachable.

## Environment Variables

See `.env.example` for the full list with defaults. Everything is validated on boot
via Zod (`src/config/env.ts`) — the server refuses to start with missing/invalid
config rather than failing confusingly later.

## Authentication Model

- **Access token:** short-lived JWT (default 15m), sent as an HttpOnly, Secure (in
  prod), SameSite=Strict cookie named `accessToken`. Also accepted via
  `Authorization: Bearer <token>` for non-browser clients.
- **Refresh token:** long-lived (default 30d), stored **hashed** in the
  `refresh_tokens` table, delivered as an HttpOnly cookie scoped to `/api/v1/auth`.
  Every refresh **rotates** the token (old one is revoked, pointing at the new one);
  presenting an already-revoked token revokes the entire token family for that user,
  which is the standard defense against refresh-token theft/replay.
- **Logout** revokes the presented refresh token. **Password change/reset** revokes
  *all* refresh tokens for that user.

## API Reference

All routes are prefixed with `/api/v1`. All responses share the shape:

```json
{ "success": true, "message": "...", "data": { }, "meta": { } }
```

Errors:

```json
{ "success": false, "message": "...", "code": "BAD_REQUEST", "details": [] }
```

### Auth — `/api/v1/auth`

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/signup` | Create account, sends verification email | Public (rate-limited) |
| POST | `/login` | Email/password login | Public (rate-limited) |
| POST | `/logout` | Revoke current refresh token, clear cookies | Required |
| POST | `/refresh` | Rotate refresh token, issue new access token | Refresh cookie |
| GET | `/verify-email?token=` | Confirm email address | Public |
| POST | `/forgot-password` | Request password reset email | Public (rate-limited) |
| POST | `/reset-password` | Reset password with token | Public (rate-limited) |
| POST | `/change-password` | Change password while logged in | Required |
| GET | `/me` | Current session's user id/email/role | Required |

**POST `/signup`** — body: `{ name, email, password }` (password: 8+ chars, upper+lower+digit) →
`201` `{ user }`. `409` if email taken, `400` on validation failure.

**POST `/login`** — body: `{ email, password }` → `200` `{ user }`. `401` on bad
credentials, `403` if account deactivated.

**POST `/reset-password`** — body: `{ token, password }` → `200`. `400` if token
invalid/expired.

### Journal — `/api/v1/journal` (all routes require auth)

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Create a journal entry (text or voice), optionally request an AI reflection inline |
| GET | `/` | List entries — paginated, searchable, filterable by mood/tag/favorite/date range, sortable |
| POST | `/voice/upload` | Upload raw audio (multipart, field `audio`) → returns a URL to attach to a voice entry |
| GET | `/:id` | Get one entry (with tags, emotions, AI reflection, attachments) |
| PATCH | `/:id` | Update title/content/mood/tags/emotions/favorite |
| DELETE | `/:id` | Soft-delete an entry |
| POST | `/:id/reflection` | Generate an AI reflection for an existing entry that doesn't have one |

**POST `/`** — body:
```json
{
  "title": "string",
  "content": "string",
  "mood": "EXCELLENT|GREAT|GOOD|OKAY|SAD|ANXIOUS",
  "tags": ["work"],
  "emotions": ["accomplished"],
  "entryType": "TEXT",
  "requestAiReflection": true
}
```
→ `201` `{ entry }`. Automatically upserts today's mood-tracking row and updates the
user's streak/entry-count counters.

**GET `/`** — query: `page, limit, search, mood, tag, favoriteOnly, sortBy, sortOrder,
startDate, endDate` → `200` with `data` = entry array, `meta` = pagination info.

### Mood — `/api/v1/mood` (auth required)

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Log/overwrite today's (or a specified date's) mood |
| GET | `/history?range=week\|month\|quarter\|year\|all` | Mood history for charting |

### AI Chat — `/api/v1/ai-chat` (auth required)

| Method | Path | Purpose |
|---|---|---|
| POST | `/sessions` | Start a new chat session |
| GET | `/sessions` | List sessions (paginated) |
| GET | `/sessions/:sessionId` | Get a session with full message history |
| POST | `/sessions/:sessionId/messages` | Send a message, get the AI's reply (rate-limited) |
| POST | `/sessions/:sessionId/archive` | Archive a session |

### Reports — `/api/v1/reports` (auth required)

| Method | Path | Purpose |
|---|---|---|
| GET | `/summary` | Average mood, best mood, week-over-week change, mood distribution, full trend series, total entries |

### Users / Settings — `/api/v1/users`

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/me` | Full profile + preferences | Required |
| PATCH | `/me` | Update name/avatarUrl | Required |
| PATCH | `/me/preferences` | Update theme/notifications/privateMode/timezone | Required |
| POST | `/me/avatar` | Upload avatar image (multipart, field `image`) | Required |
| DELETE | `/me` | Delete account (soft delete), requires password confirmation | Required |
| POST | `/feedback` | Submit feedback/rating | Optional (works signed-out) |

### Admin — `/api/v1/admin` (auth + `ADMIN` role required)

| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard` | User/entry/chat counts + 7-day growth |
| GET | `/users` | Paginated user list, searchable |
| PATCH | `/users/:id/status` | Activate/deactivate a user |
| GET | `/feedback` | Paginated feedback inbox |
| PATCH | `/feedback/:id/resolve` | Mark feedback resolved |
| GET | `/audit-logs` | Paginated security/audit log |
| GET | `/feature-flags` | List feature flags |
| PUT | `/feature-flags` | Create/update a feature flag |
| GET | `/announcements` | List announcements |
| POST | `/announcements` | Create/publish an announcement |

## Security Checklist

- [x] Helmet, CORS locked to `CLIENT_URL`, HPP
- [x] Global + endpoint-specific rate limiting (auth, password reset, AI calls)
- [x] Zod validation on every mutating endpoint
- [x] Bcrypt (12 rounds) password hashing
- [x] JWT access + rotating, hashed-at-rest refresh tokens with reuse detection
- [x] HttpOnly / Secure (prod) / SameSite=Strict cookies
- [x] Centralized error handling — no stack traces leaked in production
- [x] Audit log for auth events, profile changes, admin actions
- [x] Soft deletes (users, journal entries) — no destructive hard deletes in the hot path

## Deploying

`Dockerfile` is a multi-stage build producing a small production image running as a
non-root user, with a container `HEALTHCHECK` against `/api/v1/health`. Run
`prisma migrate deploy` (already wired into `docker-compose.yml`'s `api` service
command) before starting the process in any environment.
