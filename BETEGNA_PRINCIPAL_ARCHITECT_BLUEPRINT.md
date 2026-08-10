# BETEGNA (ቤተኛ) — MASTER SYSTEM BLUEPRINT & PRODUCT ARCHITECTURE SPECIFICATION
**Document Version:** 3.0.0-PROD  
**Author:** Principal Product Architect & Senior Full-Stack Engineer  
**Platform Target:** Hybrid iOS, Android (Ionic Capacitor / React Native), and Responsive Web  
**Domain Benchmark:** TaskRabbit Two-Sided Service Marketplace  

---

## EXECUTIVE ARCHITECTURE OVERVIEW

Betegna is an **"all-in-one local services marketplace"** designed to connect independent Service Providers (**Taskers**) with Customers (**Clients**) across mobile and web platforms. The system operates on a **Unified Identity Model** where an authenticated user can seamlessly toggle between Client Mode (requesting and paying for jobs) and Tasker Mode (offering services, receiving bookings, and collecting payouts).

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │               BETEGNA UNIFIED CLOUD CORE               │
                                    └───────────────────────────┬────────────────────────────┘
                                                                │
           ┌────────────────────────────────────────────────────┴────────────────────────────────────────────────────┐
           ▼                                                    ▼                                                    ▼
┌─────────────────────────────────────┐      ┌─────────────────────────────────────┐      ┌─────────────────────────────────────┐
│       CLIENT PORTAL (iOS/Android)   │      │      TASKER PORTAL (iOS/Android)    │      │         ADMIN & SUPPORT DESK        │
├─────────────────────────────────────┤      ├─────────────────────────────────────┤      ├─────────────────────────────────────┤
• Email / OAuth2 SSO Integration      │      • Multi-Step KYC & Background Check   │      • Full Audit Trail & Chat History     │
• Category Drill-Down & Scoping Engine│      • Geofenced Operating Radius (Polygon)│      • Evidence Photo Inspector            │
• Post-a-Task / Direct Book Scheduling│      • Live Job Offer Feed & Lead Manager  │      • Dispute Resolution & Arbitration    │
• Stripe Payment Authorization Hold   │      • Stripe Connect Payouts Engine       │      • Partial / Full Refund Controller    │
• Double-Blind Post-Job Review        │      • Dynamic Hourly & Flat Rate Pricing  │      • Automated & Manual Escrow Release   │
└─────────────────────────────────────┘      └─────────────────────────────────────┘      └─────────────────────────────────────┘
```

---

## MODULE 1: DUAL-USER ARCHITECTURE & ONBOARDING

### 1.1 Technical Requirements

#### 1.1.1 Unified Identity & Authentication Model
- **Single Sign-On (SSO) & Social Auth:** Support email/password (with Argon2id hashing or Firebase Auth/Auth0 integration), Apple ID, and Google OAuth 2.0.
- **Unified Profile Token (`user_id`):** Users maintain a single primary account record. Switching between Client and Provider modes requires no re-authentication; permissions are dynamically evaluated via a JWT claim (`roles: ['client', 'tasker_verified']`).
- **Session Management:** OAuth 2.0 / OpenID Connect with short-lived access tokens (15 minutes) and rotating refresh tokens (30 days) stored in SecureStorage (iOS Keychain / Android Keystore for Capacitor apps).

#### 1.1.2 Customer Portal & Default Payment Integration
- **Customer Onboarding Pipeline:** 
  - Verification of mobile phone via SMS OTP (`Twilio Verify` or `Firebase Phone Auth`).
  - Creation of a Stripe Customer object (`cus_*`) immediately upon account registration.
  - Setup Intent integration via Stripe Elements/PaymentSheet to securely vault credit/debit cards without sensitive PAN data touching Betegna's backend (PCI-DSS SAQ-A compliance).
- **Default Address Book:** Customers store labeled geocoded addresses (`home`, `work`, `custom`) using Google Places Autocomplete API with latitude/longitude coordinate caching.

#### 1.1.3 Multi-Step Provider Vetting & Onboarding Pipeline
- **Step 1: Basic Identity & Bio:** Full legal name, date of birth, residential address, profile photo (with automated face detection via AWS Rekognition / Google Vision to reject avatars/scenery), and professional biography.
- **Step 2: KYC & Background Verification:**
  - **Identity Verification:** Stripe Identity API integration. Checks government-issued ID (Passport, National Kebele ID, Driver’s License) and performs live liveness selfie comparison.
  - **Criminal Background Check:** Automated Checkr API webhook integration. Initiates criminal record search; status transitions asynchronously (`pending` -> `clear` -> `consider` -> `suspended`).
- **Step 3: Financial Onboarding (Stripe Connect Express):**
  - Providers onboard via embedded Stripe Connect Express.
  - Generates a Stripe Connected Account (`acct_*`) configured for automated payout transfers via ACH Direct Deposit or instant card payout.
- **Step 4: Operational Radius & Geofencing:**
  - Providers define work boundaries using a draggable circular radius (e.g., 15 km around a home point) OR custom multi-vertex polygon geofencing saved as a PostGIS `GEOMETRY(Polygon, 4326)` or spatial GeoHash index.
- **Step 5: Category Skill & Rate Configuration:**
  - Providers select from approved categories, define billing models (`hourly` vs. `flat_rate`), set minimum hourly rates (enforced against category floor prices), and upload portfolio work photos.

---

### 1.2 Database Entity Relationship Suggestions (Module 1 Schema)

```sql
-- USERS TABLE (Unified Identity)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone VARCHAR(20) UNIQUE,
    phone_verified_at TIMESTAMPTZ,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    stripe_customer_id VARCHAR(100) UNIQUE,
    is_tasker BOOLEAN DEFAULT FALSE,
    tasker_status VARCHAR(32) DEFAULT 'inactive' CHECK (tasker_status IN ('inactive', 'onboarding', 'pending_vetting', 'active', 'suspended')),
    default_payment_method_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TASKER PROFILES (1:1 with Users when is_tasker = true)
