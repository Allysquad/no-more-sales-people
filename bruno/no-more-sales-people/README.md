# Bruno API collection

Import or open this folder in Bruno:

`bruno/no-more-sales-people`

Select the `Local` environment before sending requests. It targets `http://localhost:3000` and includes the seeded demo business credentials.

Run the requests in this order:

1. `Business login`
2. `Business summary`
3. `Export leads`

The login request sets an HttpOnly session cookie. Bruno should retain that cookie for the summary and export requests; no email or password is sent to either GET endpoint.
