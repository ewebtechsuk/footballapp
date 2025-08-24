# football-app-expo — local env setup

This folder contains the Expo web/native app. For local development the app expects Firebase configuration
to be provided via environment variables. A `.env.example` file is included to show the required keys.

Required env vars
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID

Quick start (local)
1. Copy the example and fill values from your Firebase project:
   cp .env.example .env
   # Edit .env and paste the values from the Firebase console

2. Install deps (first time) and start the dev server:
   npm install
   npx expo start --web

Notes
- The project loads `.env` automatically in development via `dotenv` (safe require). Do not commit `.env`.
- The app will fail fast with a clear error if placeholders (e.g. `<YOUR_API_KEY>`) remain in the config.
- For CI or production, set the same env vars via your CI/CD environment rather than committing them.
