# Global Employment Platform

A global employment and recruitment platform connecting employers with job seekers through a multilingual web and mobile experience.

> Working repository name. The final product name and brand identity will be selected later.

## Product goals

- Help employers publish and manage legitimate job vacancies.
- Help candidates build profiles, discover opportunities, and apply.
- Provide free and paid discovery plans, including configurable job alerts.
- Support country, language, currency, time-zone, and accessibility preferences.
- Give platform administrators tools to review employers, vacancies, reports, and subscriptions.

## Planned applications

| App | Purpose | Initial technology |
| --- | --- | --- |
| `apps/web` | Public website and candidate/employer portals | Next.js, React, TypeScript |
| `apps/mobile` | iOS and Android app | Expo, React Native, TypeScript |
| `apps/admin` | Administration console (planned) | Web application; implementation to follow |

## Repository layout

```text
apps/
  web/              # Next.js web application
  mobile/           # Mobile application foundation
docs/               # Product and engineering documentation
supabase/           # Database migrations and Edge Functions (planned)
.github/            # CI and repository workflows
```

## Getting started

Requirements: Node.js LTS and pnpm.

```bash
pnpm install
pnpm dev:web
```

The web app is being established incrementally. Backend credentials are not required for the initial UI foundation.

## Project status

**Foundation stage — not production-ready.** Authentication, database migrations, payments, job workflows, notifications, moderation, and mobile release workflows remain to be implemented and tested.

See [the roadmap](docs/ROADMAP.md), [project brief](docs/PROJECT.md), and [architecture](docs/ARCHITECTURE.md).

## Security

Never commit secrets, access tokens, private keys, production credentials, or real candidate personal data. Use environment variables and the example file as a template.

## License

MIT. See [LICENSE](LICENSE).
