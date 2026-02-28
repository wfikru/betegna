**Welcome to your Firebase-backed project**

This repository contains a React + Vite application configured to use Firebase
Firestore for data storage and Firebase Authentication for user accounts.

You can run and modify the app locally; changes are not tied to an external
builder service.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
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

**Note:** Authentication is currently **bypassed** for testing. The app automatically logs in with a mock user (`test@example.com`) so you can immediately access all features. To re-enable Firebase authentication, uncomment the `useEffect` block in `src/lib/AuthContext.jsx` and remove the mock user initialization.

The application uses the following Firestore collections – create them in your Firebase console or let them be created automatically when you perform actions:

- `tasks` (documents representing task postings)
- `taskOffers` (offers made on tasks)
- `reviews` (feedback between users)
- `users` (additional profile fields beyond Firebase Auth)

Fields are stored verbatim as shown in the UI code. You can read/write directly via the Firestore web console for inspection.

**Docs & Support**

For Firebase setup and Firestore documentation: [https://firebase.google.com/docs](https://firebase.google.com/docs)
