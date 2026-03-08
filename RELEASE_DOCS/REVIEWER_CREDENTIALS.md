# Betegna - Reviewer Credentials & Testing Notes
**For Apple App Store & Google Play Store Reviewers**

---

## TEST ACCOUNT CREDENTIALS

### Primary Test Account (Poster/Requester)

```
Email:     review_test@betegna.app
Password:  SecureReview#2026!Marketplace
Status:    Active
Role:      Task Poster / Service Requester
```

**Account Details:**
- Name: Review Tester
- City: San Francisco, CA
- Phone: +1 (555) 012-3456
- Profile Complete: YES
- Verified Email: YES

**Permissions:**
- Can post tasks
- Can hire taskers
- Can message
- Can leave reviews
- Can delete account (test feature from settings)

---

### Secondary Test Account (Tasker)

```
Email:     review_tasker@betegna.app
Password:  SecureTasker#2026!Services
Status:    Active
Role:      Service Provider / Tasker
```

**Account Details:**
- Name: Test Tasker Pro
- City: San Francisco, CA
- Skills: General Handyman, Cleaning, Moving Help
- Hourly Rate: $25/hour
- Rating: 4.8 (test reviews)
- Verified: YES

**Permissions:**
- Can view available tasks
- Can submit offers on tasks
- Can message task posters
- Can accept/reject offers
- Can mark tasks complete

---

## ACCOUNT SETUP (If Needed)

### Manual Account Creation

If pre-created accounts are unavailable, create test accounts:

1. **Launch the app**
2. **Tap "Sign Up"**
3. **Enter test email and password above**
4. **Complete profile setup** (name, city, optional skills)
5. **Verify email** (check inbox, click verification link)

### Google Sign-In Alternative

If testing Google OAuth:
```
Google Account: review_test@gmail.com
[Use provided credentials]
```

---

## TESTING CHECKLIST FOR REVIEWERS

### 1. Authentication & Account Management

- [ ] Email/password registration works
- [ ] Google Sign-In authenticates correctly
- [ ] "Forgot Password" reset email received
- [ ] Login/logout functions properly
- [ ] Session persists across app restarts
- [ ] User profile loads with correct information
- [ ] **CRITICAL:** Account Deletion works
  - [ ] Can access "Delete Account" from Profile menu
  - [ ] Deletion requires email re-authentication
  - [ ] Account completely removed after confirmation
  - [ ] Cannot log back in with deleted account

### 2. Core Marketplace Features

- [ ] **Task Posting:** Can create new task with details
  - [ ] Title, description, category, budget fields work
  - [ ] Location/city selection functions
  - [ ] Submit button creates task successfully
  
- [ ] **Task Browsing:** Can view all posted tasks
  - [ ] Task list loads with multiple listings
  - [ ] Search/filter functionality works
  - [ ] Task details page displays correctly
  
- [ ] **Tasker Profile:** Can view tasker information
  - [ ] Profile shows name, skills, rating, hourly rate
  - [ ] Review history visible
  - [ ] Contact/message button available

### 3. User Interaction & Messaging

- [ ] **Messaging System:** Can send/receive messages
  - [ ] Real-time message delivery works
  - [ ] Message history preserved
  - [ ] Notification received for new messages
  
- [ ] **Task Offers:** Can submit and accept offers
  - [ ] Tasker can submit price/message offer on task
  - [ ] Task poster can view and accept offers
  - [ ] Status updates properly (pending → accepted)

### 4. Reviews & Ratings

- [ ] **Leave Review:** Can rate completed tasks
  - [ ] 1-5 star rating system works
  - [ ] Comment text field functional
  - [ ] Review submission saves successfully
  
- [ ] **View Reviews:** Can see rating history
  - [ ] Average rating calculated correctly
  - [ ] Individual reviews display with dates
  - [ ] Reviewer names shown (privacy preserved)

### 5. Privacy & Safety Features

- [ ] **Privacy Policy Accessible**
  - [ ] Profile → Privacy & Terms opens Legal page
  - [ ] Content includes data collection, usage, deletion info
  - [ ] Links functional (no dead links)
  
- [ ] **Report System Functional**
  - [ ] Can report inappropriate tasks (button present)
  - [ ] Report dialog opens with reason selection
  - [ ] Multiple report types available:
    - [ ] Spam
    - [ ] Inappropriate Content
    - [ ] Fraud/Deception
    - [ ] Harassment
    - [ ] Other (with description)
  - [ ] Submit report successfully saved
  
- [ ] **Account Deletion** (Already tested above)
  - [ ] Complete removal of personal data
  - [ ] Privacy respected after deletion

### 6. Compliance & Legal

- [ ] **Age Appropriateness:** Content suitable for 4+/Everyone
  - [ ] No explicit, violent, or hateful content
  - [ ] No adult services offered
  - [ ] Marketplace is professional and safe
  
- [ ] **No Deceptive Practices**
  - [ ] Pricing transparent (no hidden fees mentioned)
  - [ ] Features work as advertised
  - [ ] No misleading claims
  
- [ ] **No Spam/Malware**
  - [ ] App doesn't crash (if it does, note details)
  - [ ] No malicious links or phishing attempts
  - [ ] No unwanted permissions requests

### 7. Performance & Stability

- [ ] **App Stability**
  - [ ] Launches without crashing
  - [ ] Navigation between screens smooth
  - [ ] No freezing or excessive lag
  - [ ] Handles screen rotation properly
  
- [ ] **Data Loading**
  - [ ] Tasks load quickly from database
  - [ ] Images display correctly
  - [ ] No incomplete loading states

