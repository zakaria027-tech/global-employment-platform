# Product brief

## Vision
Build a trustworthy, accessible, multilingual employment platform connecting employers with people seeking work across countries. The platform is not a recruitment agency and does not guarantee employment.

## Roles

### Candidate
- Create a professional profile with skills, education, experience, preferred locations, and salary expectations.
- Create or upload a CV; private documents must not be public by default.
- Search, filter, save, and apply to vacancies.
- Track application status and manage notification preferences.
- Subscribe optionally to advanced discovery and alert features.

### Employer
- Create an organization profile and complete an appropriate verification process.
- Publish, edit, pause, and close vacancies.
- Specify role, compensation, currency, pay period, work arrangement, location, openings, and requirements.
- Review applications and communicate with candidates.

### Administrator / moderator
- Review employers, vacancies, reports, and appeals.
- Manage users, subscriptions, platform configuration, and audit events.
- Apply moderation actions with documented reasons.

## Vacancy fields
Title, description, employer, verification state, country/region/city, optional coordinates, compensation range, ISO 4217 currency, pay period, employment type, workplace arrangement, skills, qualifications, experience, openings, deadline, publication/expiry timestamps, and status.

Never confuse hourly, monthly, and annual compensation.

## Candidate plans
- Free: account, profile/CV, basic search, and fair access to job details and applications.
- Premium: advanced filters, saved searches, and configurable matching alerts.
- VIP: Premium features plus faster vacancy notifications and more granular alert rules.

Entitlements must be enforced server-side. Paid plans do not guarantee employment, affect employer selection, or unfairly hide essential vacancy information. Pricing, taxes, refunds, cancellation rules, and availability vary by country.

## Employer monetization
Potential revenue includes employer subscriptions, posting allowances, recruitment workflow tools, and clearly labelled promoted vacancies. Do not charge candidates to apply or allow employers to demand recruitment fees.

## Globalization
Country and language are separate preferences. Store timestamps in UTC and display them in the selected time zone. Store currencies using ISO 4217 codes. Support localized formatting, reviewed translations, and RTL/LTR layouts. Launch countries and languages incrementally.

## Trust, safety, privacy
Employer verification, vacancy moderation, reporting, blocking, appeals, fraud controls, data minimization, retention controls, account deletion/export, jurisdiction-specific privacy compliance, private CV storage, and auditable moderation actions are required.

## Accessibility
Target WCAG 2.2 AA for web where practical. Support keyboard navigation, screen readers, visible focus, contrast, scalable text, and reduced motion. Follow platform accessibility guidance on mobile.

## Initial release
Prioritize authentication, candidate/employer profiles, vacancy publishing, vacancy discovery, and applications. Paid subscriptions, real-time alerts, advanced matching, and mobile store releases follow after core workflows are reliable.
