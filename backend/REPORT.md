# Safe Journal — Frontend Reverse-Engineering & Backend Requirements Report

## 1. Project Overview

**Safe Journal** is a Next.js (App Router) AI-powered journaling and mental-wellness
application. Users write text or voice journal entries, tag their mood and emotions,
receive AI-generated reflections, chat with an AI wellness companion, and view mood
trends/analytics over time. The UI (all `'use client'` components) is currently wired
to static mock data in `lib/mock-data.ts` — there is no real backend, persistence, or
authentication.

Stack detected: Next.js 14+ (App Router), TypeScript, Tailwind, shadcn/ui primitives,
`recharts` for charts, `lucide-react` icons.

## 2. Screens Inventory

| Route | Purpose |
|---|---|
| `/` | Marketing splash page, links to login/signup |
| `/onboarding` | 5-slide onboarding carousel, ends at `/dashboard` |
| `/auth/login` | Email/password login form |
| `/auth/signup` | Name/email/password/confirm signup form |
| `/dashboard` | Home: streak, quote, today's entry, recent entries, mood snapshot |
| `/journal` | List of entries with search + mood filter |
| `/journal/new` | Create entry: title, mood, content, emotions, tags, optional AI help |
| `/journal/voice` | Voice recording UI → creates a voice entry |
| `/journal/[id]` | Entry detail: content, tags, emotions, AI reflection (toggle), edit/delete/share, prev/next nav |
| `/ai-chat` | Chat-style conversation with an AI wellness companion |
| `/reports` | Mood trend line chart, mood distribution pie/bar, stat cards (avg mood, best mood, entry count, week trend) |
| `/settings` | Profile fields, security section (change password / 2FA / sessions — UI only, no handlers), theme, notifications toggle, private mode toggle, logout |

## 3. User Flows

1. **Signup → onboarding → dashboard** (new users)
2. **Login → dashboard** (returning users)
3. **Dashboard → new entry → journal list** (write flow)
4. **Dashboard → voice journal → journal list** (voice write flow)
5. **Journal list → entry detail → (edit / delete / share / view AI reflection)**
6. **Dashboard/nav → AI chat → back-and-forth conversation**
7. **Nav → reports → view mood analytics**
8. **Nav → settings → update profile/preferences → logout**

## 4. Forms Identified

| Form | Fields | Notes |
|---|---|---|
| Signup | name, email, password, confirmPassword | Client-side validation only; needs signup API |
| Login | email, password | Needs login API + "forgot password" link (route referenced but not built: `/auth/forgot-password`) |
| New Journal Entry | title, mood, content, emotions[], tags (csv string) | "AI Help" button has no handler wired — needs AI reflection endpoint |
| Voice Journal | title, mood, (recorded audio) | Recording is currently simulated client state only — needs audio upload + transcription |
| Settings — Account | name, email | "Update Profile" button has no handler |
| Settings — Security | change password / 2FA / sessions | Buttons present, no destination pages or handlers — need to be built |
| Feedback | *(not present in UI, but "Support" footer link implies a contact/feedback surface)* |

## 5. Buttons / Actions Requiring Backend Support

- New Entry → `Save Entry` (currently `setTimeout` fake save)
- New Entry → `AI Help` (no handler — needs on-demand AI reflection/assist)
- Voice Journal → record/stop/re-record/`Save Entry` (no real recording pipeline)
- Entry Detail → `Edit`, `Delete`, `Share`, `Save Reflection`, `Share Reflection` (no handlers)
- Journal List → search + mood filter (currently filters the static mock array client-side)
- Dashboard → all entry links (reads mock data)
- AI Chat → `Send` (currently a random canned reply after a `setTimeout`)
- Reports → time range toggle (week/month/all) doesn't actually refetch scoped data
- Settings → `Update Profile`, theme toggle, notifications toggle, private-mode toggle, `Logout` (logout only does a client redirect)
- Navigation → `Logout` (client-only redirect, no session invalidation)

## 6. Missing Backend Dependencies (Summary)