CREATE TABLE tasker_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    stripe_connect_account_id VARCHAR(100) UNIQUE,
    stripe_connect_status VARCHAR(32) DEFAULT 'pending' CHECK (stripe_connect_status IN ('pending', 'active', 'restricted')),
    identity_verification_id VARCHAR(100), -- Stripe Identity Session ID
    identity_verified_at TIMESTAMPTZ,
    checkr_candidate_id VARCHAR(100),
    checkr_report_id VARCHAR(100),
    checkr_status VARCHAR(32) DEFAULT 'pending' CHECK (checkr_status IN ('pending', 'clear', 'consider', 'failed')),
    bio TEXT,
    operational_center GEOMETRY(Point, 4326),
    operational_radius_km INT DEFAULT 15,
    operational_polygon GEOMETRY(Polygon, 4326),
    completed_jobs_count INT DEFAULT 0,
    average_rating NUMERIC(3, 2) DEFAULT 0.00,
    total_reviews_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TASKER SKILLS & RATES (1:M from Tasker Profile)
CREATE TABLE tasker_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tasker_id UUID REFERENCES tasker_profiles(user_id) ON DELETE CASCADE,
    category_id VARCHAR(64) NOT NULL,
    rate_type VARCHAR(16) DEFAULT 'hourly' CHECK (rate_type IN ('hourly', 'flat_rate')),
    hourly_rate_etb NUMERIC(10, 2) NOT NULL,
    minimum_hours INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tasker_id, category_id)
);
```

---

### 1.3 Critical User Stories & Acceptance Criteria

| ID | Persona | User Story | Acceptance Criteria (Gherkin / Technical) |
| :--- | :--- | :--- | :--- |
| **US-1.1** | New Customer | *As a new customer, I want to sign up with my email/social account and save my default card, so that I can book a Tasker immediately.* | • **Given** an unauthenticated visitor, **When** they complete OTP verification and add a valid Visa/Mastercard via Stripe PaymentSheet, **Then** a Stripe Customer object is created, the card is vaulted without hitting our app servers, and `default_payment_method_id` is persisted. |
| **US-1.2** | Prospective Tasker | *As an aspiring Tasker, I want to submit my ID and pass a background check, so that I can earn the "Verified" badge and receive client job leads.* | • **Given** a user completing Step 2 of vetting, **When** they submit government ID and selfie via Stripe Identity, **Then** an asynchronous webhook confirms match score >= 95%, updates `tasker_profiles.identity_verified_at`, and triggers Checkr background verification. |
| **US-1.3** | Verified Tasker | *As a verified Tasker, I want to draw my operating work area on a map and set my hourly rates per skill, so that I only receive jobs within my commuting range and at my required price.* | • **Given** an active Tasker in profile settings, **When** they set a 15 km radius around coordinates (9.0227, 38.7468) and set "Repairs" rate to 450 ETB/hr, **Then** the spatial PostGIS column is indexed and any search query outside 15 km excludes this Tasker. |
| **US-1.4** | All-in-One User | *As a user who both buys and sells services, I want to switch between Client Mode and Tasker Mode from a single profile button, so that I don't need two separate accounts.* | • **Given** an authenticated user where `tasker_status = 'active'`, **When** they tap "Switch to Tasker Mode" in their profile, **Then** the UI transitions to the Worker dashboard, updating bottom navigation tabs without requiring credentials or token reissue. |

---

## MODULE 2: SEARCH, MATCHING, & BOOKING ENGINE

### 2.1 Technical Requirements

#### 2.1.1 Service Catalog & Dynamic Scoping Engine
- **Hierarchical Service Taxonomy:** Categories (`parent_id = NULL`) -> Subcategories -> Dynamic Scoping Questionnaires stored in JSONB.
- **Scoping Questionnaire Schema (`scoping_config`):** Each category defines interactive questions (e.g., "How many rooms?", "Do you have elevator access?", "Do you require the Tasker to bring a ladder?").
- **Dynamic Price & Time Estimator:** Based on scoping answers, the frontend calculates an estimated duration (e.g., `base_hours + (rooms * 0.75)`) and displays projected cost ranges before booking.

#### 2.1.2 Real-Time Spatial & Algorithmic Matching Engine
- **Spatial Indexing:** Uses PostgreSQL PostGIS `ST_DWithin` and `ST_Distance` on geography points/polygons, or Redis `GEORADIUS` / `GEOSEARCH` for high-throughput sub-millisecond location queries.
- **Tasker Ranking & Scoring Algorithm:**
  ```text
  MatchScore = (w1 * DistanceScore) + (w2 * NormalizedRating) + (w3 * ResponseRate) + (w4 * CompletedJobsScore) - (w5 * PriceVariance)
  ```
  - `DistanceScore`: Linear decay from job coordinates (1.0 at 0 km -> 0.0 at radius edge).
  - `ResponseRate`: Percentage of chat messages/booking requests responded to within 15 minutes.
  - `CompletedJobsScore`: Logarithmic dampening (`log10(completed_jobs + 1)` to prevent veteran monopolization while boosting proven workers).
- **Real-Time Calendar Availability Filter:** Filters out Taskers who have existing locked slots (`booking_slots`) overlapping the requested window.

#### 2.1.3 Booking System & Automated Slot Locking
- **Two Booking Modes Supported:**
  - **Instant Book:** If Tasker enables "Instant Book" for a category, booking immediately transitions to `accepted` state upon payment authorization hold.
  - **Request-to-Book:** Booking enters `requested` state. Tasker has a **2-Hour Automated TTL Lock** to accept or decline before the request expires and authorization hold is dropped.
- **Concurrency & Double-Booking Protection:** Uses database-level **Pessimistic Locking** (`SELECT ... FOR UPDATE` on `tasker_availability_slots`) or Redis distributed mutex (`Redlock`) during slot reservation to prevent race conditions when two clients book the same Tasker at the same second.

---

### 2.2 Database Entity Relationship Suggestions (Module 2 Schema)

```sql
-- SERVICE CATEGORIES
CREATE TABLE service_categories (
    id VARCHAR(64) PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_am VARCHAR(100) NOT NULL,
    parent_id VARCHAR(64) REFERENCES service_categories(id),
    base_floor_rate_etb NUMERIC(10, 2) DEFAULT 150.00,
    scoping_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE
);

