# Roadmap & Quality

## Phase 1 — MVP marketplace ✅ (this branch)
Auth (email + demo), taxonomy + dynamic questionnaires, NL request flow, matching + fan-out, professional directory & profiles, real-time chat (text/quote/appointment/booking/system, typing, read receipts, unread), quotes with live math & expiry, booking lifecycle + timeline, job completion, notification center + preferences + deep links, reviews (6 dimensions) + reputation, favorites, EN/AM, light/dark, security rules, Cloud Functions, CI.

## Phase 2 — Marketplace operations ✅ (key parts) / 🔜 (rest)
- ✅ Professional lead management (pipeline + states), scheduling (working hours, proposed slots, calendar), reviews & reputation
- 🔜 Phone/Google/Apple sign-in + MFA, professional verification upload & admin review, email/SMS notification channels, reschedule flows with conflict detection, blocking & reporting UI, offline queue hardening, smart re-matching on pro decline

## Phase 3 — Commercial platform 🔜
Telebirr production credentials & reconciliation (adapter already live — see docs/PAYMENTS.md), refunds, cancellation fees, professional payouts & platform fees, subscriptions & featured listings (config flags already isolated in `features/quotes/quoteMath.platformFee`), dispute workflow, admin web portal (users/verification/taxonomy/moderation/metrics), App Check, analytics dashboards.

## Phase 4 — AI 🔜
LLM intent parsing, learning-to-rank matching, customer & pro assistants, personalized recommendations, smart notifications. Swap points: `parseIntent()`, `ranking()`, chat composer suggestions.

## Testing strategy
- **Unit (CI, in place):** matching engine, NL parser (EN/AM, landmarks, urgency, frequency), quote math, questionnaire validation/summaries
- **Integration (Phase 2):** Firebase emulator suites for CF fan-out, booking transactions, notification fan-out
- **E2E (Phase 2, Detox/Maestro):** customer signup → request → quote → accept → complete → review; pro signup → lead → quote → won
- Both iOS & Android smoke runs on EAS builds

## CI/CD
`.github/workflows/ci.yml`: install → `tsc --noEmit` (strict) → jest. EAS (`eas.json`) channels: development / staging / production with `EXPO_PUBLIC_BACKEND_MODE=firebase`; TestFlight & Play internal track submissions. Rules & indexes deploy via `firebase deploy`.

## Definition of done (every feature)
typecheck ✅ · unit tests for logic ✅ · loading/empty/error states ✅ · a11y labels ✅ · EN+AM strings ✅ · light+dark ✅ · demo-mode parity ✅ · security review for new writes ✅
