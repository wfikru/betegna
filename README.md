**Welcome to your Firebase-backed project**

This repository contains a React + Vite application configured to use Firebase
Firestore for data storage and Firebase Authentication for user accounts.

You can run and modify the app locally; changes are not tied to an external
builder service.

The Firebase client is configured in `src/lib/firebase.js` which reads
environment variables (defined in `.env.local`). The web code and the
`src/api/firebaseClient.js` helper both import from there, so there’s a
single place to control the SDK initialization.

### Seeding Firestore with the Admin SDK

If you prefer to create the collections programmatically (for CI or
initial setup) there’s a small Node script included at
`scripts/seedFirestore.cjs` (CommonJS script).  It uses the Firebase Admin SDK and requires a
service account key JSON:

```bash
# download service account JSON from the Firebase console and
# either place it next to this script or set SERVICE_ACCOUNT_PATH
node scripts/seedFirestore.cjs
```

The script will create `tasks`, `taskOffers`, `reviews` and `users`
collections with a single empty document each.  You can modify it to insert
real sample data or extend it for additional entities.

#### Data models

JSON schema files now live under `src/entities` (moved there from the
repository root) and describe the expected properties for each collection
(Task, TaskOffer, Review and User).  These schemas are handy for reference,
and they’re also the source for the TypeScript interfaces generated in
`src/types/entities.d.ts`.
The front‑end code uses those interfaces via JSDoc comments – state hooks in
`src/pages` and the API client are annotated with the appropriate types.
Feel free to update the schemas and corresponding interfaces as the
project evolves.


For native Android/iOS builds the downloaded configuration files
(`google-services.json` and `GoogleService-Info.plist`) must live in the
respective platform directories (`android/app/` and `ios/Runner/`).

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install` (this also installs the `firebase-admin` package used by the seeding script)
4. Set up a Firebase project (you already have one) and enable Firestore and Authentication (email/password or anonymous)
5. Create an `.env.local` file with your Firebase SDK configuration:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

You can find these values in the Firebase console under project settings.

Run the app: `npm run dev`

After starting the development server open the browser at `http://localhost:5173` (or the port shown by Vite).  

**Note:** Firebase authentication is now active. Users can sign in using email/password or the **Continue with Google** button available on the login screen.

**Setting up Google Sign-In:**

1. Go to **[Firebase Console](https://console.firebase.google.com)** → your project
2. Select **Authentication** → **Settings** tab
3. Scroll to **Authorized domains** and add:
   - `localhost`
   - `127.0.0.1:5173` (or the port Vite uses)
   - Any deployed domains (e.g., `yourdomain.com`)
4. Go to **Authentication** → **Sign-in method** and ensure **Google** is enabled

If you see *"Access blocked: This app's request is invalid"*, it means the domain is not authorized yet. Follow steps 3–4 above.

The application uses the following Firestore collections – create them in your Firebase console or let them be created automatically when you perform actions:

- `tasks` (documents representing task postings)
- `taskOffers` (offers made on tasks)
- `reviews` (feedback between users)
- `users` (additional profile fields beyond Firebase Auth)

Authentication rules:

- Anyone (even unauthenticated visitors) can browse tasks; the home page always shows open tasks from all users.
- Trying to **post a task** or visit the **Profile** page redirects unauthenticated users to the login screen.
- The navigation bar displays a **Logout** button when signed in; it signs the user out and returns to the login page.

Fields are stored verbatim as shown in the UI code. You can read/write directly via the Firestore web console for inspection.

**Docs & Support**

For Firebase setup and Firestore documentation: [https://firebase.google.com/docs](https://firebase.google.com/docs)
