# Betegna – Task platform for Ethiopia

TaskRabbit-like MVP: post tasks, find taskers, chat, pay in ETB (Chapa simulated), offline support, Amharic/English.

## Folder structure

```
lib/
  main.dart                 # Entry, theme (dark mode), localization (Amharic default), Firebase init
  firebase_options.dart     # Replace via: flutterfire configure
  models/                   # User, Task, Bid, Message
  services/                 # Auth, Task CRUD, Matching, Payment (escrow), Chat, Rating
  utils/                    # AppLocalizations, ETB format, task categories, offline sync (Hive)
  screens/
    splash_screen.dart
    auth/                   # Login/Register (Google Sign-In), Profile setup (photo, bio, skills, Client/Tasker)
    home/                   # Tabbed: Post Task, Browse Tasks, My Tasks, Profile; map view (OpenStreetMap)
    task/                   # Task creation, Task detail (bid/apply, chat, complete, payment)
    chat/                   # Real-time chat (translation placeholder)
    payment/                # Escrow release, rate tasker
    profile/                # Edit profile, skills, availability, ratings
android/  ios/              # Platform config (Firebase, permissions). Both supported; iOS preferred.
```

## Setup

1. **Flutter**  
   Install [Flutter](https://flutter.dev) and run:
   ```bash
   flutter doctor
   ```

2. **Firebase**  
   - Create a project at [Firebase Console](https://console.firebase.google.com).  
   - Enable **Authentication** → Sign-in method → **Google** (enable and set support email).  
   - Create **Firestore** database (start in test mode for dev).  
   - Enable **Storage**.  
   - Run from project root:
     ```bash
     cd /Users/fikruworku/development/betegna
     flutterfire configure
     ```
   - This generates `lib/firebase_options.dart`, `android/app/google-services.json`, and iOS config. Add both **Android** and **iOS** apps in Firebase (same project); then run `flutterfire configure` and select both.  
   - For iOS Google Sign-In: in Firebase, add an iOS app with bundle ID `com.betegna.betegna`, download `GoogleService-Info.plist` into `ios/Runner/`. Add the reversed client ID as a URL scheme in `ios/Runner/Info.plist` if needed (see [Google Sign-In iOS](https://firebase.google.com/docs/auth/ios/google-signin)).

3. **Firestore index (optional)**  
   For “Browse tasks” by category, create a composite index in Firestore:
   - Collection: `tasks`
   - Fields: `status` (Ascending), `createdAt` (Descending)  
   Or run the app and use the link in the error message to create the index.

4. **Dependencies**
   ```bash
   flutter pub get
   ```

5. **Run**  
   The app supports **Android** and **iOS**; **iOS is the preferred platform**.  
   ```bash
   # Prefer iOS (simulator or device)
   flutter run -d ios

   # Or Android
   flutter run -d android

   # Or let Flutter choose a connected device
   flutter run
   ```  
   For iOS: open in Xcode if needed (`open ios/Runner.xcworkspace`), then run from Xcode or `flutter run -d ios`. Ensure a simulator is booted or a device is connected.

## How to test

- **Sign-in**: Use **Sign in with Google** (Gmail). Ensure Google is enabled in Firebase Auth → Sign-in method. **Android**: add your debug SHA-1 in Firebase project settings. **iOS**: add the iOS app in Firebase and add `GoogleService-Info.plist` to `ios/Runner/`.  
- **Post task**: Profile → set “I am a Tasker” or leave as Client → Post Task tab → fill category, description, budget (ETB), location, optional photo → Submit.  
- **Browse**: Browse Tasks tab → filter by category, switch to map (OpenStreetMap).  
- **Bid**: Open a task as Tasker → Bid → enter amount and message → Submit. Client can Accept bid (creates escrow), then Complete task → Release payment and rate tasker.  
- **Chat**: From task detail (when assigned), tap chat icon.  
- **SOS**: App bar emergency icon opens phone dialer (e.g. 911).  
- **Offline**: Tasks and profiles are cached in Hive; list works from cache when offline and syncs on reconnect.

## Features

- Google Sign-In (Gmail), Client/Tasker profiles, KYC placeholder  
- Post/browse tasks (Ethiopia categories, ETB, location, photos)  
- Matching by proximity + skills (rule-based for MVP)  
- In-app chat (Firestore real-time; translation placeholder)  
- Escrow-style payments (simulated in Firestore; Chapa-ready)  
- Ratings (mandatory post-task), SOS button, offline cache (Hive)  
- Default language: Amharic (fallback English)
