# Phase 1 Playbook – Account Access & Legal Readiness

This playbook expands the high-level Phase 1 items from the publishing action plan into concrete steps, expected deliverables, and evidence to collect in the repository. Use it to drive completion of the account and legal prerequisites before moving to later phases.

## Overview
- **Goal:** Ensure both app stores can be accessed without blockers and that all legal artifacts (policies, licenses, consents) are review-ready.
- **Owners:** Assign at least one owner for account management (operations) and one for legal review (counsel or compliance lead).
- **Timeline:** Target completion within 1 sprint so downstream asset creation and configuration can begin.
- **Outputs:** Verified console access, signed agreements, published policies, and a living record of third-party usage and obligations.

## Step-by-step tasks

### 1. Confirm developer program enrollment
1. **Validate access**
   - [ ] Log into the Google Play Console with the intended publisher account and capture a screenshot of the dashboard (mask sensitive data).
   - [ ] Log into Apple Developer Program/App Store Connect confirming "Active" status.
   - [ ] Store sanitized evidence in `docs/publishing/evidence/accounts/`.
2. **Document ownership & billing**
   - [ ] Record the primary owners, backup admins, and billing contacts for each store.
   - [ ] Note renewal dates (Apple yearly fee, Play Console one-time) and add reminders to the team calendar.
   - [ ] Save a `ACCOUNTS.md` summary in `docs/publishing`.
3. **Set up access management**
   - [ ] Audit user roles, removing unused accounts and applying least-privilege roles.
   - [ ] Enable 2FA enforcement for all accounts.
   - [ ] Document onboarding steps for future teammates.

### 2. Finalize legal documents
1. **Draft privacy policy & terms of service**
   - [ ] Gather inputs from product, engineering, and analytics on data usage, third-party services, and user rights.
   - [ ] Use existing legal templates or counsel-approved boilerplates as a starting point.
   - [ ] Iterate with legal counsel until approved.
2. **Publish & version control**
   - [ ] Host the policies on the marketing site or a dedicated legal microsite with stable URLs.
   - [ ] Store the Markdown or source documents under `docs/legal/` with revision history.
   - [ ] Add the published URLs to `docs/publishing-status.md` once live.
3. **Document consent flows**
   - [ ] Define in-app messaging for GDPR/CCPA (age gates, opt-in toggles, data deletion flow).
   - [ ] Capture wireframes or UX copy snippets and store in `docs/legal/consent/`.
   - [ ] Link tickets for engineering implementation in the issue tracker.

### 3. Audit third-party licenses
1. **Inventory dependencies**
   - [ ] Export dependency lists from package managers (`npm ls --prod`, Gradle `dependencies`, CocoaPods `pod list`).
   - [ ] Identify bundled fonts, media, or SDKs not captured by package managers.
   - [ ] Record all items in `docs/legal/third-party-inventory.csv`.
2. **Review obligations**
   - [ ] For each item, capture license type, attribution requirements, and redistribution clauses.
   - [ ] Flag any copyleft or incompatible licenses for legal review.
   - [ ] Prepare attribution text to include in-app or within the marketing site.
3. **Store evidence**
   - [ ] Save PDFs or links to license texts in `docs/legal/licenses/`.
   - [ ] Create a compliance summary in `docs/legal/THIRD_PARTY_LICENSES.md` with sign-off from legal.

## Tracking & sign-off
- Update `docs/publishing-status.md` as each sub-task is completed.
- Capture approvals by having the responsible owner add a dated note to the corresponding section in this playbook.
- Once all checkboxes above are marked complete and evidence exists, mark Phase 1 as finished and move to Phase 2 tasks.
