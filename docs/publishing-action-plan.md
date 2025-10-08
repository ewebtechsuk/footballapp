# Publishing Completion Plan

This plan converts the outstanding items from [`publishing-status.md`](./publishing-status.md) into an actionable workflow. Tasks are grouped by phase and sequenced so that prerequisites unblock downstream submission steps for Google Play and the Apple App Store.

## Phase 1 – Account access and legal readiness
1. **Confirm developer program enrollment**
   - Verify active ownership of the Google Play Console and Apple Developer Program accounts.
   - Document billing owners and renewal reminders.
2. **Finalize legal documents**
   - Draft or procure the public-facing privacy policy and terms of service.
   - Validate GDPR/CCPA consent language with legal counsel and outline the in-app consent flow.
3. **Audit third-party licenses**
   - Inventory bundled SDKs, libraries, fonts, and media.
   - Record license obligations and attach proof of compliance in the repository.

## Phase 2 – Marketing assets and store copy
4. **Author store metadata**
   - Write the final app name, short description, full description, keywords, and support/marketing URLs.
   - Store the copy in version control for iterative review.
5. **Produce visual assets**
   - Design high-resolution icons, feature graphics, and screenshots for required device breakpoints.
   - Capture or edit promotional video footage if desired.
6. **Review localization needs**
   - Identify target locales and determine whether translations are required for copy or imagery.

## Phase 3 – Build configuration and environment hardening
7. **Lock production identifiers and signing**
   - Choose the Android `applicationId` and iOS bundle identifier; update the respective project files.
   - Generate production signing keys/certificates and document secure storage.
8. **Prepare environment configuration**
   - Replace placeholder values in `.env.example` with production-ready variables.
   - Establish secrets management for CI/CD and local release builds.
9. **Define permission and privacy disclosures**
   - Draft justifications for each platform permission.
   - Prepare the data collection/usage responses needed for privacy labels on both stores.

## Phase 4 – Quality validation
10. **Expand test coverage**
    - Augment automated tests for critical flows and add manual regression scenarios.
    - Schedule performance, accessibility, and offline evaluations with tooling or QA resources.
11. **Run beta distributions**
    - Configure Firebase App Distribution (Android) and TestFlight (iOS) with production signing builds.
    - Collect crash/analytics feedback and resolve issues prior to submission.
12. **Review policy compliance**
    - Complete an internal audit against Google Play policies and the App Store Review Guidelines.
    - Update the app or documentation to address any potential violations.

## Phase 5 – Store submission execution
13. **Prepare Google Play release**
    - Create the application record, populate the main store listing, and upload imagery.
    - Complete the App Content questionnaire, pricing & distribution, and upload the release AAB with notes.
    - Resolve pre-launch warnings, then submit the production release for review and monitor status.
14. **Prepare App Store release**
    - Create the App Store Connect app record with metadata, categories, age rating, and content rights.
    - Upload required screenshots, previews, and the signed IPA build.
    - Configure App Privacy responses, attach release notes, submit for review, and handle any feedback.

## Phase 6 – Post-launch operations
15. **Establish monitoring and feedback loops**
    - Configure analytics dashboards, crash reporting alerts, and review response processes.
    - Schedule periodic store listing refreshes and policy compliance reviews.
16. **Plan release cadence**
    - Define criteria for hotfixes versus feature releases.
    - Document a roadmap for post-launch iterations and assign owners.

### Next steps
- Assign an owner and target date to each task.
- Track progress by updating the status table whenever a task moves from "Outstanding" to "Completed".
