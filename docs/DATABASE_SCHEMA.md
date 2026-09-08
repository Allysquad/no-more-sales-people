# Database Schema

This document describes the PostgreSQL schema currently used by the lead-capture API.

## System diagram

```mermaid
flowchart LR
    Visitor[Visitor] --> Frontend[Next.js frontend]
    Frontend --> API[POST /api/leads]
    API --> Validation[Lead validation]
    Validation --> Prisma[Prisma ORM]
    Prisma --> Database[(PostgreSQL)]
    Database --> Leads[(Lead table)]

    Local[(Docker PostgreSQL)] -. local DATABASE_URL .-> Prisma
    Supabase[(Supabase PostgreSQL)] -. future DATABASE_URL .-> Prisma
```

The frontend and API run in the same Next.js application. PostgreSQL runs separately in Docker during local development. Supabase can replace the local database later by changing `DATABASE_URL`; the application code and Prisma model remain the same.

## Entity relationship diagram

```mermaid
erDiagram
    LEAD {
        string id PK "CUID"
        string name
        string email "indexed"
        string phone
        string postcode
        string notes
        json responses
        datetime createdAt "indexed"
    }
```

## Lead table

| Column | PostgreSQL type | Required | Default | Purpose |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | Yes | `cuid()` | Unique lead identifier |
| `name` | `TEXT` | Yes | None | Contact name |
| `email` | `TEXT` | Yes | None | Contact email address |
| `phone` | `TEXT` | Yes | None | Contact phone number |
| `postcode` | `TEXT` | Yes | None | Property postcode |
| `notes` | `TEXT` | Yes | `''` | Optional project notes |
| `responses` | `JSONB` | Yes | None | Questionnaire answers |
| `createdAt` | `TIMESTAMP(3)` | Yes | `now()` | Submission timestamp |

## Indexes

- `email` is indexed for contact lookup.
- `createdAt` is indexed for recent-lead queries and reporting.

## Current boundaries

- There is currently no separate customer, property, campaign, or CRM table.
- Questionnaire answers are stored in `responses` as JSON to keep the initial schema flexible.
- Lead validation happens before Prisma writes to PostgreSQL.
- The schema is defined in `prisma/schema.prisma` and applied through `prisma/migrations/`.

## Local database

The local database is defined in `docker-compose.yml` and uses the connection string in `.env`:

```text
postgresql://app:app_password@localhost:5432/no_more_sales_people?schema=public
```

Start it with:

```powershell
npm run db:up
npm run db:migrate
```

Stop it with:

```powershell
npm run db:down
```
