# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Overview

**Veil (베일)** is a blind content discovery platform. Consumers watch anonymous teasers (no title, creator, or metadata shown) and react with "interest." Only after expressing interest is the content information revealed. Creators upload teasers, receive anonymized audience stats, and send external links to interested consumers.

Three user roles with separate UX flows:
- **Consumer (소비자)**: Blind teaser feed → interest → reveal → receive external notices
- **Creator (창작자)**: Upload teaser → review wait → dashboard (exposure count, interest count) → send external notices
- **Admin (관리자)**: Review pending content → approve/reject

See `ref/feature_spec_v3.md` for full feature specifications and `ref/veil_wireframe_*.html` for wireframes.

## App Structure

The frontend lives in `veil_frontend/` — a Vite + React 19 + TypeScript web app.

```
veil_frontend/src/
  types/index.ts          # All domain types (User, Content, Reaction, Notification, etc.)
  context/auth.tsx        # AuthContext — user, token, login(), logout(), setUser()
  services/api.ts         # Typed fetch wrapper + all API stubs (auth/consumer/creator/admin)
  router/index.tsx        # RequireAuth, RequireGuest route guard components
  layouts/
    AuthLayout            # Centered shell for login/register
    ConsumerLayout        # Mobile shell (max-width 430px, bottom tab nav)
    CreatorLayout         # Desktop shell (left sidebar)
    AdminLayout           # Desktop shell (left sidebar)
  pages/
    auth/                 # LoginPage (S-01), RegisterPage (S-02)
    consumer/             # Onboarding (S-03, 7-step), FilterPage (S-04), FeedPage (S-05/06),
                          # ContentDetailPage (S-07), InterestsPage (S-08),
                          # NotificationsPage (S-09), SettingsPage (S-10)
    creator/              # DashboardPage (C-01), UploadPage (C-02), UploadInfoPage (C-03),
                          # ContentsPage (C-04), ConsumersPage (C-05),
                          # NoticePage (C-06), CreatorNotificationsPage (C-07)
    admin/                # ReviewListPage (A-01), ReviewDetailPage (A-02)
ref/                      # Product specs (not part of the app)
  feature_spec_v3.md
  veil_wireframe_consumer_mobile.html
  veil_wireframe_creator_desktop.html
  veil_wireframe_admin_desktop.html
```

## Commands

All commands run from `veil_frontend/`:

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Type-check + production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint
```

## Architecture Notes

- **Routing**: React Router v6 (`BrowserRouter` + `Routes`). Role-based guards in `router/index.tsx` — `RequireAuth` redirects unauthenticated or wrong-role users to `/login`; `RequireGuest` redirects authenticated users to their role's home.
- **Role home routes**: consumer → `/consumer/feed` (or `/consumer/onboarding` if not yet done), creator → `/creator/dashboard`, admin → `/admin/review`.
- **Path alias**: `@/` maps to `src/`, configured in both `vite.config.ts` (`resolve.alias`) and `tsconfig.app.json` (`paths`).
- **Styling**: CSS Modules (`.module.css`) per page group. No external UI library.
- **API client**: `services/api.ts` — all calls go through a typed `request<T>()` wrapper. Base URL from `VITE_API_URL` env var (defaults to `http://localhost:8080`). File uploads use raw `fetch` with `FormData`.
- **Auth state**: In-memory only (no persistence). On page refresh, user is logged out. Add `localStorage`/`sessionStorage` persistence when needed.

## Key Domain Concepts

- **Blind principle**: No content metadata (title, creator, genre, synopsis) is shown to consumers before they express interest. This is the core UX constraint — never expose `Content.title`, `synopsis`, `genres`, or `directors` on any consumer-facing screen before the reveal.
- **Content status flow**: `pending` → `approved` / `rejected` (set by admin in ReviewDetailPage).
- **Reaction types**: `pass` (swipe up on feed) and `interest` (tap heart → triggers reveal + creator notification).
- **ExternalNotice**: Creator-to-consumer one-way link delivery (external screening/purchase URLs). Max 2 sends per content per 3 days — enforced server-side.
- **Onboarding data**: Consumer demographics (birthDate, gender, region, preferredGenres) collected at signup, never shown to other consumers — used only for creator stats and feed diversity algorithm.
- **Blind teaser feed**: Full-screen vertical video. Swipe up = pass, swipe down = previous, tap heart = reveal. Videos do not auto-advance on end.
- **AnonymizedConsumer**: Creator sees audience as anonymized demographic records (`ageGroup`, `gender`, `region`) — never real email or identity.
