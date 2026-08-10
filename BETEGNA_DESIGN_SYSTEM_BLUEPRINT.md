# BETEGNA (ቤተኛ) — COMPREHENSIVE UI/UX DESIGN SYSTEM & INTERFACE BLUEPRINT

**Document Version:** 4.0.0-PROD  
**Author:** Expert Product Designer (UI/UX) & Senior Mobile Systems Architect  
**Platform Target:** High-Conversion Responsive Web, iOS & Android (Ionic Capacitor)  
**Domain Benchmark:** Airbnb, Uber, and TaskRabbit  

---

## EXECUTIVE DESIGN SYSTEM OVERVIEW

Betegna is an **all-in-one local services marketplace** built on a high-conversion, consumer-facing design system. Unlike fragmented legacy marketplaces, Betegna seamlessly integrates a **Dual-Mode Shell** ("Client" and "Tasker") into a single application. 

Our UI/UX blueprint prioritizes **high contrast**, **universal accessibility (WCAG AA compliance)**, and an effortless, **thumb-friendly navigation system** optimized for both casual homeowners and professional gig workers.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        BETEGNA UNIFIED DESIGN SYSTEM ARCHITECTURE                      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
        ┌───────────────────────────────────┴───────────────────────────────────┐
        ▼                                                                       ▼
┌──────────────────────────────────────────────┐ ┌──────────────────────────────────────────────┐
│       CLIENT MARKETPLACE ENVIRONMENT         │ │      TASKER BUSINESS DASHBOARD ENVIRONMENT   │
│  "Clean, Trustworthy Consumer Booking"       │ │  "Professional, Subliminal Worker Cue"       │
├──────────────────────────────────────────────┤ ├──────────────────────────────────────────────┤
│ • Palette: Crisp Off-Whites (slate-50),      │ │ • Palette: Deep Indigo (indigo-950), Dark    │
│   Slate Blue (slate-900), & Emerald Green    │ │   Teal (teal-600), & Slate-900 Cards         │
│ • Persistent Top Search Bar + Icon Chips     │ │ • Top-Nav Accent Banner: "ACTIVE WORKER MODE"│
│ • Provider Card UI with Bold Hourly Rate     │ │ • Real-Time Earnings Summary & Lead Feed     │
│ • Bottom Bar: Explore, Bookings, Inbox, User │ │ • Bottom Bar: Dashboard, Jobs, Inbox, Profile│
└──────────────────────────────────────────────┘ └──────────────────────────────────────────────┘
```

---

## 1. DUAL-MODE INTEGRATED SHELL & TOGGLE

### 1.1 Global Switcher (Visual Anchor)
- **Design Pattern:** A distinct, persistent visual anchor pill located in the top-right header on desktop (`[ 👤 Client ] [ 💼 Tasker ]`) and integrated as a sliding toggle card inside the mobile menu and user profile (`src/pages/Profile.jsx`).
- **Interactive Behavior:** Tapping the switcher triggers an instant state change via `src/lib/AppModeContext.jsx`. The application updates the `data-app-mode="client" | "tasker"` attribute on `document.documentElement` and dynamically swaps the 4-tab mobile bottom navigation bar without reloading the page or requiring re-authentication.

### 1.2 Distinct Visual Environments
- **Client Mode (`data-app-mode="client"`):**
  - **Color Palette:** Utilizes crisp off-whites (`#f8fafc` / `bg-slate-50`), deep Slate blue brand text (`#0f172a`), and vibrant **Emerald Green** accents (`#059669` / `bg-emerald-600`) for success, CTA buttons, and booking states.
  - **Emotional Tone:** Clean, welcoming, trustworthy, and e-commerce-oriented.
- **Tasker Mode (`data-app-mode="tasker"`):**
  - **Color Palette:** Shifts the top-nav banner and subtle accents to **Indigo and Dark Teal** (`from-indigo-950 via-indigo-900 to-teal-900`, `#34d399` teal badges).
  - **Emotional Tone:** Provides an immediate, subliminal visual cue that the user is now **"working"** on their business dashboard. The darker, command-center aesthetic (`bg-slate-950`) reduces screen glare during outdoor field work.

---

## 2. NAVIGATION ARCHITECTURE & HIERARCHY

### 2.1 Primary Bottom Navigation Bar (4–5 Core Tabs)
To minimize cognitive load and maximize thumb-reach ergonomics on iOS and Android devices, primary mobile navigation is strictly limited to 4 core tabs (with an optional center action button):