### 8. Platform-Specific Tests

#### **iOS Specific:**
- [ ] App icon displays correctly
- [ ] Splash screen shows on launch
- [ ] Safe area respected (no content under notch)
- [ ] iOS 15.0+ compatibility verified
- [ ] 64-bit support working (arm64 architecture)
- [ ] Orientation changes (portrait/landscape) handled
- [ ] Push notifications permission prompt appears

#### **Android Specific:**
- [ ] App icon displays on home screen
- [ ] Back button navigation works correctly
- [ ] System UI integration smooth
- [ ] Android SDK 22-35 compatibility
- [ ] Permissions dialog appears as needed
- [ ] Orientation changes handled properly
- [ ] Notch/safe area respected

### 9. Accessibility (Optional but Recommended)

- [ ] Text is readable size
- [ ] Color contrast sufficient for visibility
- [ ] Buttons are tappable size (minimum 44x44 pts)
- [ ] Form fields labeled clearly
- [ ] Error messages descriptive

---

## KNOWN LIMITATIONS & EXPECTED BEHAVIOR

### Expected Features in 1.0.1

✅ **Working Features:**
- User authentication (email & Google)
- Task posting and browsing
- User profiles and messaging
- Review/rating system
- Account deletion with re-auth
- Privacy policy and legal pages
- Report/moderation system for safety

❌ **Not Yet Implemented:**
- Payment/billing system (placeholder only)
- Image uploads for tasks
- Advanced search/filtering
- Block/restriction user features
- Notification badge counts
- Multi-language support beyond UI skeleton

⚠️ **Known Issues (If Any):**
[Add any known issues here - currently none reported]

---

## TEST SCENARIOS (Sample Workflows)

### Scenario 1: Post a Task and Hire a Tasker

1. Login as **review_test@betegna.app**
2. Navigate to "Post Task" (Home page → button)
3. Fill in:
   - Title: "Help moving boxes"
   - Description: "Need help moving household items"
   - Category: "Moving Help"
   - Budget: "$50-100"
   - Location: "San Francisco"
4. Submit and confirm creation
5. Logout
6. Login as **review_tasker@betegna.app**
7. Browse tasks → Find posted task
8. Submit offer: "I can help for $75/hour"
9. Logout
10. Login as **review_test@betegna.app**
11. View offers → Accept offer
12. Message tasker to coordinate
13. Mark complete and leave 5-star review

### Scenario 2: Test Account Deletion

1. Login as **review_test@betegna.app**
2. Navigate to Profile → Settings
3. Scroll to "Delete Account"
4. Tap "Delete Account"
5. Read confirmation dialog
6. Re-authenticate with email/password
7. Confirm deletion
8. Verify redirect to login screen
9. Attempt to login with deleted credentials
10. Confirm login fails (account deleted)

### Scenario 3: Test Safety Features

1. Login as **review_test@betegna.app**
2. Navigate to any task detail
3. Tap "Report Task" button (triangle icon)
4. Select reason: "Inappropriate Content"
5. Add optional description: "Test report submission"
6. Submit report
7. Confirm success message appears
8. Check Privacy & Terms page for safety info

---

## SUPPORT CONTACT

**For Reviewer Questions During Testing:**

📧 **Email:** app-review@betegna.app  
📧 **Support Email:** support@betegna.app  
🌐 **Privacy Policy:** https://betegna.app/privacy-policy  
🌐 **Terms of Service:** https://betegna.app/terms-of-service  

**Response Time:** 24 hours during business days

---

## BACKEND API ENDPOINTS (For Reference)

The app connects to Firebase backend:
- **Firestore Database:** Cloud-based data storage
- **Firebase Auth:** Secure authentication service
- **Firebase Messaging:** Real-time notifications
- **Firebase Realtime DB:** Live messaging features

No special reviewer access to backend needed - use app features only.

---

## TESTING ENVIRONMENT

**Build Information:**
- **iOS Version:** 1.0.1 (Build 2)
- **Android Version:** 1.0.1 (Build 2)
- **iOS SDK Target:** iOS 15.0+
- **Android API:** 22-35
- **Firebase Project:** betegna-9bc61

---

## ADDITIONAL NOTES

### Screenshots During Testing

When encountering issues, please screenshot:
- Error messages
- Unexpected behavior
- Crash screens
- Validation failures

### Device Testing

- **iOS:** Test on multiple iPhone sizes if possible (6.1", 6.7")
- **Android:** Test on phones (Pixel devices preferred) and tablets
- **Connectivity:** Test with WiFi and cellular data

### Browser Testing

For web version (if applicable):
- Test on Chrome, Safari (iOS), Firefox
- Test responsive design on tablet sizes

---

## REVIEWER CHECKLIST SUMMARY

**Before Submission - Verify All Items:**

- [ ] Build numbers incremented (iOS: 2, Android: 2)
- [ ] Version updated to 1.0.1
- [ ] All critical features tested
- [ ] No crashes on primary flows
- [ ] Privacy policy linked and accessible
- [ ] Account deletion working end-to-end
- [ ] Report system functional
- [ ] Test credentials provided above
- [ ] Support contact information included
- [ ] Release notes/changelog complete
- [ ] App Store metadata verified
- [ ] Screenshots match app content
- [ ] No forbidden terms in descriptions

---

**Credential Creation Date:** March 8, 2026  
**Valid Through:** Indefinitely (until account deletion test)  
**Last Updated:** March 8, 2026

---

**This document should be included with app store submissions or provided upon reviewer request.**
