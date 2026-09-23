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
    BUSINESS_USER }o--|| LEAD_PLAN : "uses"
    BUSINESS_USER ||--o{ LEAD_SUBSCRIPTION : "accepts"
    BUSINESS_USER {
        string id PK "CUID"
        string name
        string email UK
        string password
        string leadPlanId FK
        datetime createdAt
    }
    LEAD_PLAN {
        string id PK "CUID"
        string name
        enum type "country scope"
        enum[] countries
        enum[] ratings
        int monthlyPricePence
        int pricePerLeadPence
        datetime createdAt
    }
    LEAD_SUBSCRIPTION {
        string id PK "CUID"
        string businessUserId FK
        enum type
        enum[] countries
        enum rating
        int monthlyPricePence "locked at acceptance"
        datetime acceptedAt
        boolean active
        datetime createdAt
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

## Lead plans

Each `BusinessUser` is assigned one `LeadPlan`. A plan controls which leads the authenticated customer can see:

- `ONE_COUNTRY` uses one value in `countries`.
- `MULTIPLE_COUNTRIES` uses two or more values in `countries`.
- `ALL_COUNTRIES` ignores the country list.
- `ratings` contains the permitted `BRONZE`, `SILVER`, `GOLD`, and/or `PLATINUM` lead ratings.
- `monthlyPricePence` and `pricePerLeadPence` store the commercial pricing for the plan.

The customer summary and export facade filter leads by both country and computed lead rating. The demo business user is assigned an all-country, all-rating plan.

## Lead subscriptions

An accepted `LeadSubscription` is required before a customer can access summary or export results. The customer selects one rating and a country scope on one page:

- Scotland: £1,000/month at Bronze
- England: £2,000/month at Bronze
- Wales: £800/month at Bronze
- Ireland: £500/month at Bronze
- Silver adds 20%, Gold adds 75%, and Platinum adds 125%.
- Multiple-country selections receive 10% off the combined rating-adjusted total.
- All countries receives 20% off the combined rating-adjusted total.

The server recalculates and stores the accepted monthly amount in pence, so the browser cannot change the price or unlock leads by altering the request. A new accepted subscription deactivates the previous one.

## Current boundaries

- There is currently no separate property, campaign, or CRM table.
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
