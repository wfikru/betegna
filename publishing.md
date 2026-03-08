📱 App Store Submission Process
Step 1: Prepare Apple Account
You'll need:

✅ Apple Developer Account ($99/year if you don't have one)
✅ App Store Connect access
✅ Valid Apple ID with admin role
Step 2: Create App Record in App Store Connect
Go to App Store Connect

Sign in with your Apple ID

Click "+ Create an App" (top left)

Fill in:

Platform: iOS
App Name: Betegna
Primary Language: English
Bundle ID: Select com.betegna.app (or create it)
SKU: betegna-v1 (internal reference)
User Access: Select your team
Click "Create"

Step 3: Fill App Information
Now you'll fill out the detailed app listing. Use content from your RELEASE_DOCS folder:

Pricing & Availability
Price: Free
Availability: Select regions (or Worldwide)
Age Rating: Complete the questionnaire
Select: No explicit content → Rating: 4+ (Everyone)
App Information
App Name: Betegna
Subtitle: Local Task Marketplace
Category: Productivity
Privacy Policy URL: https://betegna.app/privacy-policy ⚠️ (Update to your real domain)
App Description
Copy from STORE_METADATA_ASSETS.md:

Keywords
Step 4: Upload Screenshots
You need to prepare screenshots (or use placeholder screenshots):

Required sizes:

iPhone 6.7" (Pro Max): 1242 × 2688 px
iPhone 6.1" (standard): 1170 × 2532 px
How to get screenshots:

Run your iOS app in Xcode simulator
Cmd+S to screenshot
Crop to the dimensions above
Need 2-5 screenshots per device size
Recommended screenshot order:

Home/Task Browsing (main marketplace)
Task Detail & Hiring
User Profile & Reviews
Messaging Feature
Privacy & Safety Features
Step 5: Upload App Icon
Your icon is ready! It's already at:

In App Store Connect:

App Icon: Automatically picked up from the build (no manual upload needed)
Step 6: Privacy Labels (CRITICAL)
This is required by Apple. Use APPLE_PRIVACY_LABELS.md:

In App Store Connect, go to App Privacy:

Question 1: Does your app collect, use, or share any data?

✅ Yes
Question 2: Data Types Collected:

✅ Contact Information (Email, Name, Phone, City)

Linked to user's identity: YES
Tracking: NO
✅ User IDs (Bio, Skills, Task Descriptions)

Linked to user's identity: YES
Tracking: NO
✅ Product Interaction (Analytics)

Linked to user's identity: NO
Tracking: NO
✅ Performance Data (Crash Reports)

Linked to user's identity: NO
Tracking: NO
✅ Device ID (Device Model, iOS Version)

Linked to user's identity: NO
Tracking: NO
Question 3: Encryption

✅ YES - Data is encrypted in transit (HTTPS/TLS)
Question 4: User Deletion

✅ YES - Users can delete account from Profile menu
Question 5: Privacy Policy

✅ YES - https://betegna.app/privacy-policy
Step 7: Version & Build Upload
Option A: Using Transporter (Recommended)
Download Transporter from Mac App Store
Open Transporter
Click "Add app" → Select betegna-1.0.1.ipa
Click "Deliver"
Sign in with Apple ID
App uploads to App Store Connect
Status shows "Processing..." → "Ready for Review"
Option B: Using Xcode
Open Xcode
Window → Organizer
Select your app's archive
Click "Distribute App"
Select "App Store Connect"
Select signing certificate
Complete upload
Option C: Manual via App Store Connect
In App Store Connect → Your App → TestFlight
Upload your IPA file
Automatic validation runs
Then move to Production
Step 8: Fill Version Information
In App Store Connect → Version Information:

Version Number: 1.0.1
Build: Select uploaded build (should say "1 of 1" after upload)
Release Date: Automatic or set specific date
What's New: Copy from SUBMISSION_CHECKLIST.md
Step 9: Review Information (FOR REVIEWERS)
In App Store Connect → Review Information:

Contact Email: app-review@betegna.app
Demo Account (Recommended): Include test credentials
Demo Account Password: SecureReview#2026!Marketplace
Notes for Reviewer:
Step 10: Submit for Review
Review all fields one more time
Click "Save" to ensure all changes saved
Click "Submit for Review"
Confirm submission
Step 11: Wait for Approval
📧 Apple will email you when:

✅ Review starts
⏳ Review in progress (24-48 hours typical)
✅ Approved or Rejected
If rejected: Apple tells you why → Fix → Resubmit

If approved: You can release immediately or schedule release

Step 12: Release to Users
Once approved:

Back in App Store Connect
Click "Release This Version"
Confirm release
App goes live in 30 minutes - 24 hours
📋 Quick Checklist Before Submitting
 Apple Developer Account active
 App Store Connect access confirmed
 Bundle ID matches: com.betegna.app
 Privacy Policy URL updated (not placeholder)
 Screenshots prepared or uploaded
 Test account credentials ready
 Privacy Labels filled out completely
 Version set to 1.0.1
 Build uploaded successfully
 All descriptions filled in
 Age rating completed
 Support email configured
⏱️ Timeline
Step	Time
Account setup	5 min
Fill metadata	20 min
Upload build	5 min
Apple review	24-48 hrs
Release to users	30 min - 24 hrs
Total to live	24-48 hours
🚀 Next: Google Play Store
Once iOS is submitted, follow same process for Android at Google Play Console (easier and faster - 2-4 hours review time).

Ready to submit? Do you have your Apple Developer account set up? If not, I can guide you through that first!