-- TASKER AVAILABILITY & CALENDAR SLOTS
CREATE TABLE tasker_calendar_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tasker_id UUID REFERENCES tasker_profiles(user_id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    locked_by_booking_id UUID, -- References bookings(id)
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- INDEX for fast spatial & availability matching
CREATE INDEX idx_tasker_calendar_time ON tasker_calendar_blocks(tasker_id, start_time, end_time) WHERE is_available = TRUE;

-- BOOKINGS TABLE
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'BET-849201'
    client_id UUID NOT NULL REFERENCES users(id),
    tasker_id UUID NOT NULL REFERENCES tasker_profiles(user_id),
    category_id VARCHAR(64) NOT NULL REFERENCES service_categories(id),
    booking_mode VARCHAR(20) NOT NULL CHECK (booking_mode IN ('instant_book', 'request_to_book')),
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'requested', 'accepted', 'en_route', 'in_progress', 'completed', 'paid', 'declined', 'cancelled')),
    job_coordinates GEOMETRY(Point, 4326) NOT NULL,
    job_address_text TEXT NOT NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    scoping_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    agreed_hourly_rate_etb NUMERIC(10, 2) NOT NULL,
    estimated_duration_hours NUMERIC(4, 2) NOT NULL,
    estimated_total_etb NUMERIC(10, 2) NOT NULL,
    actual_hours_worked NUMERIC(4, 2),
    final_amount_etb NUMERIC(10, 2),
    cancellation_reason TEXT,
    cancelled_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_status ON bookings(tasker_id, status);
