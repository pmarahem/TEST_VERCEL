# AlFajar ERP — separate Vercel test copy

Use this folder as a NEW test project. Do not replace the server/package files in your working desktop/EXE application. No login is added. No SQL Server connection or data migration is performed.

## Files to upload

Keep server.js, package.json, package-lock.json, and vercel.json at the repository root. Include the supplied .gitignore/.vercelignore if your upload workflow supports hidden files.

Copy your CURRENT browser files into public/ while preserving any subfolders:

- index.html, dashboard.html, invoices.html, deliveryorders.html, quotations.html, purchaseorders.html, customerorders.html, creditnotes.html, customers.html, products.html, purchases.html, expenses.html, plus any other pages your app links to.
- common.js, script.js, style.css, dashboard-refresh.js, dashboard-refresh.css, invoices-refresh.css, bootstrap.min.css, to_words_lib.js, and any other browser libraries/assets your pages use.
- logo.jpg for existing PDF templates; logo.png and signature.jpg if used by your application. Preserve exact filenames and letter case: Vercel runs on Linux.

The archive does NOT include your frontend files: copy them from your current working project. No edits to those files are required solely to move them into public/. Frontend API requests must use the deployed app origin, e.g. fetch('/api/invoices-ledger', ...), rather than localhost or a Windows server address.

Do NOT upload .env, node_modules, bundled-assets.js, bundled-server.js, pdfkit.standalone.js, EXE files, database exports, or real credentials. The regular pdfkit npm dependency replaces the local standalone PDFKit file.

## Vercel setup (GitHub website upload; Git installation is not required)

1. Create a private GitHub repository for this TEST copy. Upload the contents of this folder, including your completed public/ directory. Keep server.js at the repository root, not inside a wrapper folder.
2. In Vercel, Add New > Project and import the repository. Use the Express framework preset if auto-detected. Leave build/output settings at the Express defaults: there is no Windows EXE build step and public is NOT the project's root directory.
3. Add Environment Variables before deployment:
   - MONGODB_URI: paste the VALUE from your local .env, without the variable name or surrounding quotes. Use your test cluster/database credentials.
   - MONGODB_DB: the separate test database name (recommended). If omitted, the database name in the connection string is used. This must not point to your live ERP database.
   - TZ: Asia/Dubai, to retain UAE local-date behaviour in your existing APIs.
   Add these to the intended Production/Preview environments; redeploy after later environment changes.
4. Configure Atlas Database Access and Network Access for the Vercel deployment. A dedicated user restricted to the test database is recommended. Standard Vercel egress uses dynamic IPs; Atlas's standard Vercel integration uses 0.0.0.0/0, which allows connection attempts from any IP but still requires database authentication. Do not copy these network settings to a live cluster without reviewing them.
5. Deploy. Open /api/health on the resulting URL: a successful test returns {"success":true,"database":"connected"}.
6. Open / and test dashboard, ledgers, autocomplete, create/edit operations, and PDF downloads against sample data. An empty test database will show empty lists; this setup does not import SQL Server data. Some save flows depend on existing counter/lock documents: see below.

## Startup changes

- Exports the Express app for Vercel; npm start still runs a local server.
- Defers MongoDB connection until an API request and waits for readiness, sharing the initial connection promise across simultaneous requests. Retries initialization after a failed connection.
- Uses a small MongoDB pool per warm instance. Autocomplete caches are instance-local, refreshed on requests after 15 minutes and by your existing save handlers. There is no background interval on Vercel.
- Serves only public/ locally; Vercel serves public/ via its CDN. Extensionless ledger URLs redirect to their .html equivalents.
- Keeps business API handlers and PDF layout logic, changing only PDF resource paths to public/.
- Adds /api/health. Missing or unreachable database configuration returns a generic HTTP 503.
- Removes Windows EXE bundling and unused SQL Server dependencies from this test package. The original uploaded files are not changed.

## Existing data prerequisites

This preparation does not redesign or seed the database. Your existing save handlers use MongoDB transactions and, in several cases, expect numbering/counter lock records to exist. Use an Atlas deployment that supports transactions, and test with a separate copy of the application's sample/test data. If a save reports a lock/counter unavailable message, the required test database setup must be completed first; do not disable the lock to bypass it.

## Limits of verification

JavaScript syntax, dependency installation, HTTP/static routing, MongoDB initialization readiness/concurrency/retry, and autocomplete integration were checked locally. Startup tests used a mocked database, not your Atlas credentials. Live Vercel deployment, real transactions, frontend integration, and PDF rendering with your real assets still need the deployment test. No hosting deployment was performed in this task.

## Local test (optional)

Install Node.js 22, run npm ci, copy .env.example to .env and fill in your test connection values, then run npm start. Open http://localhost:8000. Keep .env on your own computer.

## References

https://vercel.com/docs/frameworks/backend/express
https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/
