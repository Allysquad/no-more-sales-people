# No More Sales People

A conversion-focused lead qualification site built with Next.js, TypeScript, and Tailwind CSS. The app walks a prospect through a short questionnaire, recommends a product route, and captures the lead details for follow-up.

## What this app does

- guides visitors through a multi-step home improvement qualification flow
- recommends a route based on product interest and urgency
- collects name, email, phone, postcode, and project notes
- presents a client-facing summary suitable for a sales team

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod

## Local development

From the project directory, run:

```powershell
cd "C:\Users\Alli_\OneDrive\Documents\no-more-sales-people"
powershell -ExecutionPolicy Bypass -File .\run-app.ps1
```

The app runs on:

```text
http://localhost:3000
```

If you prefer to run it directly:

```powershell
cd "C:\Users\Alli_\OneDrive\Documents\no-more-sales-people"
& "C:\Program Files\nodejs\node.exe" .\node_modules\next\dist\bin\next dev --hostname 0.0.0.0 --port 3000
```

## Useful scripts

```powershell
npm run dev
npm run build
npm run lint
```

## Project structure

- [src/app/page.tsx](src/app/page.tsx) — lead questionnaire, recommendation logic, and capture form
- [src/app/layout.tsx](src/app/layout.tsx) — app shell and metadata
- [src/app/globals.css](src/app/globals.css) — theme and styling
- [run-app.ps1](run-app.ps1) — Windows helper script to start the app
- [stop-app.ps1](stop-app.ps1) — Windows helper script to stop the app

## Current status

This is a working front-end prototype for a home improvement lead funnel. The next major step is connecting the form submission to a real backend, CRM, or email workflow so enquiries are truly captured and actioned.

## GitHub handoff

Before pushing live, create a GitHub repository and add the remote:

```bash
git remote add origin <github-repo-url>
git branch -M main
git push -u origin main
```
