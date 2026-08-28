# Betegna — Product Requirements (v4 rewrite)

## Vision
> A personal assistant for finding, communicating with, hiring and managing trusted professionals — **not a directory**.

Customers say what they need ("I need a plumber tomorrow"). The platform understands intent, asks only the questions that matter for that service, ranks & notifies the best professionals, and the relationship happens in chat: quotes, proposed times, booking, completion, payment, review.

## Personas

**Selam, 34 — working mother, Bole.** Time-poor; wants a trusted cleaner bi-weekly and occasional repairs. Success: posts once from her phone, gets 2–3 quotes within the hour, books without phone calls. *Never wants to browse 100 profiles.*

**Abebe, 41 — licensed plumber, Kirkos.** Lives on referrals; slow weeks hurt. Success: his phone buzzes with qualified leads nearby; he quotes in 2 minutes and wins jobs. *Hates paying for junk leads.*

**Rediet, 29 — event planner & caterer.** Runs a small team; needs a calendar, not paperwork. Success: jobs, quotes and scheduling in one app; ratings grow her pipeline.

**Admin (platform).** Verifies pros, curates categories & questionnaires, moderates reviews, watches funnel metrics. *Separate web portal (Phase 3).*

## Primary journeys

### Customer (happy path)
1. Sign up (≤30s, name+email) → Home
2. Types "deep clean my 3-bedroom apartment this week" → parser picks Deep Cleaning + urgency
3. Answers 4–6 service-specific questions (bedrooms, bathrooms, focus areas, photos)
4. Picks sub-city + timing → review → submit
5. Watches matching → 3–5 pros notified → pros chat & send structured quotes
6. Compares quotes in the request page & chat → accepts the best
7. Booking confirmed (time, price, address released to pro) → job done → pay → review (6 dimensions)

### Professional
1. Sign up (professional role) → guided profile (services, pricing, area, availability, portfolio, credentials)
2. First matched lead lands in Leads (New) with a match score
3. Opens LeadDetail — sees the customer's answers — chats and/or composes a quote with live totals
4. Customer accepts → Booking appears in Calendar/Jobs
5. Start → Complete → payment recorded → review arrives → reputation updates

## MVP boundary (this build = Phase 1 + key Phase 2)

**In:** auth (email incl. demo), NL request + dynamic questionnaires, matching engine + fan-out, professional directory & premium profiles, real-time chat with structured quote/appointment/booking messages + typing + read receipts, quotes with live math, booking lifecycle + timeline, job completion, 6-dimension reviews + reputation, favorites, notification center + preferences + deep links, pro workspace (leads pipeline, quote composer, calendar/availability, profile & services editor), dual-role switching, EN/AM, light/dark, security rules, Cloud Functions, CI.

**Deferred (documented, architected-for):**
- Phase 2+: phone/Google/Apple auth & MFA, document verification flow, email/SMS channels, smart rescheduling UI, blocking/reporting UI
- Phase 3: Stripe/Telebirr/Chapa payments, payouts & platform fees, subscriptions & featured listings, disputes workflow, admin web portal, analytics dashboards
- Phase 4: LLM-powered intent parsing & matching (the `parseIntent`/`ranking` seams are the swap points), AI customer & pro assistants

## UX principles (enforced in review)
1. The customer never browses a directory — they *state a need*.
2. One question per screen during request creation; every extra tap must earn its place.
3. Chat is the workplace: quotes, times and confirmations are native messages, not links.
4. Pros live on speed: response time is visible, quoted-first-wins is reinforced everywhere.
5. Trust surfaces: verification badges, escrow-style messaging, safety notices, privacy of address & phone.

## Roles & onboarding (refined)
- Customer mode is instant for everyone — no setup.
- Becoming a professional is a guided upgrade (benefits → business info → services & pricing → service area → activate). No empty pro profiles are ever created implicitly; the professional shell shows a setup prompt until onboarding completes.
- Reviews: single overall star rating + optional text (schema retains sub-dimensions for future detailed breakdowns).
