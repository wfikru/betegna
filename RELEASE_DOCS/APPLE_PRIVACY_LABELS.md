# Betegna - iOS App Privacy Labels
**For Apple App Store Submission**

**App Version:** 1.0.1  
**Release Date:** March 2026  
**Bundle ID:** com.betegna.app

---

## PRIVACY LABEL MAPPING

Apple requires privacy labels in App Store Connect under "App Privacy" section. Below is the mapping of collected data types to Apple's categories.

### 1. USER DATA COLLECTION

#### 1.1 Email Address
- **Category:** Contact Information
- **Linked to User's Identity:** YES
- **Tracking:** NO
- **Purpose:** Account authentication and identification
- **Optional:** NO (required for account creation)

#### 1.2 Name
- **Category:** Contact Information
- **Linked to User's Identity:** YES
- **Tracking:** NO
- **Purpose:** User profile and task marketplace display
- **Optional:** YES (users can set custom display names)

#### 1.3 Phone Number
- **Category:** Contact Information
- **Linked to User's Identity:** YES
- **Tracking:** NO
- **Purpose:** Optional profile field for task coordination
- **Optional:** YES

#### 1.4 City/Location (Text-based, NOT GPS)
- **Category:** Contacts
- **Linked to User's Identity:** YES
- **Tracking:** NO
- **Purpose:** Task location filtering
- **Optional:** YES
- **NOTE:** This is user-entered location text, NOT precise geolocation or GPS coordinates

#### 1.5 Bio/Skills Description
- **Category:** User IDs
- **Linked to User's Identity:** YES
- **Tracking:** NO
- **Purpose:** Tasker profile information
- **Optional:** YES

#### 1.6 Hourly Rate
- **Category:** Financial Information
- **Linked to User's Identity:** YES
- **Tracking:** NO
- **Purpose:** Tasker pricing information
- **Optional:** YES (taskers only)

---

### 2. DATA NOT COLLECTED

❌ **Precise Location** (GPS/Geolocation)  
❌ **Health/Fitness Data**  
❌ **Financial Account Numbers** (except rate prices)  
❌ **Biometric Data**  
❌ **Sensitive Personal Information** (government IDs, medical records)  
❌ **Precise Location Coordinates**  

---

### 3. ANALYTICS & DIAGNOSTICS

#### 3.1 App Usage Data
- **Provider:** Firebase Analytics
- **Category:** Product Interaction
- **Linked to User's Identity:** NO (anonymized by default)
- **Tracking:** NO
- **Purpose:** Understand app feature usage, identify crashes
- **Optional:** YES (users can opt-out in iOS Settings)

#### 3.2 Crash Reports
- **Provider:** Firebase Crashlytics
- **Category:** Performance Data
- **Linked to User's Identity:** NO
- **Tracking:** NO
- **Purpose:** Identify and fix app crashes
- **Optional:** NO (essential for stability)

#### 3.3 Device Information
- **Category:** Device ID
- **Data Collected:**
  - Device Model
  - iOS Version
  - App Version
  - Language Preference
- **Purpose:** Analytics, crash diagnostics
- **Linked to User's Identity:** NO

---

### 4. USER-GENERATED CONTENT

#### 4.1 Task Descriptions
- **Category:** User IDs / Contact Information (if contains phone/email)
- **Linked to User's Identity:** YES
- **Tracking:** NO
- **Purpose:** Marketplace functionality
- **Optional:** NO (required to post tasks)

#### 4.2 Task Offers & Messages
- **Category:** User IDs
- **Linked to User's Identity:** YES
- **Tracking:** NO
- **Purpose:** Task coordination and offers
- **Optional:** NO (core feature)

#### 4.3 Reviews & Ratings
- **Category:** User IDs
- **Linked to User's Identity:** YES
- **Tracking:** NO
- **Purpose:** Reputation system
- **Optional:** YES

---

### 5. DATA SECURITY & ENCRYPTION

| Data Type | Encryption | Storage | Deletion Policy |
|-----------|-----------|---------|-----------------|
| Passwords | bcrypt + Firebase | Firebase Auth | On account deletion |
| Email | HTTPS/TLS | Firestore | On account deletion |
| Profile Data | HTTPS/TLS | Firestore | On account deletion |
| Messages | HTTPS/TLS | Realtime DB | On account deletion |
| Analytics | HTTPS/TLS | Firebase | 14 months retention |

