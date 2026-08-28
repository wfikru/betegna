# Betegna ቤተኛ — Professional Services Marketplace

**"Tell us what you need — we will get it done."**

A production-quality, next-generation local-services marketplace for **Ethiopia** (ETB, Addis Ababa sub-cities, English + አማርኛ). Customers describe what they need in plain language; the platform understands the request, asks only relevant questions, matches the best **verified professionals**, and runs the whole relationship in chat — quotes, scheduling, booking, completion and review.

Built as **one React Native + Expo + TypeScript codebase** → iOS + Android (+ web preview) with a **Firebase** backend.

---

## What's inside (v4 — complete rewrite)

| Area | Highlights |
|---|---|
| **Request-driven core** | Natural-language home ("I need a plumber tomorrow in Bole"), AI-ready rule-based intent parser, dynamic per-service questionnaires (Typeform-style, one question per screen) |
| **Matching engine** | Configurable weighted scoring (service 30 / location 20 / availability 12 / rating 12 / responsiveness 10 / performance 6 / experience 6 / price 4), mirrored server-side in Cloud Functions |
| **Real-time chat** | Quotes, appointment proposals, booking events and system messages inside the thread; typing indicators, read receipts, unread counts, simulated pro intelligence in demo mode |
| **Quotes → Booking → Job** | Structured quotes (labor/materials/fees, discount, VAT, expiry, proposed slot), accept-in-chat, transactional booking creation, job timeline, completion |
| **Professional workspace** | Lead pipeline (new → contacted → quoted → won/lost), quote composer with live totals, calendar + working-hours editor, services/pricing/portfolio/service-area editor, profile strength |
| **Dual-role account** | One account, two modes (Customer ⇄ Professional) — switch instantly from Profile |
| **Notifications** | Notification center with category filters, deep links (`betegna://request/:id` …), preferences (per-channel & per-kind), FCM wiring via Cloud Functions |
| **Reviews & reputation** | 6-dimension reviews, Bayesian reputation blending so new pros aren't buried, professional responses |
| **Payments — Telebirr + Cash** | Provider-agnostic PaymentService (adapter registry on client & Functions): Telebirr escrow (signed H5 order + webhook), cash ledger, release-on-completion, payment history |
| **Trust & safety** | Firestore security rules (role-scoped access, server-only writes for money/leads/notifications), privacy-preserving chat, report/block hooks |
| **i18n** | Full English + አማርኛ (Amharic) UI |
| **Design system** | Original premium token system (deep green + gold), light/dark themes, accessibility labels, skeletons & empty states everywhere |

## Quick start

```bash
npm install

# Demo backend — zero credentials, seeded Ethiopian marketplace, simulated pros
npm start                 # Expo dev server (iOS/Android/web)

# Web production bundle
npm run export:web

# Quality gates
npm run typecheck         # tsc --noEmit (strict)
npm test                  # Jest unit tests (matching, NL parser, quote math, questionnaire)
```

**Demo mode is on by default** (`EXPO_PUBLIC_BACKEND_MODE=demo`, see `.env.example`). Sign in with any email — try `demo@betegna.app` / any password. Matched professionals reply in chat and send quotes automatically, so the full marketplace loop is explorable without a backend.

### Switching to Firebase

1. Copy `.env.example` → `.env` and fill `EXPO_PUBLIC_FIREBASE_*` from your Firebase console.
2. Set `EXPO_PUBLIC_BACKEND_MODE=firebase`.
3. Deploy rules, indexes and functions: `firebase deploy --only firestore:rules,firestore:indexes,functions`.
4. Seed taxonomy (`categories`, `services`, `serviceQuestions`) & `professionals` — the seed data in `src/config/seed/` mirrors those documents 1:1.

## Project structure

```
src/
├── app/            # navigation (role-based shells, deep links) & providers
├── components/     # common UI kit, cards, chat, booking, forms
├── screens/
│   ├── auth/       # Welcome, Login, SignUp, Forgot
│   ├── customer/   # Home (NL search), Requests, RequestWizard, Matching,
│   │               # RequestDetail, ProProfile, ReviewComposer, Favorites
│   ├── professional/ # Dashboard, Leads, LeadDetail, QuoteComposer,
│   │                 # Calendar (availability), ProfileEdit
│   └── shared/     # ChatList, ChatThread, Notifications, Profile, BookingDetail
├── features/       # pure business logic (matching, NL parser, questionnaire,
│                   # quote math, lifecycle, reputation) — unit-tested, UI-free
├── services/       # service layer: demo backend ⇄ Firebase behind one API
├── state/          # Theme & Auth contexts
├── models/         # domain types (mirrors Firestore schema)
├── config/         # brand, env, theme tokens, seed taxonomy & professionals
├── i18n/           # en / am dictionaries
├── constants/      # sub-cities & coordinates, status maps
└── utils/          # money/date/geo/validation helpers
functions/          # Cloud Functions (fan-out, notifications, booking tx, reputation)
firestore.rules     # role-scoped security rules
docs/               # architecture, PRD, schema, roadmap
```

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Expo dev server (all platforms) |
| `npm run export:web` | Static web bundle in `dist/` |
| `npm run typecheck` | Strict TypeScript check |
| `npm test` | Unit tests |
| `npm run deploy:rules` | Deploy Firestore rules + indexes (needs firebase-cli) |

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design, layers, security, offline, deep links
- [docs/PRD.md](docs/PRD.md) — product vision, personas, journeys, MVP boundary
- [docs/FIRESTORE_SCHEMA.md](docs/FIRESTORE_SCHEMA.md) — collections, indexes, query patterns
- [docs/NAVIGATION_AND_SCREENS.md](docs/NAVIGATION_AND_SCREENS.md) — sitemap, screen inventory
- [docs/MATCHING_AND_SEARCH.md](docs/MATCHING_AND_SEARCH.md) — matching weights, NL grammar, AI roadmap
- [docs/PAYMENTS.md](docs/PAYMENTS.md) — Telebirr + Cash provider-agnostic payment architecture
- [docs/ROADMAP.md](docs/ROADMAP.md) — phase plan & deferred features

## Branch

`v4-react-native-rewrite` — complete rewrite of the previous React/Vite/Capacitor app. The legacy web app remains available on the `Capacitor`, `v2-dual-mode-redesign` and `v3-taskrabbit-thumbtack-redesign` branches.

> Inspired by the marketplace category leaders — but an original product: simpler than a directory, powered by a sophisticated matching backend.
