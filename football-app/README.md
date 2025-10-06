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
   it as a dev dependency) and authenticate with `firebase login` or point the `GOOGLE_APPLICATION_CREDENTIALS` environment
   variable at a Firebase service account key JSON when you are ready to publish.

## Firebase CLI installation troubleshooting

Because this project relies on the Firebase CLI for real Hosting deploys, double-check that `firebase-tools` can actually be
installed in your environment before running the deploy scripts.

1. **Verify the current state** – run `firebase --version`. If the command is missing, attempt a manual installation with
   `npm install -g firebase-tools` and keep the terminal output handy. HTTP `403 Forbidden` responses almost always mean that a
   network proxy or firewall is blocking npm from reaching `https://registry.npmjs.org`.
2. **Fix proxy restrictions** – allowlist the npm registry domains (at minimum `https://registry.npmjs.org` and
   `https://firebase.tools`) in your proxy or configure npm with the correct proxy credentials:
   ```bash
   npm config set proxy http://<user>:<password>@<proxy-host>:<proxy-port>
   npm config set https-proxy http://<user>:<password>@<proxy-host>:<proxy-port>
   ```
   Re-run the install after updating the proxy settings to confirm that the CLI downloads successfully.
3. **Offline installation fallback** – if you cannot change the proxy, download the
   [`firebase-tools` tarball](https://registry.npmjs.org/firebase-tools) from a machine that has access, copy it into this
   environment, and install it directly:
   ```bash
   npm install -g /path/to/firebase-tools-<version>.tgz
   ```
   After the CLI is installed, retry `firebase --version` to confirm the binary is now available. The deploy scripts will pick up
   the globally installed CLI automatically.

### Generating Firebase CI tokens

To authenticate Firebase Hosting deploys from CI environments, generate a reusable token with the Firebase CLI and store it as a
secret (for example, `FIREBASE_DEPLOY_TOKEN`):

1. **Install the Firebase CLI** – confirm `firebase-tools` is available by running `firebase --version`. If you see “command not
   found,” install it globally with `npm install -g firebase-tools`. When you are behind a proxy or working offline, follow the
   troubleshooting section above for alternative installation strategies.
2. **Launch the CI login flow** – run `firebase login:ci`. The command opens a browser so you can sign in with a Google account
   that has access to the Firebase project. After you approve the permissions, the CLI prints a long-lived CI token to the
   terminal. Copy this value immediately; it will not be shown again. Recent versions of the CLI print a warning that
   `firebase login:ci` is deprecated in favour of service account credentials—tokens generated today continue to work, but you
   should plan to migrate to the `GOOGLE_APPLICATION_CREDENTIALS` workflow described below.
3. **Use the bundled helper** – this repository exposes a wrapper script that captures the token for you. Run
   `npm run firebase:token` (or `npm run firebase:token -- --save` to write it to `.env.local`). For environments without local
   browser access, use `npm run firebase:token:no-localhost` to complete the OAuth flow from another device. If the CLI cannot
   open a browser (for example, on a headless CI runner), it prints a login URL you can paste into another device to finish the
   authentication.
4. **Store the token securely** – add the copied token to your CI secret store (for GitHub Actions, use `Settings → Secrets and
   variables → Actions`) so automated workflows can authenticate without manual intervention. When you migrate to service account
   keys, set the path to the downloaded JSON in `GOOGLE_APPLICATION_CREDENTIALS` for local scripts and encode the file as the
   `FIREBASE_SERVICE_ACCOUNT_KEY` secret for GitHub Actions.

### Continuous deployment via GitHub Actions

- A `Deploy to Firebase Hosting` workflow lives at `.github/workflows/deploy-firebase.yml`.
- It runs on pushes to `main` and can also be invoked manually through the **Run workflow** button.
- Populate the `FIREBASE_SERVICE_ACCOUNT_KEY` repository secret with a Firebase service account JSON key that has Hosting permissions. Grant the service account at least the **Firebase Hosting Admin** and **Service Account Token Creator** roles before exporting the key so the deploy step can mint access tokens. If your secret manager struggles with multiline values, store a base64-encoded version of the JSON in `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` instead. The workflow materialises whichever secret is present to a temporary file, exports it via both `GOOGLE_APPLICATION_CREDENTIALS` and `FIREBASE_SERVICE_ACCOUNT`, and forwards the derived project identifier to the deploy step so the Firebase CLI can authenticate non-interactively. If you are still relying on legacy CI tokens, you can instead provide a `FIREBASE_DEPLOY_TOKEN` secret—the workflow falls back to `firebase deploy --token <value>` only when no service account key is available.
- The workflow installs dependencies, runs the existing tests, exports the Expo web build, and deploys it to Firebase Hosting using the same helper scripts that are available locally.
- If the deploy step fails with authentication errors, re-generate the service account key from **Project Settings → Service Accounts → Generate new private key**, update the `FIREBASE_SERVICE_ACCOUNT_KEY` secret (or refresh the `FIREBASE_DEPLOY_TOKEN`), and re-run the workflow.

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