CREATE INDEX idx_bookings_geo ON bookings USING GIST(job_coordinates);
```

---

### 2.3 Critical User Stories & Acceptance Criteria

| ID | Persona | User Story | Acceptance Criteria (Gherkin / Technical) |
| :--- | :--- | :--- | :--- |
| **US-2.1** | Client | *As a client booking "House Cleaning", I want to answer questions about rooms, bathrooms, and supplies so that I get an accurate price estimate.* | • **Given** the user selects "Cleaning", **When** they answer `rooms: 3, bathrooms: 2, bring_supplies: true`, **Then** the scoping engine calculates `estimated_duration = 4.0 hours`, adds a 100 ETB supply surcharge, and filters Taskers who have selected `has_cleaning_supplies = true`. |
| **US-2.2** | Client | *As a client in Addis Ababa, I want to see a map and list of Taskers available tomorrow at 9 AM sorted by quality and price, so I can pick the best worker.* | • **Given** job coordinates and `scheduled_start = Tomorrow 09:00`, **When** the search executes, **Then** the PostGIS/Redis query returns Taskers whose `operational_polygon` contains the coordinates AND who have an open slot in `tasker_calendar_blocks`, ranked by `MatchScore`. |
| **US-2.3** | Client & Tasker | *As a client using Instant Book, I want my selected time slot to be immediately reserved so that no other client can double-book my Tasker.* | • **Given** a Tasker with an open slot from 09:00 to 13:00, **When** Client A submits Instant Book at 08:59:00.001, **Then** a pessimistic database lock sets `locked_by_booking_id = booking.id` and `is_available = FALSE`, causing any concurrent request from Client B to fail gracefully with a "Slot Just Reserved" alert. |

---

## MODULE 3: COMMUNICATION & WORKFLOW MANAGEMENT

### 3.1 Technical Requirements

#### 3.1.1 In-App Chat & VoIP (Secure WebSockets + Twilio Media)
- **Real-Time WebSocket Signaling:** Built on Socket.io / WebSockets (or Firebase Cloud Messaging + Firestore real-time listeners for Capacitor) with strict channel scoping (`channel: "booking:{booking_id}"`).
- **Anonymized & Masked Communications:** No personal phone numbers or direct email addresses are ever revealed in plain text.
  - Call routing uses **Twilio Voice Proxy / Masked Phone Numbers** (`Twilio Proxy Service`), bridging calls between temporary virtual numbers that expire 72 hours after job completion.
- **Media Attachments & Evidence Caching:**
  - Users can attach high-resolution images (`before_photo`, `after_photo`, `damage_photo`, `receipt_photo`) stored in private Amazon S3 buckets with CloudFront pre-signed URLs (valid for 60 minutes).
  - Photos uploaded in chat are automatically metadata-tagged with timestamp and EXIF GPS coordinates to serve as dispute verification evidence.

#### 3.1.2 The 7-State Job Lifecycle State Machine
Every booking must strictly follow a finite state machine (FSM). Unauthorized state transitions are rejected at the API middleware layer.

```
┌───────┐      Submit Request       ┌───────────┐     Tasker Accepts      ┌───────────┐
│ DRAFT ├──────────────────────────►│ REQUESTED ├────────────────────────►│  ACCEPTED │
└───────┘   (Stripe Auth Hold 100%) └─────┬─────┘    (Lock Time Slot)     └─────┬─────┘
                                          │                                     │
                             Tasker/Client│Decline/Cancel                       │ Tasker Taps "En Route"
                                          ▼                                     ▼
                                    ┌───────────┐                         ┌───────────┐
                                    │ CANCELLED │                         │  EN ROUTE │
                                    └───────────┘                         └─────┬─────┘
                                                                                │
                                                                   Tasker Arrives & Starts
                                                                                │
                                                                                ▼
