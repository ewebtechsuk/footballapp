# Publishing Checklist Status

This document tracks the current completion status of each task in the mobile publishing checklist. Items marked as **Completed** have verifiable evidence in the repository or were executed during this review. Items marked as **Outstanding** still require action or confirmation outside the repository.

## Prerequisites
| Item | Status | Notes |
| --- | --- | --- |
| Google Play Console developer account enrollment | Outstanding | Follow the step-by-step form guidance in `docs/publishing/ACCOUNTS.md`, then upload the masked enrollment screenshot and assign primary/billing contacts. |
| Apple Developer Program enrollment | Outstanding | D-U-N-S record captured in `docs/publishing/ACCOUNTS.md`; need sanitized screenshot showing active membership and contact details. |
| Store-ready app name, description, keywords, privacy policy URL | Outstanding | Store metadata has not been captured in the repository. |
| High-resolution icons, feature graphics, screenshots | Outstanding | `assets/icons` only contains a placeholder file—store imagery still needs to be produced. |
| Promotional video or trailer | Outstanding | No media assets or references are tracked in the repository. |
| Third-party license verification | Outstanding | Legal review must be confirmed separately. |
| Terms of service and privacy policy | Outstanding | No documents or links exist in the repo. |
| GDPR/CCPA consent flow | Outstanding | No implementation or documentation confirming compliance is present. |

## Technical preparation
| Item | Status | Notes |
| --- | --- | --- |
| Configure package identifiers, versioning, and signing | Outstanding | Android `build.gradle` only defines ad ID placeholders and lacks production identifiers or signing; the iOS `Info.plist` omits a bundle identifier. |
| Production environment configuration | Outstanding | `.env.example` still contains placeholder values. |
| Automated and manual regression testing | Completed | `npm test` passes using the existing assertion suite. |
| Performance, accessibility, and offline validation | Outstanding | No reports or tooling results are stored in the repo. |
| Crash-free beta testing (Firebase App Distribution/TestFlight) | Outstanding | No beta channel artifacts or notes are available. |
| Review Google Play/App Store policy guidelines | Outstanding | No evidence of policy review is tracked. |
| Prepare privacy labels and data disclosures | Outstanding | Required privacy responses are not documented. |
| Permission justifications and in-app disclosures | Outstanding | No documentation or in-app copy confirming this work. |

## Google Play submission steps
| Step | Status | Notes |
| --- | --- | --- |
| Create application entry and main store listing | Outstanding | No Play Console metadata exported. |
| Complete App Content section (target audience, data safety, ads) | Outstanding | No evidence available. |
| Configure pricing & distribution | Outstanding | Distribution settings not recorded. |
| Upload production AAB and release notes | Outstanding | Release artifacts are absent. |
| Resolve pre-launch check warnings | Outstanding | No pre-launch reports captured. |
| Submit for review and monitor approval | Outstanding | Submission has not been initiated. |

## Web deployment steps
| Step | Status | Notes |
| --- | --- | --- |
| Provision Firebase Hosting credentials | Outstanding | Deploy workflow still fails because credentials have not been provided. |
| Verify Node.js 20 pipeline and rerun deploy | Outstanding | Latest deploy run hit missing credential errors before validating Node 20. |
| Document smoke-test checklist & production URL | Outstanding | No production deployment evidence is stored. |

## Apple App Store submission steps *(deferred until after Google Play/web launch)*
| Step | Status | Notes |
| --- | --- | --- |
| Create App Store Connect record with metadata | Outstanding | Work is intentionally queued until the Google Play/web launch stabilizes. |
| Upload device screenshots and previews | Outstanding | Asset production continues but submission is deferred. |
| Provide App Privacy responses and policy URL | Outstanding | Privacy disclosures being drafted for later submission. |
| Configure categories, age rating, content rights | Outstanding | Settings will be defined when Apple submission window opens. |
| Upload signed IPA build via Xcode/Transporter | Outstanding | Build pipeline not yet targeted because the App Store launch is deferred. |
| Attach build to App Store version and add release notes | Outstanding | Release notes and build attachment scheduled post-Google Play launch. |
| Submit for App Review and respond to feedback | Outstanding | Submission will occur after the Android/web release is live. |

## Post-launch maintenance
| Item | Status | Notes |
| --- | --- | --- |
| Monitor analytics, crash reports, and reviews | Outstanding | Monitoring plan and tooling configuration not documented. |
| Schedule follow-up bug fix releases | Outstanding | Release management plan not defined. |
| Keep store listings updated | Outstanding | No process or content updates are logged. |
| Track policy changes and maintain compliance | Outstanding | No ongoing compliance log is maintained. |
