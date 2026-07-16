# CoreClaw n8n Workflows (v2)

Production-ready n8n workflow templates that turn [CoreClaw](https://coreclaw.com)'s Google Maps scraper into closed business loops: scrape → score → **write to Google Sheets** → **email a summary with an Excel attachment**.

Built for `n8n-nodes-coreclaw` **0.4.1** (node `description.version: 2`, 34 operations on `/api/v2/`). Verified end-to-end on n8n **2.30.4**.

## What's here

| Workflow | What it does | Run mode | Downstream |
| --- | --- | --- | --- |
| [`workflows/gmaps-leads-to-sheets.json`](workflows/gmaps-leads-to-sheets.json) | Run the Google Maps scraper, flatten + score rows, append to a Google Sheet. | `Run and Get Results` (poll) | Google Sheets |
| [`workflows/gmaps-leads-sheets-email-summary.json`](workflows/gmaps-leads-sheets-email-summary.json) | Same, plus export the run as `.xlsx`, download it, and email an HTML summary (Top-10 table + email-coverage stats) with the xlsx attached. | `Run and Get Results` (poll) | Google Sheets + Gmail |
| [`workflows/gmaps-leads-callback-export.json`](workflows/gmaps-leads-callback-export.json) | Event-driven: run async with `callback_url`, and on CoreClaw's callback fetch results, export xlsx, email it. No polling — needs n8n reachable from the internet. | callback webhook | Gmail |

A → B → C is a deliberate complexity ramp: pick the smallest one that does the job.

## Why this replaced the old pack

The previous 12 workflows in [`legacy-v1/`](legacy-v1/ARCHIVED.md) are archived because:

1. They targeted the **v1 node contract** (`scraperSlug` + `scraper.run`/`run.get`/`run.getResults` + explicit `version: v1.x.x`). The v2 node uses `worker_id` + `Run and Get Results`; the parameters no longer match.
2. They **claimed** Google Sheets / Gmail / Airtable integration but contained zero such nodes — only Code nodes that assembled payload field names. These workflows actually wire the downstream nodes.
3. 9 of 12 were the same Google Maps scraper with different post-processing, generated from a single source script. These three are hand-written against the real worker schema.

## Prerequisites

- n8n **2.22.5+** (built and import-tested on 2.30.4).
- The `n8n-nodes-coreclaw` community package installed (**Settings → Community nodes → install `n8n-nodes-coreclaw`**). On self-hosted Docker you can also `npm install n8n-nodes-coreclaw` inside the n8n user folder and restart.
- Three credentials — see [`docs/credentials-binding.md`](docs/credentials-binding.md) and [`docs/google-oauth-setup.md`](docs/google-oauth-setup.md):
  - **CoreClaw API** (key + base URL `https://openapi.coreclaw.com`)
  - **Google Sheets OAuth2**
  - **Gmail OAuth2** (workflows B and C only)

## Quick start

1. **Install the node package** and **create the credentials** above.
2. **Create a Google Spreadsheet** with a sheet named `Leads` (workflows A and B write there).
3. **Import** a workflow JSON: n8n → Workflows → ⋮ → **Import from File**.
4. **Bind credentials** on every node flagged `REPLACE_WITH_*` (see [`docs/credentials-binding.md`](docs/credentials-binding.md)).
5. For workflow C, set `callback_url` on the `Start Run` node to your CoreClaw Trigger webhook URL — and make sure n8n is reachable from the public internet (or via a tunnel like cpolar/frp).
6. Open the `Input Config` node, set your `keywords` / `base_location` / `max_results`, click **Execute workflow**.

The default search (`HVAC Contractors` / `New York, USA` / `max_results=5`) costs roughly `$0.008` per run at the worker's published rate and finishes in ~30–40s.

## How the scoring works

The `Normalize & Score` Code node computes `lead_score` (0–100):

```
score = round(min(100, review_rating · log10(review_count + 1) · 12  +  hasEmail·15  +  hasWebsite·5))
```

Tune the weights in the Code node. Rows are sorted by `lead_score` descending before they hit the sheet and the email table.

## Field mapping

Worker result fields → sheet columns are documented in [`docs/field-map.md`](docs/field-map.md). That file also lists the four places the worker's README sample disagrees with real output (e.g. `review_rating`/`review_count`, not `rating`/`reviews_total`; `all_emails` is a string, not an array) — these workflows use the real fields.

## Validation

Both polling workflows were executed end-to-end against a live CoreClaw account and a real Google account on n8n 2.30.4 (worker `coreclaw/google-maps-scraper`, search `HVAC Contractors` / `New York, USA` / `max_results=5`):

| Workflow | Result |
| --- | --- |
| A — gmaps-leads-to-sheets | ✅ `success` — 5 records scraped, scored, appended to a Google Sheet (`Leads` tab, 20 columns). |
| B — gmaps-leads-sheets-email-summary | ✅ `success` — same scrape + Sheet append, plus `.xlsx` exported (64 KB) and emailed to the configured recipient with an HTML Top-10 summary. |
| C — gmaps-leads-callback-export | Imported and activated; runtime requires a public/tunnel webhook URL (not exercised locally). See the workflow's sticky notes. |

Google Sheet created by the run: a spreadsheet titled **CoreClaw Maps Leads** with a **Leads** sheet and a 20-column header row (`lead_score, search_rank, title, phone, website, emails, primary_category, categories, review_rating, review_count, status, city, state, address, latitude, longitude, place_url, source_keyword, source_location, scraped_at`).

## Node-package bug (fixed in 0.4.1)

During validation, the **Run and Get Results** node failed with `NodeOperationError: Could not find property` from `collectParams`. Root cause: in `n8n-nodes-coreclaw` ≤ 0.4.0, the `runAndGetResults`/`rerunAndGetResults` specs spread `runBodyParams` (callback_url / is_async / body offset+limit) and `resultPaginationParams` into `spec.params`, but the node description only displays those fields for `run`/`rerunLastRun`/`abortLastRun` — not for `runAndGetResults`. `findDisplayedProperty` therefore threw.

**Fixed upstream in 0.4.1** ([commit](https://github.com/Core-Claw/n8n-nodes-coreclaw/commit/1710c22)): the composite specs now keep only `workerId`/`version`/`input_json`/`raw_input_json` in `spec.params` (returnAll is fetched separately in `router.js`; offset/limit fall back to 0/50). The fix is published to npm, so anyone installing `n8n-nodes-coreclaw@latest` (≥ 0.4.1) gets the working version — no patching needed.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Node shows `REPLACE_WITH_*` / red flag | Bind the credential (see credentials-binding.md). |
| CoreClaw `12001` / `12002` | Invalid or unauthorized API key — recreate the CoreClaw API credential. |
| CoreClaw `11004` | Worker not found — the `workerId` mode `id` value must be `coreclaw~google-maps-scraper` (owner path) or the store slug. |
| CoreClaw `30001` | Insufficient balance on your CoreClaw account. |
| `Run did not finish before polling timed out` | The `Run and Get Results` node polls ~4 min max. For long jobs, use workflow C (callback) instead of polling. |
| Google `redirect_uri_mismatch` | OAuth redirect URI must be exactly `http://localhost:5678/rest/oauth2-credential/callback` (see google-oauth-setup.md). |
| Gmail `invalid_scope` | Use `gmail.send` only. |
| Workflow C never fires | n8n isn't reachable from the internet; CoreClaw can't POST to your webhook. Use a tunnel or deploy n8n publicly. |
| Empty `emails` / `categories` columns | You're on a worker version whose output still uses arrays — check [`docs/field-map.md`](docs/field-map.md) "Gotchas". |

## Repository layout

```
.
├── workflows/          # the three v2 workflow JSON files (import these)
├── docs/               # credential setup, binding guide, field map
├── legacy-v1/          # archived v1 workflows (do not use with the v2 node)
└── README.md
```

## License

MIT — same as the upstream node package.
