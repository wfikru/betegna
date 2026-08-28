# Matching & Search

## Matching engine (`src/features/matching/engine.ts`, mirrored in `functions/matchingEngine.js`)

```
Match Score (0–100) =
    Service match        30   exact service 30 · category-only 15 · else 0
  + Location             20   sub-city in service area 20 · ≤5km 17 · ≤10km 11 · ≤15km 6 · else 2–4
  + Availability         12   works requested weekday & not on vacation 12 · else 3.6 (+1 online for urgent)
  + Rating               12   (rating/5)·9.6 + min(reviews,200)/200·2.4
  + Responsiveness       10   response rate·6 + speed tier·2.5 + online·1.5
  + Experience            6   min(years,10)/10·6
  + Price fit             4   starting price ≤1.25× category baseline 4 · ≤2× 2 · else 0
  + Performance           6   completion rate·3.9 + verified·2.1
```

- Threshold: `MIN_MATCH_SCORE = 35`; fan-out takes the top 5.
- Weights live in `MATCH_WEIGHTS` — tunable per market without logic changes (admin-configurable later).
- Deterministic & pure → unit-tested (`engine.test.ts`); the same algorithm runs client-side (instant UI + demo) and server-side (authoritative, `fanoutRequestMatches`).
- **New-pro fairness:** reputation uses Bayesian blending (prior 4.2 ★ / weight 10) so a single 5★ review doesn't outrank 200 reviews at 4.8 (`features/reviews/reputation.ts` + `onReviewCreated` CF).

## Natural-language understanding (`features/marketplace/nlParser.ts`)

Rule-based grammar (AI-ready seam — swap `parseIntent` with an LLM call, keep the interface):

- **Service synonyms** (EN + አማርኛ): "faucet/drip/leaking" → `faucet-leak`; "ጽዳት" → `house-cleaning`; "AC not cooling" → `hvac`; longest-match wins
- **Urgency**: emergency/urgent/asap/right now → `emergency`; today → `today`; tomorrow (ነገ) → `tomorrow`; this week/weekend → `this_week`
- **Frequency**: every week/weekly (በየሳምንቱ) → `weekly`; every two weeks/biweekly → `biweekly`; monthly → `monthly`
- **Location**: sub-city names + landmark map (Kazanchis→Kirkos, Piassa→Arada, CMC/Ayat/Megenagna→Yeka, Gerji→Bole, Saris/Lebu→Nifas Silk, Kality→Akaki …)
- **Keywords**: stopword-filtered tokens power search & the request summary
- **Confidence**: 0.9 synonym hit · 0.6 category · 0.3 none (wizard starts at category picker)

Example:
> "My bathroom faucet is leaking and I need someone tomorrow in Bole"
→ `{ serviceId: faucet-leak, urgency: tomorrow, locationHint: Bole, keywords: [bathroom, faucet, leaking, someone], confidence: 0.9 }`

## Search architecture
`searchServices(query)` = intent parse → exact service, else substring match over the taxonomy. When the marketplace grows, the same call is backed by Algolia/Typesense behind a `SearchService` boundary (requirement §43) — no UI change.

## AI roadmap (Phase 4)
1. **Intent parsing** → LLM with the taxonomy as tool schema (falls back to rules offline)
2. **AI matching** → learning-to-rank on win/loss outcomes; weights become model features
3. **Customer assistant** → "wedding photographer under 10,000 ETB next Saturday" → structured request draft
4. **Pro assistant** → quote drafting from request answers, reply suggestions, profile improvement tips
