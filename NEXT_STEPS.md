# Next Steps

Use this file as the source of truth for the active work list. Update it whenever a task is completed, blocked, or newly identified.

## Active priorities

### 1. Connect the lead form to a real business workflow
- Replace the seeded demo flow with a CRM, email, or backend trigger for production leads.
- Confirm the business owner for receiving and triaging enquiries.
- Add a real notification flow and success messaging for live operations.

### 2. Harden business access and security
- Add a proper auth layer instead of the demo-only database lookup.
- Review password handling and whether business credentials should be stored in a secure secret manager.
- Limit analytics access to approved business users only.

### 3. Production hardening for launch
- Add environment variables and deployment config for production.
- Add rate limiting and anti-spam protection.
- Review privacy and consent messaging for lead capture.

### 4. QA and polish
- Test complete mobile and desktop flow.
- Validate form error handling and accessibility.
- Review recommendation logic against real customer scenarios.

### 5. Release readiness
- Set up hosting and deployment pipeline.
- Add monitoring and error logging.
- Confirm final business flow before launch.

## Completed items

- Initial app scaffold and lead qualification prototype created.
- Project initialized in Git and pushed to GitHub.
- Demo changelog created and automated via GitHub Actions.
- Local lead submission API and storage layer added.
- Core form now submits to an API endpoint instead of only logging to the console.
- PostgreSQL and Prisma integration added with Docker-based local development and a Supabase-compatible connection boundary.
- Business dashboard login and analytics view added with a seeded demo business user.
- Business-only analytics gating added so the public homepage stays as the lead questionnaire by default.

## Notes

- This file should be reviewed during planning and before demos.
- Keep it concise and action-oriented.
- If a task is blocked, add the blocker here with the owner and next action.