┌───────┐  Escrow Capture + Payout  ┌───────────┐    Client Signs Off     ┌───────────┐
│  PAID │◄──────────────────────────┤ COMPLETED │◄────────────────────────┤IN PROGRESS│
└───────┘  (Deduct 15% Platform Fee)└───────────┘                         └───────────┘
```

#### 3.1.3 Notification Architecture (FCM / APNS + Twilio SMS)
- Every state transition emits an asynchronous event via Redis Pub/Sub or AWS EventBridge.
- A background worker dispatches:
  - **Push Notifications** (APNS for iOS, FCM for Android via `@capacitor/push-notifications`).
  - **Transactional SMS** fallback (if user is offline for > 5 minutes) via Twilio Programmable SMS.
  - **Email Receipts & Updates** via SendGrid / Postmark.

---

### 3.2 Database Entity Relationship Suggestions (Module 3 Schema)

```sql
-- CHAT CONVERSATIONS (1:1 with Bookings)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id),
    tasker_id UUID NOT NULL REFERENCES tasker_profiles(user_id),
    last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- CHAT MESSAGES
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system', 'location_share', 'invoice')),
    content TEXT NOT NULL,
    media_url TEXT,
    exif_latitude NUMERIC(10, 7),
    exif_longitude NUMERIC(10, 7),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conv ON chat_messages(conversation_id, created_at DESC);

