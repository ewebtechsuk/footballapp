# Publishing Completion Plan

This plan converts the outstanding items from [`publishing-status.md`](./publishing-status.md) into an actionable workflow. Tasks are grouped by phase and sequenced so that prerequisites unblock downstream submission steps for Google Play and the Apple App Store.

> **Launch focus.** The immediate objective is to ship the Android build to Google Play and cut a production web deployment. App Store submission will follow after the Google Play/web release stabilizes, so the plan below highlights the work that can progress now and flags the iOS tasks that should remain in the backlog until that milestone is complete.

## Phase 1 – Account access and legal readiness
1. **Confirm developer program enrollment** *(see [Phase 1 playbook](./phase-1-account-legal-playbook.md))*
   - Verify active ownership of the Google Play Console and Apple Developer Program accounts.
   - Document billing owners and renewal reminders.
2. **Finalize legal documents** *(see [Phase 1 playbook](./phase-1-account-legal-playbook.md))*
   - Draft or procure the public-facing privacy policy and terms of service.
   - Validate GDPR/CCPA consent language with legal counsel and outline the in-app consent flow.
3. **Audit third-party licenses** *(see [Phase 1 playbook](./phase-1-account-legal-playbook.md))*
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
   - Follow the environment setup workflow in [`football-app/README.md`](../football-app/README.md) to copy the template `.env.example` into a local `.env.local` file.
   - Populate `.env.local` (and the CI/CD secret stores) with production-ready variables while keeping `.env.example` sanitized for onboarding and documentation purposes.
   - Establish secrets management for CI/CD and local release builds.
   - **Note:** Never commit production credentials to the repository—use secure secret management tooling to distribute and rotate sensitive values.
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

## Phase 5 – Launch execution (Google Play + Web)
13. **Prepare production web deployment**
    - Provision Firebase Hosting credentials (service account JSON or CI token) and store them in the appropriate secret manager.
    - Verify the Node.js 20 deploy pipeline and rerun the automated deploy workflow until it succeeds end-to-end.
    - Capture a smoke-test checklist for the web build (routing, auth, live data) and note the version that is pushed to production.
14. **Prepare Google Play release**
    - Create the application record, populate the main store listing, and upload imagery.
    - Complete the App Content questionnaire, pricing & distribution, and upload the release AAB with notes.
    - Resolve pre-launch warnings, then submit the production release for review and monitor status.
    - Record a "Play launch complete" date so the team knows when to kick off the App Store backlog.

## Phase 6 – App Store submission (deferred until after Play/web launch)
15. **Stage App Store assets and disclosures**
    - Keep gathering metadata, screenshots, privacy responses, and signed builds so they are ready when the App Store window opens.
    - Track open dependencies (e.g., consent UX parity, any iOS-specific features) in the issue tracker and assign owners ahead of time.
16. **Execute App Store release**
    - When the team is ready, create the App Store Connect app record with metadata, categories, age rating, and content rights.
    - Upload required screenshots, previews, and the signed IPA build.
    - Configure App Privacy responses, attach release notes, submit for review, and handle any feedback.

## Phase 7 – Post-launch operations
17. **Establish monitoring and feedback loops**
    - Configure analytics dashboards, crash reporting alerts, and review response processes.
    - Schedule periodic store listing refreshes and policy compliance reviews.
18. **Plan release cadence**
    - Define criteria for hotfixes versus feature releases.
    - Document a roadmap for post-launch iterations and assign owners.

### Next steps
- Assign an owner and target date to each task.
- Track progress by updating the status table whenever a task moves from "Outstanding" to "Completed".
