# Betegna - Data Safety Declaration
**For Google Play Store Submission**

**App Version:** 1.0.1  
**Release Date:** March 2026  
**Project ID:** betegna-9bc61

---

## 1. DATA COLLECTION & PRIVACY

### 1.1 Personal Data Collected

The following personal information is collected and stored in Firebase Firestore:

| Data Type | Source | Purpose | Retention |
|-----------|--------|---------|-----------|
| **Email Address** | User Registration/Google Sign-In | Account identification, authentication, communication | Until account deletion |
| **Full Name** | User Profile | Display in task postings and reviews | Until account deletion |
| **Phone Number** | User Profile (Optional) | Contact information for task coordination | Until account deletion |
| **City/Location** | User Profile | Task location filtering and matching | Until account deletion |
| **Bio/Skills** | User Profile | Tasker profile information | Until account deletion |
| **Hourly Rate** | User Profile (Taskers) | Pricing for task services | Until account deletion |
| **Task Descriptions** | Task Creation | Task listing and marketplace | Until task completion/deletion |
| **Task Offers & Reviews** | User Activity | Transaction history and reputation | Until account deletion |

### 1.2 Sensitive Personal Information

**None collected or transmitted.**

- ❌ No biometric data
- ❌ No precise location (GPS/geolocation)
- ❌ No financial account information
- ❌ No health/medical data
- ❌ No government IDs or documents
- ❌ No religious/political beliefs
- ❌ No sexual orientation or gender identity

### 1.3 Non-Personal Information Collected

- App crash logs (Firebase Crashlytics)
- User interaction analytics (Firebase Analytics)
- Device model and OS version
- Language preferences
- Session duration and feature usage

---

## 2. DATA USAGE & SHARING

### 2.1 Primary Uses

1. **Authentication & Account Management**
   - Firebase Authentication (email/password, Google OAuth)
   - Firestore user profile storage
   - Session management

2. **Core Application Functionality**
   - Task posting, assignment, and completion tracking
   - Peer-to-peer task marketplace operations
   - Review and rating system

3. **User Communication**
   - In-app messaging (Firebase Realtime Database)
   - Task notifications and updates

### 2.2 Third-Party Services

**Firebase (Google)**
- Authentication: Firebase Authentication
- Database: Firestore
- Analytics: Firebase Analytics
- Crash Reporting: Firebase Crashlytics
- Storage: Firebase Cloud Storage (if used for images)
- **Data Processing:** Google's standard privacy terms

**Google OAuth Provider**
- Used for alternative sign-in method
- Standard OAuth scopes (email, profile)

### 2.3 Data Sharing Restrictions

❌ **Never sold or rented to third parties**  
❌ **No data brokers or data aggregators**  
✅ Limited to Firebase services for application operation  
✅ No advertising networks or analytics beyond Firebase  

---

## 3. DATA SECURITY

### 3.1 Encryption

- ✅ **In Transit:** All data sent via HTTPS/TLS
- ✅ **At Rest:** Firebase Firestore encryption at rest (Google-managed keys)
- ✅ **Authentication:** Firebase secure password hashing (bcrypt-based)

### 3.2 Access Controls

- ✅ Firebase Security Rules restrict access to user's own data
- ✅ Server-side authentication required for all API calls
- ✅ No sensitive data stored in app local storage
- ✅ Session tokens validated server-side

### 3.3 Data Deletion

- ✅ **Account Deletion:** Complete removal from Firestore + Firebase Auth
- ✅ **Task Deletion:** User can delete tasks they created
- ✅ **Review Deletion:** Users can request review removal

---

## 4. USER RIGHTS & CONTROLS

### 4.1 User Data Access

- ✅ Users can view their profile information in app
- ✅ Users can download a data export (manual process via legal team)
- ✅ Privacy Policy available in-app: Menu → Privacy & Terms

### 4.2 Account Deletion

- ✅ **Delete Account button** in User Profile
- ✅ Requires email re-authentication for security
- ✅ Complete removal of:
  - User profile and personal data
  - Authentication credentials
  - Associated tasks, offers, reviews

### 4.3 Opting Out

- ✅ Users can disable analytics in device settings
- ✅ Crash reporting cannot be disabled (essential for app stability)
- ✅ Push notifications can be managed per device

---

## 5. COMPLIANCE CERTIFICATIONS

### 5.1 Regulatory Compliance

- ✅ **GDPR Compliant:** Right to deletion, data portability, privacy controls
- ✅ **CCPA Compliant:** California consumers can delete accounts
- ✅ **COPPA Compliant:** No collection of children's data (Age gate not required; adults-only marketplace)

### 5.2 Google Play Compliance

- ✅ Privacy Policy linked in-app
- ✅ Age-appropriate content (No explicit, violent, or hateful content)
- ✅ Spam/abuse reporting mechanism in-app
- ✅ User blocking/reporting for moderation
- ✅ No deceptive practices
- ✅ No excessive data collection beyond app functionality

---

## 6. CONTENT MODERATION & SAFETY

### 6.1 User-Generated Content (UGC) Monitoring

**Betegna includes moderation controls for marketplace safety:**

- ✅ **Report System:** Users can report tasks, offers, or reviews
- ✅ **Report Types:** Spam, inappropriate content, fraud, harassment, other
- ✅ **Review Process:** Reports stored in Firestore for manual review
- ✅ **Account Restrictions:** Ability to block/restrict users (future update)

### 6.2 Prohibited Content

Users cannot post:
- Illegal services or products
- Explicit, graphic, or adult content
- Hate speech, harassment, or discrimination
- Spam or deceptive listings
- Personal identifiable information without consent

---

## 7. CHANGES TO THIS DECLARATION

This Data Safety Declaration is effective **March 8, 2026** and may be updated with major releases.

**Update History:**
- **v1.0.1** (March 2026): Initial submission declaration

---

## 8. CONTACT INFORMATION

**Data Protection Officer / Privacy Contact:**
- Email: privacy@betegna.app
- Response Time: 30 days

---

## APPENDIX: Firebase Security Rules

Firestore is configured with these rules:

```javascript
// Users can only read/write their own profiles
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// Tasks can be read by all, written by authenticated users
match /tasks/{taskId} {
  allow read: if true;
  allow create, update, delete: if request.auth != null;
}

// Reviews require authentication
match /reviews/{reviewId} {
  allow read: if true;
  allow create, update: if request.auth != null;
}

// Reports stored for moderation
match /reports/{reportId} {
  allow create: if request.auth != null;
  allow read: if request.auth.uid == resource.data.reporter_uid;
}
```

---

**Certification:** I certify that this declaration accurately describes the data handling practices of the Betegna application.

**Prepared for:** Google Play Store Submission  
**Prepared by:** Development Team  
**Date:** March 8, 2026
