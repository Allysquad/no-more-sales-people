# No More Sales People

A conversion-focused lead qualification site built with Next.js, TypeScript, and Tailwind CSS. The app walks a prospect through a short questionnaire, recommends a product route, and captures the lead details for follow-up.

## What this app does

- guides visitors through a multi-step home improvement qualification flow
- recommends a route based on product interest and urgency
- collects name, email, phone, postcode, and project notes
- stores leads in PostgreSQL through the API layer
- gates the business analytics view behind a database-backed login
- shows a business dashboard with summary metrics and recent leads for approved users only

## Local development

The frontend and backend API are served by the same Next.js process. PostgreSQL runs separately in Docker, and Prisma connects the API to the database.

### First-time setup

Run Docker Desktop first, then open PowerShell in the project directory:

```powershell
cd "C:\Users\Alli_\OneDrive\Documents\no-more-sales-people"
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm install"
Copy-Item .env.example .env
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:generate"
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:up"
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:deploy"
```

The deploy command applies committed migrations, removes old `demo-lead-*` records, and creates 10 fresh randomized demo leads. Real leads are preserved. Run it again after a schema change or whenever you want a clean demo dataset.

### Start the services

Start PostgreSQL, then start the Next.js frontend and backend API:

```powershell
cd "C:\Users\Alli_\OneDrive\Documents\no-more-sales-people"
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:up"
powershell -ExecutionPolicy Bypass -NoLogo -File .\run-app.ps1
```

The app is available at `http://localhost:3000`.

The public lead flow is the default homepage. For the business-only dashboard, sign in with the seeded demo account:

- Email: `business@nomoresalespeople.com`
- Password: `demo-password`

The business API endpoints are:

- `POST http://localhost:3000/api/business/login`
- `GET http://localhost:3000/api/business/summary`

The lead API is available at `POST http://localhost:3000/api/leads` and is called by the form automatically.

For a foreground development server instead of the helper script:

```powershell
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run dev"
```

### Check and stop services

```powershell
# Check the PostgreSQL container
docker compose ps

# Check Prisma migration state
powershell -ExecutionPolicy Bypass -NoLogo -Command "npx prisma migrate status"

# Stop the Next.js frontend/API process
powershell -ExecutionPolicy Bypass -NoLogo -File .\stop-app.ps1

# Stop PostgreSQL and remove the container (the named volume is retained)
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:down"
```

### Useful commands

```powershell
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run build"
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run lint"
powershell -ExecutionPolicy Bypass -NoLogo -Command "node --test tests/lead-store.test.mjs"
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:generate"
```

The local database uses the `DATABASE_URL` in `.env`. To move to Supabase later, keep the Prisma schema and migrations, replace `DATABASE_URL` with the Supabase PostgreSQL connection string, and apply the migrations against that database. The application code does not need to change.

### Run the app in Docker

For a production-like local run, build and start the Next.js app container alongside PostgreSQL:

```powershell
docker compose up --build -d
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:deploy"
```

Open `http://localhost:3000`. The `web` container uses the Compose service name `postgres` for its database connection. The deploy command applies migrations and seeds 10 demo leads idempotently. Stop the containerized app and database with `docker compose down`.

## Project structure

- [src/app/page.tsx](src/app/page.tsx) — lead questionnaire, recommendation logic, and gated business dashboard
- [src/app/api/leads/route.ts](src/app/api/leads/route.ts) — lead validation and PostgreSQL persistence
- [src/app/api/business/login/route.ts](src/app/api/business/login/route.ts) — business-user login check against the database
- [src/app/api/business/summary/route.ts](src/app/api/business/summary/route.ts) — analytics summary for signed-in business users
- [src/app/layout.tsx](src/app/layout.tsx) — app shell and metadata
- [src/app/globals.css](src/app/globals.css) — theme and styling
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) — database diagram and schema reference
- [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md) — quick walkthrough for the frontend, API, database, and CI/CD
- [.github/workflows/ci.yml](.github/workflows/ci.yml) — CI checks for pull requests and `main`
- [run-app.ps1](run-app.ps1) — Windows helper script to start the app
- [stop-app.ps1](stop-app.ps1) — Windows helper script to stop the app

## Current status

This is a working lead funnel with a local PostgreSQL-backed submission API and a database-gated business analytics view. The next major step is connecting captured leads to a real CRM, email, or business workflow beyond the seeded demo experience.

## Continuous integration

GitHub Actions runs the CI workflow for every pull request targeting `main` and every push to `main`. It starts PostgreSQL, applies the committed Prisma migrations, installs dependencies, generates the Prisma client, runs lint and tests, and builds the application.

The workflow does not need secrets because it uses an isolated PostgreSQL service with test-only credentials. For automatic merging, enable branch protection on `main` and require the `CI / validate` check. GitHub auto-merge can then be enabled per pull request after review; the workflow does not bypass branch protection or merge changes silently.

## GitHub handoff

Before pushing live, create a GitHub repository and add the remote:

```bash
git remote add origin <github-repo-url>
git branch -M main
git push -u origin main
```
