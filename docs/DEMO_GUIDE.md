# Demo Guide

Use this runbook to demonstrate the project from the visitor experience through lead persistence and delivery automation.

## 1. Start the demo

Prerequisites:

- Docker Desktop is running.
- Node.js and npm are installed.
- PowerShell is available.

From the project directory:

```powershell
cd "C:\Users\Alli_\OneDrive\Documents\no-more-sales-people"
Copy-Item .env.example .env -ErrorAction SilentlyContinue
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm install"
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:generate"
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:up"
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:deploy"
powershell -ExecutionPolicy Bypass -NoLogo -File .\run-app.ps1
```

Open [http://localhost:3000](http://localhost:3000).

To stop the demo:

```powershell
powershell -ExecutionPolicy Bypass -NoLogo -File .\stop-app.ps1
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:down"
```

## 2. Demo the qualification flow

1. Start on the **Lead finder** screen.
2. Select an answer for each of the six questions.
3. Point out the progress indicator and the changing question count.
4. Use the Back button to demonstrate that the flow can move to an earlier question.
5. Complete the final question to open the recommendation and contact form.

The six qualification areas are:

- Product goal: windows, doors, both, or conservatory/extension
- Main issue: heat loss, security, appearance, or noise
- Urgency: ASAP, within 1-3 months, or researching
- Property type: house, bungalow, flat/apartment, or commercial
- Area: north, Midlands, south, or unsure
- Budget: under £3k, £3k-£8k, £8k-£15k, or £15k+

## 3. Demo the recommendation

Choose **Windows** for the first question and complete the flow. The result should be **Full Home Upgrade Package**.

Repeat with these choices to show the other recommendation branches:

| First answer | Expected recommendation |
| --- | --- |
| Windows or Both | Full Home Upgrade Package |
| Doors | Secure Entry Upgrade |
| Conservatory / extension | Conservatory Refurbishment |
| Any other or missing goal | Bespoke Home Improvement Quote |

The recommendation is calculated in `getRecommendation` in `src/app/page.tsx`.

## 4. Demo form validation

On the recommendation screen, submit the form with empty fields. Each required field should show a validation message.

Then enter:

- Name: `Alex Smith`
- Email: `alex@example.com`
- Phone: `07700 900123`
- Postcode: `M1 1AA`
- Notes: `Demo enquiry for window upgrades`

Submit the form and confirm the success message appears. The form resets to the first question after a successful submission.

## 5. Demo the API directly

The frontend sends the form to `POST /api/leads`. With the app and database running, this PowerShell request should return HTTP `201` and a created lead record:

```powershell
$payload = @{
  name = "Demo User"
  email = "demo@example.com"
  phone = "07700 900123"
  postcode = "M1 1AA"
  notes = "Direct API demo"
  responses = @{
    goal = "Windows"
    issue = "Drafts / heat loss"
    urgency = "Within 1-3 months"
  }
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/leads" `
  -Method Post `
  -ContentType "application/json" `
  -Body $payload
```

The route validates the payload before Prisma writes it to PostgreSQL.

## 6. Demo the database

Check that PostgreSQL is running and migrations are applied:

```powershell
docker compose ps
powershell -ExecutionPolicy Bypass -NoLogo -Command "npx prisma migrate status"
```

The current schema contains one `Lead` table. See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for the diagram and field reference.

## 7. Demo quality checks and CI/CD

Run the same checks used by GitHub Actions:

```powershell
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:generate"
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run db:deploy"
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run lint"
node --test tests/lead-store.test.mjs
powershell -ExecutionPolicy Bypass -NoLogo -Command "npm run build"
```

The CI workflow runs these checks for pull requests and pushes to `main`. It uses an isolated PostgreSQL service, so it does not need production credentials.

## 8. Keep this guide current

The project inventory below is generated from repository files and package scripts. Run this command after changing a project entry point, script, workflow, or documentation path:

```powershell
node scripts/update-demo-guide.mjs
```

CI checks the generated inventory on pull requests. After a change reaches `main`, GitHub Actions refreshes it automatically and commits the update. The narrative demo steps above remain human-maintained so changes to the product experience can be explained clearly rather than guessed from filenames.

<!-- BEGIN GENERATED PROJECT INVENTORY -->
### Repository surfaces

| Area | Entry point | Quick check |
| --- | --- | --- |
| Visitor flow | `src/app/page.tsx` | Open http://localhost:3000 |
| Lead API | `src/app/api/leads/route.ts` | POST http://localhost:3000/api/leads |
| Database schema | `prisma/schema.prisma` | npm run db:deploy |
| Database migrations | `prisma/migrations/` | npx prisma migrate status |
| Database diagram | `docs/DATABASE_SCHEMA.md` | Open the Markdown preview |
| Demo runbook | `docs/DEMO_GUIDE.md` | Follow this document |
| CI workflow | `.github/workflows/ci.yml` | Review the Actions run |

### Package scripts

| Script | Command |
| --- | --- |
| `npm run dev` | `next dev` |
| `npm run build` | `next build` |
| `npm run start` | `next start` |
| `npm run lint` | `eslint` |
| `npm run db:up` | `docker compose up -d postgres` |
| `npm run db:down` | `docker compose down` |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run docs:demo` | `node scripts/update-demo-guide.mjs` |
| `npm run docs:demo:check` | `node scripts/update-demo-guide.mjs --check` |
<!-- END GENERATED PROJECT INVENTORY -->
