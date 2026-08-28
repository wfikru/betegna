# Firestore Schema

Collections mirror `src/models/types.ts` 1:1 (TS types are the contract). Timestamps are epoch millis numbers for cross-platform simplicity.

## Collections

### users/{uid}
```
uid, name, email, phone?, photoURL?, roles: UserRole[], activeRole,
locale: 'en'|'am', homeArea?: {subcity, city, address?},
emailVerified, notificationPrefs { channels{inApp,push,email,sms}, kinds{...} },
createdAt
```
*Created by Auth trigger / CF only; updatable only by owner (email immutable).*

### professionals/{uid}
```
uid, displayName, businessName, photoURL?, about, categoryIds[], serviceIds[],
services[{id,name,price,unit}], serviceArea[subcity names],
baseLocation{subcity,city,geo{lat,lng}}, startingPrice, priceUnit,
rating, reviewCount, jobsCompleted, yearsExperience,
responseRatePct, medianResponseMinutes, completionRatePct,
verified, badges[], availability{workingHours{0..6{enabled,start,end}},
vacationDates[], slotDurationMin, bufferMin},
portfolio[{id,title,imageURL,description?}], credentials[{id,name,type,verified}],
joinedAt, lastSeenAt?
```
*World-readable (directory). Rating/reviewCount written only by CF (`onReviewCreated`) — enforced by rules comparing existing values.*

### categories/{id} · services/{id} · serviceQuestions/{serviceId}
Admin-managed taxonomy (mirrors `src/config/seed/taxonomy.ts`). World-readable, CF/admin-writable only — questionnaire changes ship without app updates (requirement §11–12).

### serviceRequests/{id}
```
id, customerId, customerName, categoryId, serviceId, serviceName,
summaryText (NL input), parsed?{categoryId,serviceId,urgency,frequency,locationHint,keywords,confidence},
answers{questionId: value}, description?, location{subcity,city,address?,geo?},
when{preferredDate?,preferredTime?,urgency,frequency}, photos[],
status: submitted|matching|matched|quote_received|pro_selected|booked|in_progress|completed|cancelled,
matchedProIds[], createdAt, updatedAt
```
Read: owner + matched pros. Status fan-out by CF.

### leads/{requestId_proId}
```
id, requestId, proId, state: new|contacted|quoted|won|lost|archived,
score, seen, createdAt, updatedAt
```
*CF-created only.* Pro-scoped read/update. Composite index (proId, state, createdAt desc) powers the pipeline filters.

### quotes/{id}
```
id, requestId, proId, proName, proPhotoURL?, customerId, serviceName,
lines[{label,kind:labor|material|fee,amount}], discount, taxPct,
subtotal, tax, total, durationHours?, proposedSlot?{date,start,end},
note?, expiresAt, status: sent|accepted|declined|expired|withdrawn|change_requested,
createdAt, updatedAt
```
Totals & lines immutable after send (rules); only customer may set accepted/declined/change_requested; only the pro may withdraw.

### conversations/{customerId__proId__requestId}
```
id, participants[uid,uid], customerId, proId,
participantNames{uid:name}, participantPhotos?,
requestId?, quoteId?, bookingId?,
lastMessage{text,at,senderId}, unread{uid:number}, typing?,
updatedAt
```
**Subcollection** `messages/{id}`:
```
id, conversationId, senderId, type: text|image|file|location|quote|appointment|booking|system,
text?, imageURL?, payload?{...}, createdAt, readBy[], status?
```
Messages append-only (no client delete). Conversation bookkeeping (`lastMessage`, `unread`) by CF `onMessageCreated`. Query: participants array-contains + updatedAt desc (composite index).

### bookings/{id}
```
id, requestId, quoteId?, customerId, customerName, proId, proName, proPhotoURL?,
serviceId, serviceName, scheduledAt?{date,start,end}, address?, subcity?,
total, status: requested|confirmed|rescheduled|in_progress|completed|cancelled|no_show|disputed,
timeline[{at,kind,label,by?}], reviewed, paid, createdAt, updatedAt
```
Created exclusively by CF on quote acceptance (`onQuoteAccepted`) — transactional with status updates.

### reviews/{id}
```
id, bookingId, requestId, customerId, customerName, proId,
overall, quality, communication, professionalism, value, punctuality (1..5),
text?, photos?, proResponse?, reported?, createdAt
```
Public read; customer-created once; pro may append `proResponse` only. Reputation aggregation in CF.

### notifications/{id}
```
id, uid, kind: message|request|quote|booking|payment|review|lead|system,
title, body, deepLink?, read, createdAt
```
CF-written only; per-uid read + `read` flag update by owner.

### favorites/{customerUid__proUid} — `{id, customerId, proId, createdAt}` (owner-scoped)
### payments/{id} — `{id, bookingId, payerUid, payeeUid, amount, currency:'ETB', method, status, createdAt}` (CF-only writes; Stripe webhooks in Phase 3)
### disputes/{id} · reports/{id} — created by the involved user; admin/CF thereafter
### fcmTokens/{token} — `{uid, token, platform, updatedAt}` for push fan-out

## Denormalization choices
- `participantNames/Photos` on conversations → list rendering without joins
- `customerName`, `proName`, `serviceName`, `proPhotoURL` on requests/quotes/bookings → detail screens read one doc
- `lastMessage` + `unread` map → chat list in one query
- Rating/reviewCount on professionals → directory ranking without reading reviews

## Query patterns & indexes
See `firestore.indexes.json` (13 composite indexes covering every list screen: requests-by-date, leads pipeline, quotes-by-request, conversations-by-participant, bookings both directions, notifications ×2, reviews-by-pro, professionals-by-service+rating, payments-by-payee).

## Sizing notes
- messages: paginated 40/listener, `startAfter` cursor for history
- notifications: capped at 60/client, TTL cleanup policy (Phase 3)
- professionals directory: filtered by `serviceIds array-contains` before client-side ranking re-runs the engine for display