---

### 6. DATA RETENTION & DELETION

#### 6.1 How Long Data is Kept

| Data | Retention Period | Deletion Method |
|------|-------------------|-----------------|
| User Profile | Until deletion | Manual account deletion |
| Task Listings | Until completion/deletion | User-initiated deletion |
| Reviews | Until account deletion | Account deletion removes all |
| Analytics | 14 months | Automatic Firebase retention |
| Crash Data | 90 days | Automatic Firebase purge |

#### 6.2 Account Deletion

Users can delete their account from **Profile → Delete Account**

**What gets deleted:**
- ✅ Email and authentication credentials
- ✅ Name, bio, location, phone number
- ✅ All posted tasks
- ✅ All task offers and reviews
- ✅ All personal data from Firestore

**Process:**
1. User taps "Delete Account" in Profile
2. Confirmation dialog with re-authentication
3. Complete removal from Firebase Auth and Firestore
4. Cannot be undone

---

### 7. THIRD-PARTY DATA SHARING

#### 7.1 Firebase (Google Cloud)
- **Services Used:**
  - Authentication (Firebase Auth)
  - Database (Firestore)
  - Analytics (Google Analytics for Firebase)
  - Crash Reporting (Crashlytics)
- **Privacy Policy:** https://policies.google.com/privacy
- **Data Processing:** Google processes data per their Privacy Policy
- **No Profiling:** Google does not use analytics data for behavioral profiling

#### 7.2 Google OAuth
- **Use:** Optional sign-in method
- **Scopes:** Email and profile information
- **Policy:** https://policies.google.com/privacy

#### 7.3 No Third-Party Ad Networks
❌ No AdMob integration  
❌ No third-party analytics beyond Firebase  
❌ No data brokers or data resellers  

---

### 8. COMPLIANCE

- ✅ **GDPR Compliant:** EU users have right to deletion
- ✅ **CCPA Compliant:** California users can delete accounts
- ✅ **PIPEDA Compliant:** Canadian privacy requirements met
- ✅ **COPPA Compliant:** No children's data (18+ marketplace)

---

### 9. PRIVACY POLICY

**Full Privacy Policy Location:**
- In-App: Profile → Privacy & Terms
- Web: https://betegna.app/privacy-policy
- Contact: privacy@betegna.app

**Policy Effective:** March 8, 2026  
**Last Updated:** March 8, 2026

---

## APP STORE SUBMISSION CHECKLIST FOR PRIVACY SECTION

When submitting to Apple App Store Connect, fill in the Privacy section as follows:

### Required Privacy Label Answers

**Question 1: Does your app collect, use, or share any of the following types of data?**
- ✅ Contact Info (Email, Name, Phone, City)
- ✅ User IDs (Bio, Skills, Task Descriptions, Reviews)
- ✅ Product Interaction (Analytics)
- ✅ Performance Data (Crash Reports)
- ✅ Device ID (Device Model, iOS Version)

**Question 2: Is this data linked to the user's identity?**
- ✅ Contact Info: YES
- ✅ User IDs: YES
- ✅ Product Interaction: NO (anonymized)
- ✅ Performance Data: NO
- ✅ Device ID: NO

**Question 3: Is this data used for tracking purposes?**
- ✅ Contact Info: NO
- ✅ User IDs: NO
- ✅ Analytics: NO (feature tracking only)
- ✅ Performance: NO
- ✅ Device ID: NO

**Question 4: Does your app share this data with third parties?**
- Google Firebase services only (standard data processors)

**Question 5: Do you use encryption?**
- ✅ YES - HTTPS/TLS for all data in transit, Firebase encryption at rest

**Question 6: Can users delete their data?**
- ✅ YES - Account Deletion feature in app (Profile → Delete Account)

**Question 7: Do you have a privacy policy?**
- ✅ YES - https://betegna.app/privacy-policy (linked in-app)

---

## Privacy Contact Information

**For Apple Privacy Inquiries:**
- Email: app-privacy@betegna.app
- Response Time: 30 days
- Address: [Your Company Address]

---

**Certification:** I certify that the information in this privacy label is accurate and complete for Betegna version 1.0.1.

**Prepared by:** Development Team  
**Date:** March 8, 2026
