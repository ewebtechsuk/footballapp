# Football App

Welcome to the Football App! This application allows users from around the world to create and manage their own football teams,
compete in tournaments, and win prizes.

## Features

- **Team Management**: Users can create and manage their football teams with family and friends.
- **Tournaments**: Enter various tournaments and compete for prizes.
- **User Profiles**: Each user has a profile to manage their information and settings.
- **Community**: Connect with other users and build your own football community.

## Getting Started

To get started with the Football App, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/football-app.git
   cd football-app
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the values with your Firebase project settings (or export them through your shell). The `.env.local` file is ignored
   by Git so your credentials stay private, and the same keys can be reused for CI secrets. If you have production Google Mobile
   Ads identifiers, add them here so the runtime and build scripts pick them up automatically:

   ```
   GOOGLE_MOBILE_ADS_APP_ID=...
   HOME_BANNER_AD_UNIT_ID=...
   TEAM_BANNER_AD_UNIT_ID=...
   TOURNAMENT_REWARDED_AD_UNIT_ID=...
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```
   This project reuses the Expo workspace that lives in `football-app-expo/`. The tooling now ensures the symbolic link to the
   vendored `football-app-expo/node_modules` directory is recreated automatically before installs, tests, builds, or Metro
   sessions run, so you can run the usual npm scripts without worrying about registry access. If you want to refresh the link
   manually—for example after cleaning the workspace—use the helper script:
   ```bash
   npm run link:modules
   ```
   When you need to refresh the dependencies themselves, run `npm install` inside `football-app-expo/` (which already vendors the
   required packages in this repository).

4. **Run the Application**:
   ```bash
   npm start
   ```

5. **Create a Shareable Web Preview Build**:
   ```bash
   npm run deploy:web
   ```
   This command uses the vendored Expo CLI to export the project to static assets in `dist/web`, making it easy to hand off the
   build for hosting or to test it in a regular browser without Metro. Environment variables from `.env`/`.env.local` are loaded
   automatically before the export so your Firebase credentials (and optional ad identifiers) are embedded when present.

6. **Serve the Exported Preview Locally** (after running the export step):
   ```bash
   npm run preview:web
   ```
   The script starts a lightweight static server (defaulting to http://localhost:4173) that serves the exported bundle so you can
   click through the experience exactly as end users would.

7. **Deploy the Web Build to Firebase Hosting**:
   ```bash
   npm run deploy:firebase
   ```
   This script automatically exports the latest web build and hands it off to the Firebase CLI when it is available. If
   [`firebase-tools`](https://firebase.google.com/docs/cli) cannot be found, the script creates a simulated deployment in
   `.firebase/hosting-sim` so you can verify the exported assets without a real Hosting push. Install the CLI locally (or add
   it as a dev dependency) and authenticate with `firebase login` or a `FIREBASE_DEPLOY_TOKEN` when you are ready to publish.
   The deploy helper loads `.env`/`.env.local` first, so any Firebase credentials or deploy tokens stored there are available
   automatically.

### Continuous deployment via GitHub Actions

- A `Deploy to Firebase Hosting` workflow lives at `.github/workflows/deploy-firebase.yml`.
- It runs on pushes to `main` and can also be invoked manually through the **Run workflow** button.
- Populate these repository secrets so the workflow can authenticate with your Firebase project (if the deploy token is absent in CI the script will skip the live publish and fall back to the simulated `.firebase/hosting-sim` output):
  - `FIREBASE_DEPLOY_TOKEN` (from `firebase login:ci` or `npm run firebase:token`)
  - `FIREBASE_API_KEY`
  - `FIREBASE_AUTH_DOMAIN`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_STORAGE_BUCKET`
  - `FIREBASE_MESSAGING_SENDER_ID`
  - `FIREBASE_APP_ID`
  - `FIREBASE_MEASUREMENT_ID` (optional, required only if Analytics is enabled)
- The workflow installs dependencies, runs the existing tests, exports the Expo web build, and deploys it to Firebase Hosting using the same helper scripts that are available locally.
- If the deploy step fails with `Failed to authenticate, have you run firebase login?`, regenerate the CI token locally with `firebase login:ci` (or `firebase login:token`), update the `FIREBASE_DEPLOY_TOKEN` secret under **Settings → Secrets and variables → Actions**, and re-run the workflow. This ensures GitHub Actions can authenticate against your Firebase project.

## Project Structure

The project is organized as follows:

- `src/`: Contains the source code for the application.
  - `screens/`: Contains the different screens of the app.
  - `components/`: Contains reusable components.
  - `services/`: Contains API and authentication services.
  - `store/`: Contains Redux store and slices for state management.
  - `models/`: Contains data models used in the app.
  - `utils/`: Contains utility functions.
- `assets/`: Contains fonts and icons used in the application.
- `ios/`: iOS-specific files.
- `android/`: Android-specific files.
- `package.json`: Configuration file for npm.
- `tsconfig.json`: TypeScript configuration file.
- `.gitignore`: Specifies files to be ignored by Git.

## Contributing

We welcome contributions! If you would like to contribute to the Football App, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Expo + Firebase setup

1. Create a Firebase project at https://console.firebase.google.com and enable Email/Password sign-in and Firestore.

2. Add a web app in Firebase and copy the config values. Set them as environment variables for local development (or replace the
 placeholders in `src/services/firebase.ts`):

```
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
```

3. The repository already includes the Expo workspace under `football-app-expo/` with its dependencies checked in. If you prefer to
   manage them yourself, you can reinstall inside that directory:

```
cd football-app-expo
npm install
```

4. Run the app with Expo (recommended):

```
npx expo start
```

Notes:
- For iOS builds you may need macOS or use EAS Build.
- This repository contains starter Firebase helpers in `src/services/` (see `firebase.ts`, `auth.ts`, and `firestore.ts`).
