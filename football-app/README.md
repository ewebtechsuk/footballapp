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

2. **Install Dependencies**:
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

3. **Run the Application**:
   ```bash
   npm start
   ```

4. **Create a Shareable Web Preview Build**:
   ```bash
   npm run deploy:web
   ```
   This command uses the vendored Expo CLI to export the project to static assets in `dist/web`, making it easy to hand off the
   build for hosting or to test it in a regular browser without Metro.

5. **Serve the Exported Preview Locally** (after running the export step):
   ```bash
   npm run preview:web
   ```
   The script starts a lightweight static server (defaulting to http://localhost:4173) that serves the exported bundle so you can
   click through the experience exactly as end users would.

6. **Deploy the Web Build to Firebase Hosting** (requires the Firebase CLI):
   ```bash
   npm run deploy:firebase
   ```
   This script automatically exports the latest web build and hands it off to the Firebase CLI. Make sure you have
   [`firebase-tools`](https://firebase.google.com/docs/cli) installed (`npm install -g firebase-tools`) and that you are logged in
   to the correct account (`firebase login`). You can also supply a `FIREBASE_DEPLOY_TOKEN` environment variable for CI deployments.

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
