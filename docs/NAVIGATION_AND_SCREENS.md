# Navigation & Screen Inventory

## Shells
One account → `activeRole` selects the shell. Bottom tabs are role-aware; stacks sit above tabs; deep links target both.

```
RootNavigator (NavigationContainer, linking: betegna:// + https://betegna.app)
├─ !user → AuthStack: Welcome · Login · SignUp · Forgot
└─ user  → MainStack (key=activeRole)
   ├─ CUSTOMER TABS          ├─ PROFESSIONAL TABS
   │  Home      HomeScreen   │  Dashboard  ProDashboardScreen
   │  Requests  Requests     │  Leads      LeadsScreen
   │  Messages  ChatList     │  Calendar   ProCalendarScreen
   │  Profile   Profile      │  Messages   ChatList
   │                          │  Profile    Profile
   └─ Shared stack screens:
      RequestWizard (bottom sheet) · Matching · RequestDetail · ProProfile (sheet)
      BookingDetail · ReviewComposer (sheet) · Favorites · LeadDetail
      QuoteComposer (sheet) · ProProfileEdit · Notifications (sheet) · ChatThread (sheet)
```

## Screen inventory (24)

| Screen | Role | Purpose |
|---|---|---|
| WelcomeScreen | — | Brand hero, dual-mode entry (customer/pro), demo hint |
| LoginScreen / SignUpScreen / ForgotPasswordScreen | — | Email auth; role choice at signup; demo instant login |
| HomeScreen | C | NL hero search + example chips, popular services, categories, active requests, how-it-works, pro CTA |
| RequestsScreen | C | Active/past request list |
| RequestWizardScreen | C | 4 steps: service → dynamic questionnaire (1Q/screen) → schedule & location → review & submit |
| MatchingScreen | C | Animated matching pipeline (understand → scan → rank → notify) |
| RequestDetailScreen | C | Tabs: overview (summary/answers/timeline), quotes (accept/decline/chat), matched pros |
| ProProfileScreen | C | Hero (rating/badges), stats, about, services & pricing, portfolio, availability, reviews; message/quote/favorite |
| ReviewComposerScreen | C | 6 star dimensions + text, post-completion |
| FavoritesScreen | C | Saved professionals |
| ChatListScreen | C/P | Conversations w/ unread, typing preview, notifications bell |
| ChatThreadScreen | C/P | Real-time messages: text, quote cards, appointment proposals (accept in-chat), booking events, typing, read ticks |
| NotificationsScreen | C/P | Category chips, deep-linking rows, mark-all-read |
| ProfileScreen | C/P | Account, **mode switch**, language, theme, notification prefs, support/legal, sign out |
| BookingDetailScreen | C/P | Role-aware booking: schedule, total, timeline, start/complete (pro), cancel, review CTA (customer) |
| ProDashboardScreen | P | Earnings hero, new-leads/active-jobs stats, profile strength, today's schedule, upcoming, lead preview |
| LeadsScreen | P | Pipeline filters (all/new/contacted/quoted/won), lead cards with match score |
| LeadDetailScreen | P | Request + questionnaire answers, urgency, chat, decline, send quote |
| QuoteComposerScreen | P | Line items, discount/VAT/hours, day+time chips, note, live totals card, send |
| ProCalendarScreen | P | Upcoming jobs list + weekly working-hours editor + save |
| ProProfileEditScreen | P | Business info, categories, service area (sub-cities), services & pricing editor, portfolio, verification nudge |

## Deep link map
| Link | Screen |
|---|---|
| `betegna://request/:id` | RequestDetail |
| `betegna://conversation/:id` | ChatThread |
| `betegna://booking/:id` | BookingDetail |
| `betegna://professional/:id` | ProProfile |
| `betegna://leads` | Leads tab |
| `betegna://notifications` | Notifications |
| `betegna://` / `https://betegna.app/` | Welcome (logged out) / Home |

Unauthenticated deep link → auth stack → post-login restore lands on the original destination (NavigationContainer linking handles this automatically).

## Accessibility
- Every interactive element carries `accessibilityRole` + label (buttons, chips, toggles, switches, stars)
- Minimum 44pt touch targets; 8pt+ spacing between actions
- Text contrast checked against both palettes; status conveyed by color **and** text
- Focus/error states on all inputs; error messages tied to questions via the questionnaire engine
