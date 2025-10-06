# Deployment Fix Tasks

## 1. Provide Firebase credentials
- [ ] Preferred: Open the Firebase project in the Google Cloud console, locate (or create) a service account with **Firebase Hosting Admin** and **Service Account Token Creator** roles, generate a JSON key, and store it verbatim in the `FIREBASE_SERVICE_ACCOUNT_KEY` repository secret (or upload a base64-encoded copy as `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` if your secret manager rejects multiline values).
- [ ] Legacy fallback: If you cannot provision a service account yet, run `firebase login:ci` locally (or `npm run firebase:token`) and upload the generated token as `FIREBASE_DEPLOY_TOKEN`.
- [ ] Re-run the "Deploy to Firebase Hosting" workflow and confirm the `Configure Firebase credentials` step detects either credential type and succeeds.

## 2. Verify Node.js 20 compatibility
- [ ] Re-run the deploy workflow after updating the secret.
- [ ] Confirm the `Set up Node.js` step now installs Node 20 without `EBADENGINE` warnings from Firebase packages.
- [ ] Validate the Expo build, tests, and Firebase deploy steps still complete successfully.

## 3. Monitor follow-up maintenance
- [ ] Run `npm audit` locally and address high-severity vulnerabilities as needed.
- [ ] Consider pruning deprecated dependencies (e.g., `glob@7`, `uuid@3`, `rimraf@3`) during a scheduled dependency update.