-- STATE TRANSITION AUDIT LOG (Immutable History)
CREATE TABLE booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    previous_status VARCHAR(32),
    new_status VARCHAR(32) NOT NULL,
    changed_by_user_id UUID REFERENCES users(id),
    trigger_source VARCHAR(32) DEFAULT 'user_action' CHECK (trigger_source IN ('user_action', 'system_timeout', 'admin_override')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3.3 Critical User Stories & Acceptance Criteria

| ID | Persona | User Story | Acceptance Criteria (Gherkin / Technical) |
| :--- | :--- | :--- | :--- |
| **US-3.1** | Tasker & Client | *As a client, I want to message my Tasker inside the app and attach photos of the broken pipe without revealing my private phone number.* | • **Given** an accepted booking, **When** either party taps "Call" or "Message", **Then** the Twilio Proxy masks numbers; uploaded images are saved to encrypted S3 buckets with EXIF location extraction for evidence records. |
| **US-3.2** | Tasker | *As a Tasker heading to a job, I want to tap "En Route" so that the client is alerted and can see my ETA.* | • **Given** a booking in `accepted` state, **When** Tasker taps "En Route", **Then** the FSM updates status to `en_route`, inserts an immutable audit log row, and pushes an FCM/APNS alert: *"Your Tasker is on the way!"* |
| **US-3.3** | Tasker & Client | *As a Tasker finishing work, I want to submit my completed hours and upload an "After" photo so the client can inspect and sign off.* | • **Given** a booking in `in_progress` state, **When** Tasker submits `actual_hours_worked = 3.5` and uploads an after photo, **Then** status transitions to `completed`, alerting the client to approve or contest within 24 hours. |

---

## MODULE 4: ESCROW, PAYMENT, & PAYOUT MECHANICS

### 4.1 Technical Requirements

#### 4.1.1 Stripe Escrow & Authorization Hold Flow
- **Pre-Authorization Hold (`payment_intents`):**
  - When a booking moves to `requested` or `instant_book`, the backend creates a Stripe PaymentIntent with `capture_method: 'manual'` for 100% of `estimated_total_etb` + 15% contingency margin.
  - A hold is placed on the Customer's card. No charge is finalized until job completion.
- **Dynamic Capture upon Job Sign-Off:**
  - When the client signs off on completion (or 24-hour auto-completion window expires without dispute), the backend calls `stripe.paymentIntents.capture` for the exact final invoice amount (`final_amount_etb`).
- **Hold Renewal & Re-Authorization:** Stripe manual capture holds expire after 7 days. If a job is scheduled > 7 days in advance, the app saves a SetupIntent and re-authorizes the hold 48 hours before job commencement.

#### 4.1.2 Split-Payment Engine & Platform Service Fees
- **Automated Fee Deduction (`transfer_data`):**
  - Betegna operates as the Stripe platform account.
  - Platform Service Fee: **18.00%** deducted from the total labor cost.
  - Net Earnings (**82.00%**) are routed immediately to the Tasker's Connected Account (`stripe_connect_account_id`) via `transfer_data[destination]`.
- **Contingency Surcharges & Expense Reimbursement:**
  - If a Tasker purchases hardware/parts during the job (e.g., plumbing fixture for 800 ETB), they upload a photo of the store receipt in chat.
  - Client approves the expense in-app -> backend updates the PaymentIntent capture amount to include the zero-commission pass-through reimbursement.

#### 4.1.3 Automated Payouts Engine (Stripe Connect Express)
- **Direct Deposit Schedule:**
  - Configured for standard rolling 2-day payout schedules to the Tasker’s verified local bank account or debit card.
- **Instant Payouts Option:** Taskers with an active debit card attached can trigger an "Instant Payout" for a 1.5% express payout fee.

---

### 4.2 Database Entity Relationship Suggestions (Module 4 Schema)

```sql
-- TRANSACTIONS & ESCROW LEDGER
CREATE TABLE escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    client_id UUID NOT NULL REFERENCES users(id),
    tasker_id UUID NOT NULL REFERENCES tasker_profiles(user_id),
    stripe_payment_intent_id VARCHAR(100) UNIQUE NOT NULL, -- 'pi_...'
    stripe_charge_id VARCHAR(100),                         -- 'ch_...'
    stripe_transfer_id VARCHAR(100),                       -- 'tr_...'
    gross_amount_etb NUMERIC(10, 2) NOT NULL,
    platform_fee_percentage NUMERIC(5, 2) DEFAULT 18.00,
    platform_fee_etb NUMERIC(10, 2) NOT NULL,
    tasker_net_earnings_etb NUMERIC(10, 2) NOT NULL,
    expense_reimbursement_etb NUMERIC(10, 2) DEFAULT 0.00,
    escrow_status VARCHAR(32) NOT NULL DEFAULT 'authorized' CHECK (escrow_status IN ('authorized', 'captured', 'released', 'partially_refunded', 'refunded', 'disputed')),
    authorized_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    captured_at TIMESTAMPTZ,
    payout_released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escrow_tasker_payout ON escrow_transactions(tasker_id, escrow_status);

-- EXPENSE RECEIPTS / REIMBURSEMENT ITEMS
CREATE TABLE booking_expense_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    tasker_id UUID NOT NULL REFERENCES tasker_profiles(user_id),
    description VARCHAR(255) NOT NULL,
    amount_etb NUMERIC(10, 2) NOT NULL,
    receipt_image_url TEXT NOT NULL,
    client_approved BOOLEAN DEFAULT FALSE,
    client_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

### 4.3 Critical User Stories & Acceptance Criteria

| ID | Persona | User Story | Acceptance Criteria (Gherkin / Technical) |
| :--- | :--- | :--- | :--- |
| **US-4.1** | Client | *As a client, I want my credit card authorized for the estimate when I book, but only charged after the job is completed, so my money is safe.* | • **Given** a booking estimate of 1,000 ETB, **When** the client submits booking, **Then** `stripe.paymentIntents.create({ amount: 100000, capture_method: 'manual' })` places an authorization hold; no money changes hands until status hits `completed`. |
| **US-4.2** | Tasker | *As a Tasker, I want the platform fee automatically deducted and my 82% net profit sent to my bank account upon job sign-off.* | • **Given** a completed 1,000 ETB job, **When** Client signs off, **Then** `stripe.paymentIntents.capture` charges 1,000 ETB, deducts 180 ETB platform fee, transfers 820 ETB to `tasker_profiles.stripe_connect_account_id`, and sets `escrow_status = 'released'`. |
| **US-4.3** | Tasker & Client | *As a Tasker who bought a replacement door handle for 600 ETB, I want to add the receipt to the bill so I am reimbursed without commission deduction.* | • **Given** an in-progress booking, **When** Tasker uploads receipt for 600 ETB and Client taps "Approve Expense", **Then** gross charge updates to `1,000 + 600 = 1,600 ETB`, platform fee remains 180 ETB (on labor only), and Tasker net payout becomes `820 + 600 = 1,420 ETB`. |

---

## MODULE 5: TRUST, SAFETY, & DISPUTE RESOLUTION

### 5.1 Technical Requirements

#### 5.1.1 Double-Blind Post-Job Review & Rating System
- **Double-Blind Mechanism:**
  - After a job transitions to `paid`, both Client and Tasker are prompted to submit a review (`rating: 1-5 stars`, `comment`, `tags`).
  - Neither party can see the other's review until **BOTH** have submitted their review OR until **14 days have elapsed** (whichever comes first).
  - Prevents retaliatory negative ratings when a Tasker holds a client accountable for unsafe conditions or when a client reviews poor craftsmanship.
- **Automated Rating Aggregate Maintenance:**
  - When reviews unlock, a PostgreSQL database trigger or background worker re-computes `average_rating` and `total_reviews_count` on `tasker_profiles` using a weighted Bayesian mean.

#### 5.1.2 Internal Dispute Resolution & Arbitration Engine
- **Dispute Trigger Hook:**
  - If a Client taps "Report Issue / Contest Job" within 24 hours of job completion, booking status transitions to `disputed` and `escrow_status` freezes at `captured` (funds are held in escrow and NOT released to the Tasker).
- **Admin Support Dashboard Inspector:**
  - Support agents have access to an internal investigation portal displaying:
    1. Full immutable chat log (`chat_messages`).
    2. Before/After evidence photos with EXIF GPS timestamp verification.
    3. GPS geofence audit trail (verifying whether Tasker was on-site during billed hours).
- **Resolution Action Controller:**
  - Support agents can issue:
    - `RELEASE_FULL`: 100% of funds released to Tasker.
    - `REFUND_FULL`: 100% of funds refunded to Client card.
    - `REFUND_PARTIAL(X%)`: Custom split (e.g., 50% refund to client, 50% net released to Tasker).

---

### 5.2 Database Entity Relationship Suggestions (Module 5 Schema)

```sql
-- DOUBLE-BLIND REVIEWS TABLE
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_user_id UUID NOT NULL REFERENCES users(id),
    target_user_id UUID NOT NULL REFERENCES users(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    quality_badges TEXT[] DEFAULT '{}', -- e.g., '{"punctual", "expert_tools", "clean_work"}'
    is_published BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    UNIQUE(booking_id, reviewer_user_id)
);

CREATE INDEX idx_reviews_target_published ON reviews(target_user_id, is_published, submitted_at DESC);

-- DISPUTES & ARBITRATION TICKETS
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_reference VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'DSP-901823'
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    escrow_transaction_id UUID NOT NULL REFERENCES escrow_transactions(id),
    raised_by_user_id UUID NOT NULL REFERENCES users(id),
    dispute_reason VARCHAR(64) NOT NULL CHECK (dispute_reason IN ('no_show', 'poor_quality', 'overcharged_hours', 'property_damage', 'unprofessional_conduct')),
    description TEXT NOT NULL,
    evidence_media_urls TEXT[] DEFAULT '{}',
    status VARCHAR(32) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_investigation', 'resolved_full_payout', 'resolved_full_refund', 'resolved_partial_split', 'dismissed')),
    assigned_admin_user_id UUID,
    resolution_notes TEXT,
    resolved_client_refund_etb NUMERIC(10, 2) DEFAULT 0.00,
    resolved_tasker_payout_etb NUMERIC(10, 2) DEFAULT 0.00,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disputes_status ON disputes(status, created_at ASC);
```

---

### 5.3 Critical User Stories & Acceptance Criteria

| ID | Persona | User Story | Acceptance Criteria (Gherkin / Technical) |
| :--- | :--- | :--- | :--- |
| **US-5.1** | Tasker & Client | *As a user submitting a review after a job, I want my rating hidden until the other person reviews me, so I can give honest feedback without fear of retaliation.* | • **Given** a booking in `paid` status, **When** Client submits a 3-star review, **Then** `is_published` remains `FALSE` and Tasker cannot view it until Tasker submits their own review OR 14 days elapse, at which point an automated cron sets `is_published = TRUE` for both. |
| **US-5.2** | Client | *As a client whose furniture was damaged during assembly, I want to contest the charge within 24 hours so that the payout is frozen and support can investigate.* | • **Given** a completed job within 24 hours, **When** Client taps "Contest Job" and uploads photos of damaged wood, **Then** a `disputes` record is created, `escrow_transactions.escrow_status` freezes at `disputed`, and automatic payout release to Tasker is halted. |
| **US-5.3** | Support Agent | *As a support admin, I want to inspect chat logs and EXIF photo evidence in a dashboard to arbitrate disputes and execute a partial refund.* | • **Given** an open dispute ticket, **When** Agent reviews EXIF GPS coordinates proving Tasker was on-site for only 1 hour instead of 3 billed hours and executes `REFUND_PARTIAL(66%)`, **Then** Stripe refunds 66% to client card, releases 34% net to Tasker, and closes the ticket. |

---

## MASTER SYSTEM ARCHITECTURE & ERD SUMMARY

```
┌─────────────────┐       1:1        ┌───────────────────────────────────┐
│      USERS      │◄─────────────────┤          TASKER_PROFILES          │
│                 │                  │                                   │
│  • id (PK)      │                  │  • user_id (PK/FK)                │
│  • email        │                  │  • stripe_connect_account_id      │
│  • stripe_cus   │                  │  • checkr_status                  │
│  • is_tasker    │                  │  • operational_polygon (PostGIS)  │
└────────▲────────┘                  └─────────────────▲─────────────────┘
         │                                             │
         │ 1:M                                         │ 1:M
         │                                             │
         │   ┌─────────────────────────────────────────┼────────────────────────┐
         │   │                                         │                        │
         │   │     ┌───────────────────────────────────┘                        │
         │   │     │                                                            │
         │   │     │ 1:M                                                        │ 1:M
┌────────┴───┴─────┴───┐     1:1     ┌───────────────────────────────────┐   ┌──┴────────────────────────────────┐
│       BOOKINGS       │◄────────────┤        ESCROW_TRANSACTIONS        │   │          TASKER_SKILLS            │
│                      │             │                                   │   │                                   │
│  • id (PK)           │             │  • id (PK)                        │   │  • tasker_id (FK)                 │
│  • client_id (FK)    │             │  • booking_id (FK)                │   │  • category_id (FK)               │
│  • tasker_id (FK)    │             │  • stripe_payment_intent_id       │   │  • hourly_rate_etb                │
│  • status (FSM)      │             │  • gross_amount_etb               │   └───────────────────────────────────┘
│  • scoping_answers   │             │  • escrow_status                  │
└────────▲─────────────┘             └─────────────────▲─────────────────┘
         │                                             │
         │ 1:1                                         │ 1:1
         │                                             │
┌────────┴─────────────┐                             ┌─┴─────────────────────────────────┐
│    CONVERSATIONS     │                             │             DISPUTES              │
│                      │                             │                                   │
│  • id (PK)           │                             │  • id (PK)                        │
│  • booking_id (FK)   │                             │  • booking_id (FK)                │
└──────────────────────┘                             │  • escrow_transaction_id (FK)     │
                                                     │  • status                         │
                                                     └───────────────────────────────────┘
```

---

## CONCLUSION & TECHNICAL ROADMAP FOR BETEGNA (PROD)

By implementing this 5-Module Principal Architect Specification:
1. **Betegna** guarantees a zero-friction, highly secure identity and financial onboarding experience via Stripe Identity, Checkr, and Stripe Connect.
2. Our **PostGIS/Redis spatial matching engine** delivers sub-millisecond location and availability filtering for local Ethiopian cities and beyond.
3. The **7-State Job Lifecycle FSM** paired with **Double-Blind Reviews** and **Stripe Escrow manual holds** eliminates marketplace leakage, protects client funds, and ensures Taskers receive guaranteed payouts.
