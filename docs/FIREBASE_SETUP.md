# Going live with Firebase — setup guide

This switches Betegna from the bundled demo backend to **real users and data**.

## 0. What changes
`EXPO_PUBLIC_BACKEND_MODE` selects the backend (`src/config/env.ts`):
- `demo` (default) — in-memory, no credentials
- `firebase` — real Auth/Firestore/Functions via the `EXPO_PUBLIC_FIREBASE_*` env vars

## 1. Firebase project
1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. **Authentication → Sign-in method → enable Email/Password** (add Google/Apple/Phone later)
3. **Firestore Database → Create database** (production mode, region `europe-west` is fine)
4. **Project settings → General → Your apps → Web app (</>)** → copy the config values

## 2. App environment
Create `.env` in the repo root (never commit it — already gitignored):

```bash
EXPO_PUBLIC_BACKEND_MODE=firebase
EXPO_PUBLIC_FIREBASE_API_KEY=…
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
EXPO_PUBLIC_FIREBASE_APP_ID=…
```

Restart Metro with a clean cache after changing env: `npx expo start --clear`
(env vars are baked at bundle time).

## 3. Deploy rules, indexes and Cloud Functions
```bash
npm i -g firebase-tools
firebase login
firebase use <project-id>

firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions     # requires the Blaze plan (pay-per-use, free tier covers dev)
```
Functions deployed: request fan-out → leads, quote-accept → booking, message
fan-out + notifications, review → reputation, booking-status notifications,
payments (createPayment / telebirrNotify / confirmCashCollection / expiry sweep).

## 4. Seed the taxonomy (categories & services)
```bash
npm i -D firebase-admin
# service account key: Project settings → Service accounts → Generate new private key
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
  PROJECT_ID=<project-id> node scripts/seed-firestore.js
```
19 categories + 63 services are written to `categories` / `services`
(world-readable, admin-writable via console). Regenerate the JSON after taxonomy
code changes with `npx tsx scripts/generate-taxonomy-json.ts`.

## 5. Roles & data model in production
- **Signup** writes `users/{uid}` (roles + activeRole + prefs) — rules allow creating only your own doc
- **Professionals** get `professionals/{uid}` on guided onboarding; verification (`verified`, credentials) is an admin action in the console for now
- **Requests**: customer creates `serviceRequests/{id}` (status `submitted`) → the `fanoutRequestMatches` trigger runs the matching engine, writes `leads` and notifies pros (clients never write leads)
- **Quotes** are created by pros; customers may only flip status to accepted/declined; the booking document is created **server-side** by `onQuoteAccepted`
- **Payments**: **cash-only for launch** (Telebirr disabled in the registry; ignored even if a client requests it). To enable Telebirr later: set `PAYMENTS_TELEBIRR_ENABLED=true` + `TELEBIRR_*` creds on Functions and remove the `disabled` flag in `src/features/payments/providers.ts`

## 6. First-user test checklist
- [ ] Sign up as a customer (email/password) → lands on Home
- [ ] Post a request → status changes to "matched" (check Functions logs for `fanoutRequestMatches`)
- [ ] Sign up a second account as a professional (complete onboarding)
- [ ] Pro sees the lead in Leads (if the category matches; otherwise create a request in their category)
- [ ] Pro sends a quote → customer gets it in Request detail + chat message
- [ ] Customer accepts → booking appears for both; both got a notification
- [ ] Pro: Start job → Complete; customer: pay cash → pro confirms → Paid
- [ ] Customer leaves a review → pro rating updates (trigger)

## 7. Common pitfalls
- **Env changes ignored** → restart with `--clear`; env is read at bundle time
- **`firestore.rules` deploy fails** → check the `users` create rule matches this repo's version
- **No leads appearing** → Functions didn't deploy (Blaze required) or the pro's `serviceIds` don't include the requested service
- **Push notifications** need FCM tokens (`fcmTokens` collection) — registered by native builds; Expo Go has no push for custom FCM
- Keep `EXPO_PUBLIC_BACKEND_MODE=demo` for local UI work; use firebase only when you want real data