```
CLIENT MOBILE NAV BAR (Airbnb / Uber Style):
 ┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
 │  🔍 Explore │   📋 Tasks  │   [ + Post ]│  📖 Bookings│  💬 Inbox   │
 └─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘

TASKER MOBILE NAV BAR (Field Worker CRM Style):
 ┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
 │ 📊 Dashboard│   💼 Leads  │ [ $ Earned ]│  📅 Schedule│  💬 Inbox   │
 └─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### 2.2 Search & Filter Layout (Zero-Friction Category Chips)
- **Persistent Top Search Bar:** Located at the top of the Client Home screen (`src/pages/Home.jsx`), styled with a frosted glassmorphism container (`bg-white/10 backdrop-blur-md`).
- **Immediate Icon Chips:** Directly below the search bar, 6 tappable category pills (`✨ Cleaning`, `🔧 Repairs`, `📦 Delivery`, `🛒 Shopping`, `🎉 Events`, `🌱 Farming`) eliminate typing friction on touchscreens. Tapping any chip instantly filters available local Taskers.

---

## 3. TYPOGRAPHY, SPACING, & CARD DESIGN

### 3.1 Typography Hierarchy & Cross-Platform Font Tokens
Betegna uses a clean, highly readable sans-serif typography stack (`'Plus Jakarta Sans', 'Inter', -apple-system, SF Pro, Roboto, system-ui`):

| Token Name | Tailwind Scale | Font Weight | Line Height | Usage Context |
| :--- | :--- | :--- | :--- | :--- |
| `display-1` | `text-4xl sm:text-5xl lg:text-6xl` | `font-black` (900) | `1.1` | Hero headlines on landing pages |
| `heading-1` | `text-2xl sm:text-3xl` | `font-extrabold` (800) | `1.2` | Major page section titles & modal titles |
| `heading-2` | `text-lg sm:text-xl` | `font-bold` (700) | `1.3` | Card headers, Tasker names, and pricing callouts |
| `body-main` | `text-sm sm:text-base` | `font-normal` (400) / `font-medium` (500) | `1.6` | Task descriptions, bio text, and scoping answers |
| `caption` | `text-xs` | `font-semibold` (600) | `1.4` | Badges, timestamps, and metadata tags |

### 3.2 Spacing & Grid System (16dp/24dp Padding Rule)
- Content blocks enforce a strict **8dp/16dp/24dp baseline grid** (`p-4 sm:p-6 lg:p-8`).
- Content separation relies on **card borders** (`border border-slate-200/80 dark:border-slate-800`) and **soft drop shadows** (`shadow-sm hover:shadow-lg`) rather than heavy horizontal rules, giving the UI maximum breathing room.

### 3.3 Provider Card UI (`TaskerCard`) — Vertical Data Callouts
Our Tasker profile preview card is engineered to display all critical booking decisions vertically at a glance:

```
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────┐  │
│  │   [ HEADSHOT PHOTO (100% width, 192px height) ]  │  │
│  │                                                  │  │
│  │   [ 🛡 Verified Badge ]      [ 450 ETB/hr ] ◄────┼──┼─► Bold Hourly Rate Callout
│  └──────────────────────────────────────────────────┘  │
│  • Dawit Abebe                 • Addis Ababa (Bole)    │
│  • ★ 4.9 (42 reviews)          • 42 Tasks Completed    │
│  • "Experienced handyman & electrician with 6+ yrs..." │
│  • [ 🔧 Repairs ] [ 🎉 Events ] [ ✨ Cleaning ]        │
│  ┌──────────────────────────────────────────────────┐  │
│  │              [   BOOK DAWIT   ]                  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 4. REAL-TIME DATA & MICRO-INTERACTIONS

### 4.1 Live Tracking Interface (`<LiveTrackingMap />`)
- **Split-Screen Route Visualizer (`src/components/shared/LiveTrackingMap.jsx`):**
  - When a booking transitions to `en_route` or `in_progress` (`src/pages/BookingDetail.jsx`), the top half of the screen renders a split-screen interactive SVG vector map.
  - **Smooth Micro-Animation:** Displays the Tasker's avatar icon (`💼`) smoothly animating along a dashed emerald route line (`#059669`) toward the client's destination pin (`⌂`).
  - **Real-Time Status Header:** Renders dynamic ETA callouts (`"Tasker arriving in 8 mins"`, `"On-site in progress"`) and a pulsing geofence ring around the Tasker icon.
  - **Contact & Action Bar:** Immediate action buttons for **Call (Masked VoIP via Twilio Proxy)** and **Chat with Tasker**.

