# Betegna — System Architecture (v4)

## 1. Guiding decisions

| Decision | Choice | Rationale |
|---|---|---|
| Codebase | **React Native + Expo + TypeScript**, one codebase for iOS/Android | 90%+ shared code; Expo + EAS for CI/CD; TypeScript strict everywhere |
| Backend | **Firebase** (Auth, Firestore, Storage, Cloud Functions, FCM, Analytics) | Real-time chat & notifications are core; serverless ops for an early marketplace |
| Market | Ethiopia-first (ETB, Addis Ababa sub-cities, EN/AM) | Brand continuity; configurable via `src/config/brand.ts` |
| Core UX | **Request-driven, chat-centric** — not a directory | The differentiator: customers state a need; the platform does the matching |
| Complexity boundary | All matching/fan-out/money logic server-side; client untrusted | Security requirement §55 |

## 2. Layered architecture

```
┌──────────────────────────────────────────────────────────┐
│ screens/ (auth · customer · professional · shared)       │  UI only — no business logic
├──────────────────────────────────────────────────────────┤
│ components/ (common · cards · chat · booking · forms)    │  Design-system tokens
├──────────────────────────────────────────────────────────┤
│ state/ (ThemeContext, AuthContext)                       │  Session, roles, theme
├──────────────────────────────────────────────────────────┤
│ services/  ← THE ONLY gateway to data                    │  Branches demo ⇄ firebase
│   auth · requests · chat · quotes · bookings · reviews   │
│   professionals · notifications · favorites · payments   │
│   analytics · storage                                    │
├──────────────────────────────────────────────────────────┤
│ features/  (pure business logic, unit-tested)            │
│   matching/engine · marketplace/nlParser                 │
│   services/questionnaireEngine · quotes/quoteMath        │
│   requests/lifecycle · reviews/reputation                │
├──────────────────────────────────────────────────────────┤
│ firebase/demoDb.ts       firebase/firebaseClient.ts      │
│ (in-memory + simulated   (Auth + Firestore + Storage,    │
│  pro intelligence)       onSnapshot listeners)           │
└──────────────────────────────────────────────────────────┘
```

**Why a demo backend?** The app must be runnable with zero credentials (development, design review, preview, App Store screenshots) while exercising the *exact* service surface. `demoDb.ts` implements the same API as the Firebase adapter plus **simulated professional behavior**: matched pros open the chat, send intro messages, propose times, and send structured quotes on a realistic delay. UI code never knows which backend is live (`ENV.isDemo` is consulted only inside `services/`).

## 3. Key flows

### Customer loop
```
Home (NL input) → parseIntent() → RequestWizard (service → dynamic questionnaire
→ schedule & location → review) → createRequest() → Matching animation
→ RequestDetail (tabs: overview / quotes / matched pros)
   ├── chat with a pro (quotes & appointment proposals render in-thread)
   ├── accept quote → booking created (Cloud Function in prod)
   └── BookingDetail (timeline, start/complete, pay, review)
```

### Professional loop
```
fanoutRequestMatches (CF) → leads (New) → LeadDetail (request summary + answers)
→ Chat / QuoteComposer (live totals, proposed slot) → quote sent
→ customer accepts → Booking (Confirmed) → Calendar/ProJobs
→ Start job → Complete job → review received
```

### Dual-role account
`users/{uid}.roles: ['customer','professional']`, `activeRole` selects the shell (tab bar + stacks). Switching is instant; the professional profile is created lazily on first switch (`ensureProfessionalProfile`).

## 4. Real-time strategy

| Data | Mechanism | Notes |
|---|---|---|
| Chat messages | `onSnapshot(messages orderBy createdAt desc limit 40)` | pagination via `startAfter`; listeners unsubscribed on unmount |
| Conversations list | `onSnapshot(where participants array-contains uid, orderBy updatedAt)` | denormalized `lastMessage`, `unread` map |
| Requests / quotes / bookings / notifications | scoped `onSnapshot` per uid | all queries backed by composite indexes |
| Typing indicators | demo: in-memory; prod: ephemeral presence doc (Phase 2) | |

## 5. Deep links & notifications

- Schemes: `betegna://request/:id`, `conversation/:id`, `booking/:id`, `professional/:id`, `leads`, `notifications` + `https://betegna.app/*` (App Links / Associated Domains configured in `app.json`).
- Notification tap → authenticate if needed → restore destination → load data (requirement §48–49). In-app Notification Center maps `deepLink` strings to navigation actions (`deepLinkToNavigation`).
- Push delivery: Cloud Function `notify()` writes a `notifications` doc + best-effort FCM multicast to the user's registered `fcmTokens`. Critical security notifications cannot be disabled (preferences enforce).

## 6. Offline & reliability

- Firestore local persistence enabled by default (native SDK); demo backend persists to AsyncStorage.
- Chat send path queues optimistic messages (`status: sending → sent/failed`) with retry — never silently drop messages/requests/quotes (requirement §50).
- Offline indicator + duplicate-submission guards planned in Phase 2 polish (see roadmap).

## 7. Security model (summary — full rules in `firestore.rules`)

- Role scoping via `users/{uid}.roles`; request/lead/quote/booking docs are readable only by their participants.
- Clients **cannot create** leads, bookings, notifications or payments — those are Cloud-Function-only.
- Quote totals/lines immutable client-side; only enumerated status transitions allowed.
- No secrets in the client; Firebase web config is public by design, protected by rules + App Check (Phase 3).
- Addresses & phone numbers released only after booking confirmation (privacy by design, §61).

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Firestore query cost growth | Pagination + scoped listeners + denormalized previews; Algolia/Typesense seam (`SearchService` boundary) when full-text search lands |
| Cold-start matching latency | Fan-out runs in background CF; UI shows animated "matching" without blocking |
| Supply cold-start (pros) | Seed taxonomy + concierge onboarding; demo intelligence for empty markets is a *demo-only* construct |
| Payment compliance (ETB) | Provider-agnostic PaymentService (Telebirr + Cash live, adapters in `functions/payments/` & `features/payments/`); escrow release on completion — see docs/PAYMENTS.md |
