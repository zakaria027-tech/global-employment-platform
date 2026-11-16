# Midn Jobs

Midn Jobs is a global employment and recruitment platform connecting employers with job seekers through a multilingual web and mobile experience.


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

The web app is being established incrementally. For Supabase setup, copy `apps/web/.env.example` to `apps/web/.env.local` and add your project URL and publishable key. Never commit `.env.local`.

## Project status

**Foundation stage — not production-ready.** Initial authentication screens and a database migration have been committed, but the Supabase project has not yet been connected and the migration has not yet been applied or verified. Job workflows, payments, notifications, moderation, and mobile release workflows remain pending.

See [the roadmap](docs/ROADMAP.md), [project brief](docs/PROJECT.md), [architecture](docs/ARCHITECTURE.md), and the [Supabase setup guide](docs/SUPABASE_SETUP.md).

## Security

Never commit secrets, access tokens, private keys, production credentials, or real candidate personal data. Use environment variables and the example file as a template.

## License

MIT. See [LICENSE](LICENSE).