### 4.2 Conversational UI (`Messages.jsx`)
- **Distraction-Free Chat:** Clean sent/received message bubbles (`bg-emerald-600 text-white` for sent, `bg-white text-slate-900 border border-slate-200` for received).
- **Rich-Media Attachments:** Support for before/after task photo uploads and store receipt attachments (for zero-commission expense pass-through reimbursement).
- **System Status Banners:** Inline conversational event cards (e.g., *"Task Scheduled — Tomorrow at 9:00 AM"*, *"Payment Authorized"*, *"Job Completed"*).

---

## 5. COLOR TOKEN PALETTE & DARK MODE COMPLIANCE STRATEGIES

### 5.1 CSS / Tailwind Token Palette

| Semantic Name | Light Mode Value | Dark Mode Value | Usage Context |
| :--- | :--- | :--- | :--- |
| `--bg-main` | `#f8fafc` (`slate-50`) | `#0f172a` (`slate-950`) | Global application background |
| `--card-bg` | `#ffffff` (`white`) | `#1e293b` (`slate-900`) | Tasker cards, booking cards, modals |
| `--card-border` | `#e2e8f0` (`slate-200`) | `#334155` (`slate-800`) | Card outlines & subtle separators |
| `--text-primary` | `#0f172a` (`slate-900`) | `#f8fafc` (`slate-50`) | Primary headlines & titles |
| `--text-muted` | `#64748b` (`slate-500`) | `#94a3b8` (`slate-400`) | Descriptions, captions, timestamps |
| `--client-accent` | `#059669` (`emerald-600`) | `#10b981` (`emerald-500`) | Client CTA buttons, verified badges, prices |
| `--tasker-accent` | `#312e81` (`indigo-900`) | `#14b8a6` (`teal-500`) | Tasker top-nav banner & worker badges |

### 5.2 Dark Mode Compliance Strategy
1. **WCAG AA Contrast Enforcement:** All primary text against background maintains a contrast ratio > **4.5:1** (and > **3:1** for large text and icons).
2. **Surface Elevation Elevation:** In dark mode (`dark:bg-slate-900`), cards use a 1px border (`dark:border-slate-800`) and subtle white opacity highlights (`rgba(255,255,255,0.05)`) instead of heavy black drop-shadows.
3. **No Pure Black Backgrounds:** Uses deep slate blue-black (`#0f172a`) to reduce eye fatigue and OLED smearing on mobile screens.

---

## 6. KEY USER FLOW WIREFRAME SPECIFICATIONS

### Flow 1: Customer Booking & Scoping Flow
```
[ Home: Category Chips ] ──► [ BrowseTaskers: Filter by City/Rate ] ──► [ TaskerProfile: Vertical Card ]
                                                                                  │
                                                                                  ▼
[ MyBookings: Active Tracking ] ◄── [ BookingDetail: <LiveTrackingMap /> ] ◄── [ BookTasker: Scoping Form ]
```

### Flow 2: Tasker Onboarding & Lead Management Flow
```
[ Profile: Switch to Tasker Mode ] ──► [ Worker Dashboard: KPI Summary ] ──► [ BrowseTasks: Lead Feed ]
                                                                                     │
                                                                                     ▼
[ MyBookings: Complete Job ] ◄── [ Messages: Upload Receipt / After Photo ] ◄── [ TaskDetail: Submit Offer ]
```

---

## 7. SUMMARY OF REWRITTEN & UPGRADED CODE FILES (BRANCH `v2-dual-mode-redesign`)

1. **`src/lib/AppModeContext.jsx`** — Created global animated mode switcher (`client` ↔ `tasker`) with localStorage persistence and dynamic CSS token injection.
2. **`src/Layout.jsx`** — Rewritten with top-nav Tasker Working Banner, persistent animated toggle pill (`[ 👤 Client ] [ 💼 Tasker ]`), and 4-tab sticky mobile bottom bar that dynamically swaps between Client and Tasker tabs.
3. **`src/components/shared/LiveTrackingMap.jsx`** — Built split-screen interactive SVG vector map with smooth micro-animation of Tasker moving along route toward client destination, real-time ETA, and masked VoIP/Chat buttons.
4. **`src/pages/Home.jsx`** — Completely rewritten to support both the **Client E-Commerce Marketplace** (with frosted search bar, tappable category icon chips, and vertical Provider Card UI with bold hourly rate callouts) and the **Tasker Business Dashboard** (with Net Earnings KPI cards, today's schedule, and quick business tools).
5. **`src/pages/Profile.jsx`** — Added Airbnb/Uber style Dual-Mode Integrated Switcher Card at the top of the profile.
6. **`src/pages/BookingDetail.jsx`** — Integrated `<LiveTrackingMap />` for active bookings in `accepted`, `en_route`, and `in_progress` states.
7. **`BETEGNA_DESIGN_SYSTEM_BLUEPRINT.md`** — This authoritative UI/UX design system specification document.
