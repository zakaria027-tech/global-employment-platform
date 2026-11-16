# Architecture

## Direction
Use a TypeScript monorepo and modular application architecture. Avoid premature microservices. Keep business rules testable and enforce authorization at backend boundaries.

## Applications
- `apps/web`: Next.js App Router for public pages and authenticated web experiences.
- `apps/mobile`: Expo / React Native for iOS and Android.
- `apps/admin`: reserved for a separate administration experience if justified.

## Backend candidate
Supabase:
- PostgreSQL for relational data.
- Supabase Auth for identity.
- Row Level Security (RLS) for data isolation.
- Storage for private CVs and employer assets.
- Edge Functions or trusted server routes for privileged operations and webhooks.

Policies must be designed and tested before real user data is stored. Service-role keys must only exist in trusted server environments.

## Domain modules
1. Identity and access
2. Candidate profiles and CVs
3. Organizations and employer verification
4. Vacancies and taxonomy
5. Applications and communication
6. Search and matching
7. Plans, entitlements, billing, and invoices
8. Notifications and saved searches
9. Moderation, reports, and audit logs
10. Localization and country configuration

## Conceptual data model
`profiles`, `organizations`, `organization_members`, `employer_verifications`, `candidate_profiles`, `candidate_skills`, `vacancies`, `vacancy_skills`, `applications`, `saved_vacancies`, `subscriptions`, `plan_entitlements`, `saved_searches`, `notification_preferences`, `notifications`, `reports`, and `moderation_actions`.

This is a conceptual model, not a deployed schema. Database migrations and RLS policies require review before implementation.

## Security principles
- Deny by default; grant least privilege.
- Validate and authorize every write on the server.
- Never trust client-provided role, plan, payment, or verification status.
- Verify payment webhooks and make processing idempotent.
- Keep CV storage private; use short-lived authorized URLs.
- Rate-limit authentication, applications, messaging, and public endpoints.
- Audit sensitive administrative actions.
- Never log passwords, tokens, CV contents, or unnecessary personal data.

## Integrations
Payments, maps, email, SMS, and push notifications must be provider adapters. Select providers based on country availability, fees, compliance, and support.

## Deployment
Deploy web independently from mobile. Version database migrations. Production requires CI checks, secrets configuration, backups, monitoring, and rollback procedures.
