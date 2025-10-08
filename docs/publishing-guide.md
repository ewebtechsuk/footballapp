# Mobile App Store Publishing Checklist

This checklist summarizes the key steps required to launch the application on both Google Play and the Apple App Store.

> **Release strategy:** Prioritize shipping the Android build to Google Play and deploying the production web app first. Keep gathering the Apple App Store assets in parallel, but plan to submit to Apple only after the Google Play/web release stabilizes.

## Prerequisites
- **Developer accounts**
  - Enroll in the [Google Play Console](https://play.google.com/console) with a one-time US\$25 USD registration fee (or the local-currency equivalent collected by Google).
  - Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) and maintain the annual US\$99 USD membership (waived for approved nonprofits, schools, or governments).
- **App assets ready**
  - Final app name, description, keywords, and privacy policy URL.
  - High-resolution icon, feature graphics, and screenshots that meet the store guidelines for all targeted devices.
  - Promotional videos or trailers (optional but recommended).
- **Legal and compliance checks**
  - Confirm that third-party content has the necessary licenses.
  - Provide clear terms of service and privacy policy, especially if collecting user data.
  - Ensure GDPR/CCPA compliance for handling personal data and include an in-app consent flow if required.

## Technical preparation
- **Build configuration**
  - Configure package identifiers (`applicationId` for Android, `Bundle Identifier` for iOS) and versioning (version code/name and build number).
  - Set up signing keys: upload keystore information to the Play Console and configure signing certificates/profiles in Xcode/App Store Connect.
  - Verify that environment-specific configuration (API keys, endpoints) is set for production.
- **Testing**
  - Run automated test suites and perform manual regression testing on a range of devices.
  - Validate performance, accessibility, and offline behavior.
  - Confirm crash-free startup by using beta channels (Firebase App Distribution, TestFlight) before public release.
- **Store compliance**
  - Review store guidelines (Google Play Developer Policies and App Store Review Guidelines) to avoid rejection.
  - Prepare privacy labels (data collection, usage, tracking) for both stores.
  - Ensure the app includes required permission justifications and in-app disclosures.

## Google Play submission steps
1. Create a new application entry in the Play Console and complete the **Main store listing** with localized descriptions, screenshots, and promotional assets.
2. Fill in **App content** sections: target audience, data safety form, ads declaration, and accessibility details.
3. Configure **Pricing & distribution**: select countries, device categories, and opt in to Google Play programs if desired.
4. Upload the **Android App Bundle (AAB)** via the *Production* track (or internal/testing tracks first) and provide release notes.
5. Complete **Pre-launch checks** and resolve any warnings (e.g., policy issues, performance, security) reported by Google.
6. Submit the release for **review** and monitor the review status until it is approved and published.

## Production web deployment steps
1. Provision Firebase Hosting access by supplying either a service account key or deploy token to the CI/CD secret store.
2. Update the deployment workflow to run on **Node.js 20**, confirm dependencies install without `EBADENGINE` warnings, and re-run the pipeline until the `firebase deploy` step succeeds.
3. Smoke test the live site (navigation, authentication, live data, error pages) after each deployment and document the release version.
4. Capture evidence of the deployed URL, timestamp, and any follow-up tickets opened from smoke-test findings.

## Apple App Store submission steps *(queued after Google Play/web launch)*
1. Log in to App Store Connect, create a new app record, and enter metadata (name, subtitle, description, keywords, support URL, marketing URL).
2. Upload required **App Store assets**: screenshots for each device size, app previews, and promotional text.
3. Provide the **App Privacy** responses and attach the privacy policy URL.
4. Configure **App Information**: primary/secondary categories, age rating, and content rights declarations.
5. In Xcode or via Transporter, upload the **Signed IPA build** that matches the app record's bundle identifier and version/build number.
6. Add the new build to the **App Store version** section, write release notes, and set availability and pricing.
7. Submit the app for **App Review**, respond to feedback if required, and when approved, release manually or automatically.

## Post-launch maintenance
- Monitor analytics, crash reports (Firebase Crashlytics, App Store Connect metrics), and user reviews.
- Prepare quick follow-up releases for critical bug fixes.
- Keep store listings updated with new features, seasonal events, or localization improvements.
- Stay informed about policy updates from both stores to maintain compliance.

Following this process will help streamline review and reduce the chance of last-minute blockers during submission.
