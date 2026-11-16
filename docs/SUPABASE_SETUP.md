# Supabase project setup

This guide is for the first development environment. Do not use production candidate data.

## A. Create a Supabase project

1. Open https://supabase.com/dashboard and sign in.
2. Create a new organization if Supabase asks for one.
3. Select **New project**.
4. Project name: `global-employment-platform-dev`.
5. Choose a strong database password and save it in a password manager. Do not send it in chat or commit it.
6. Choose the nearest suitable European region available for development. Confirm the production region later after reviewing data residency and privacy requirements for launch countries.
7. Choose the Free plan for initial development if it meets the current project limits, then create the project.
8. Wait until the project is ready.

## B. Apply the database migration

1. In the Supabase project dashboard, open **SQL Editor**.
2. In this GitHub repository, open `supabase/migrations/202611160001_initial_identity_and_profiles.sql`.
3. Copy the entire SQL file.
4. Paste it into a new SQL Editor query.
5. Click **Run** once.
6. Confirm the query completes without errors.
7. Open **Table Editor** and confirm these tables exist:
   - `profiles`
   - `candidate_profiles`
   - `organizations`
   - `organization_members`
   - `employer_verifications`

The migration enables Row Level Security and restricts writable columns. Do not disable RLS to make the app work.

## C. Get the two public connection values

1. In the Supabase dashboard, open **Project Settings → API** (or the project's API / Connect panel if the dashboard layout has changed).
2. Copy the **Project URL**.
3. Copy the **Publishable key** (the public `sb_publishable_...` key).
4. Do not copy or share the `service_role` key or any secret key.

## D. Configure the local web app

On the Windows computer where the repository is cloned:

1. Open the repository folder.
2. Open `apps/web`.
3. Copy `.env.example` and name the copy `.env.local`.
4. Open `.env.local` in VS Code.
5. Set the values:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=PASTE_PROJECT_URL_HERE
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=PASTE_PUBLISHABLE_KEY_HERE
```

6. Save the file. It is ignored by Git and must never be committed.
7. Restart the development server after changing environment variables.

## E. Configure email confirmation

For initial testing, open **Authentication → URL Configuration** and add the local callback URL:

```
http://localhost:3000/auth/callback
```

Set the site URL to:

```
http://localhost:3000
```

Keep email confirmation enabled. Use Supabase's development email flow or configure a trusted SMTP provider before wider testing.

## F. Report back

Tell the project maintainer:
- The Supabase project was created.
- The SQL migration ran successfully (or paste the exact error text, with secrets removed).
- The five tables are visible in Table Editor.

Never send database passwords, publishable keys, secret keys, access tokens, or screenshots that expose credentials in chat.
