# Next Steps

Use this file as the source of truth for the active work list. Update it whenever a task is completed, blocked, or newly identified.

## Active priorities

### 1. Connect the lead form to a real business workflow
- Replace local JSON storage with a CRM, email, or backend trigger.
- Confirm the business owner for receiving leads.
- Add a success confirmation message and notification flow.

### 2. Remove placeholder metrics from the sales snapshot
- Replace fake numbers with real analytics or hide them until live data exists.
- Confirm whether this panel is for demo-only or production-facing reporting.

### 3. Production hardening for launch
- Add environment variables and deployment config.
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

## Notes

- This file should be reviewed during planning and before demos.
- Keep it concise and action-oriented.
- If a task is blocked, add the blocker here with the owner and next action.
