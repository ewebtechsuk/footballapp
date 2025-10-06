# Deployment Fix Tasks

## 1. Provide Firebase service account credentials
- [ ] Open the Firebase project in the Google Cloud console.
- [ ] Create or locate a service account with **Firebase Hosting Admin** and **Service Account Token Creator** roles.
- [ ] Generate a JSON key for the account and copy the entire file content.
- [ ] In GitHub → **Settings** → **Secrets and variables** → **Actions**, create a secret named `FIREBASE_SERVICE_ACCOUNT_KEY` that contains the JSON.
- [ ] Re-run the "Deploy to Firebase Hosting" workflow and confirm the `Configure Firebase credentials` step succeeds.

## 2. Verify Node.js 20 compatibility
- [ ] Re-run the deploy workflow after updating the secret.
- [ ] Confirm the `Set up Node.js` step now installs Node 20 without `EBADENGINE` warnings from Firebase packages.
- [ ] Validate the Expo build, tests, and Firebase deploy steps still complete successfully.

## 3. Monitor follow-up maintenance
- [ ] Run `npm audit` locally and address high-severity vulnerabilities as needed.
- [ ] Consider pruning deprecated dependencies (e.g., `glob@7`, `uuid@3`, `rimraf@3`) during a scheduled dependency update.