- No authentication/session system (JWT, cookies, refresh flow)
- No database or persistence of any kind
- No real AI integration for reflections or chat
- No file/audio upload or storage pipeline for voice entries
- No mood-history aggregation logic (all computed from static array in `reports/page.tsx`)
- No settings/preferences persistence
- No password reset / email verification flow (referenced route doesn't exist yet)
- No admin surface at all, despite being a reasonable expectation for a SaaS product
- No rate limiting, audit logging, or abuse protection anywhere

## 7. Required APIs

Implemented in full — see `README.md` → "API Reference" for the complete endpoint
table (method, purpose, auth, request/response shapes, status codes).

Groups: `auth`, `journal` (CRUD + voice upload + AI reflection), `mood`, `ai-chat`
(sessions + messages), `reports`, `users` (profile/preferences/avatar/feedback/account
deletion), `admin` (dashboard, users, feedback, audit logs, feature flags, announcements).

## 8. Required Database Tables

Modeled in `prisma/schema.prisma`: `users`, `user_preferences`, `refresh_tokens`,
`journal_entries`, `tags`, `journal_entry_tags`, `emotions`, `journal_entry_emotions`,
`ai_reflections`, `attachments`, `mood_entries`, `chat_sessions`, `chat_messages`,
`notifications`, `feedback`, `audit_logs`, `feature_flags`, `announcements`.

Design notes: tags/emotions are normalized many-to-many junction tables (not string
arrays) so they can be filtered/indexed/reused across entries; journal entries and
user accounts use soft deletes; mood entries are unique per user per day and are
automatically upserted whenever a journal entry's mood is set, which is what powers
the reports/trend screen without extra client-side computation.

## 9. Authentication Requirements

Email/password signup and login, hashed with bcrypt (12 rounds); short-lived JWT
access tokens delivered as an HttpOnly cookie (and echoed once in test mode for
convenience); rotating refresh tokens stored hashed in the DB with reuse detection
(a reused/revoked refresh token immediately revokes the whole token family); email
verification; forgot/reset password with time-boxed single-use tokens; authenticated
password change that revokes all sessions; role-based access control (`USER` /
`ADMIN`) enforced via middleware on admin routes.

## 10. Storage Requirements

Voice journal audio and avatar images are uploaded via `multer` (in-memory) and
forwarded to Cloudinary, returning a secure HTTPS URL stored on the `journal_entries`
/ `users` row. The storage layer is abstracted behind `upload.service.ts` so a
different provider (S3, local disk) can be swapped in without touching controllers.

## 11. Third-Party Integrations

- **Resend** — transactional email (verification, password reset, welcome)
- **Cloudinary** — audio/image storage
- **AI provider** — pluggable (`AI_PROVIDER=anthropic|openai|mock`) for journal
  reflections and the AI chat companion; defaults to a safe canned-response "mock"
  mode so the API runs out of the box with zero external keys
- **Redis + BullMQ** — background jobs (daily journal reminders, streak reset)

## 12. Admin Features Implemented

Dashboard stats (user/entry/chat counts, 7-day growth), user list + activate/
deactivate, feedback inbox + resolve, audit log viewer, feature flag CRUD,
announcement CRUD/publish.

## 13. Security Concerns Addressed

Helmet, strict CORS to the configured client origin with credentials, rate limiting
(global + tighter limits on auth/password-reset/AI endpoints), HPP protection,
Zod validation on every input surface, parameterized queries via Prisma (no raw SQL
injection surface), bcrypt password hashing, HttpOnly/Secure/SameSite=strict cookies,
hashed-at-rest refresh tokens with rotation + reuse detection, centralized typed error
handling that never leaks stack traces in production, and an audit log for
security-relevant events (login, login failures, password changes, admin actions,
account deletion).

**Assumption flagged for the team:** the frontend's "Two-Factor Authentication" and
"Active Sessions" settings rows currently have no destination — this backend does not
implement TOTP-based 2FA or a session-listing endpoint yet, since the UI gives no
spec for them. Recommend scoping this as a follow-up if it's a real requirement.

## 14. Scalability Concerns Addressed

Pagination on every list endpoint, DB indexes on all high-traffic filter/sort columns
(`userId+createdAt`, `userId+mood`, `email`, etc.), soft deletes instead of hard
deletes (undo-safe, keeps referential integrity), background jobs offloaded to a
Redis-backed queue instead of blocking request threads, connection pooling via
Prisma's client singleton, and a stateless auth model (JWT + DB-backed refresh
tokens) so the API can scale horizontally behind a load balancer without sticky
sessions.
