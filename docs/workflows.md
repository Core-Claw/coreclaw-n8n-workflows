# Workflow Guide

## CoreClaw Google Maps Leads Complete Global

Use this workflow when you want a complete lead-generation run in one n8n execution.

Node chain:

```text
Manual Trigger
Lead Search Input
Search CoreClaw Scrapers
Select Google Maps Keyword Scraper
Get Current Scraper Details
Generate Campaign Config
Start CoreClaw Run
Wait Before Next Poll
Get Run Status
If Run Terminal
  false -> Wait Before Next Poll
  true -> If Run Succeeded
Success: Get Results -> Summarize Results -> Export CSV -> Export JSON -> Get Success Logs -> Build Success Summary
Failure: Get Failure Logs -> Build Failure Summary
```

What it does:

- Searches the CoreClaw Store for the Google Maps keyword scraper.
- Selects the target scraper from store search results by slug/title.
- Reads the current scraper details before every run.
- Uses the current `version` returned by CoreClaw instead of hardcoding a worker version.
- Reads `parameters.custom` and `parameters.system` from Get Details.
- Generates the Google Maps keyword campaign config from **Lead Search Input** plus the live scraper detail response.
- Starts the scraper run.
- Polls status in a live loop until CoreClaw reports terminal status `>= 3`.
- Routes terminal status `3` to the success branch.
- Routes other terminal statuses to the failure/logs branch.
- Returns a compact summary with `run_slug`, result counts, first lead preview, CSV download URL, JSON download URL, and logs URL.

Key config fields:

| Field | Meaning |
| --- | --- |
| `keyword` | Search phrase, for example `coffee shop` |
| `base_location` | Search location, for example `New York, USA` |
| `max_results` | Requested result count for the scraper |
| `fetch_reviews` | Whether to collect review data |
| `fetch_social_info` | Whether to collect social information |
| `wait_seconds` | Delay between status polls |

The workflow automatically searches CoreClaw Store for the Google Maps keyword scraper, selects the scraper, reads the current version/schema, derives system runtime settings from **Get Current Scraper Details**, and exports the default CSV/JSON fields.

Recommended first run:

```text
keyword = coffee shop
base_location = New York, USA
max_results = 3
wait_seconds = 10
fetch_reviews = false
fetch_social_info = false
```

## CoreClaw Google Maps Leads Starter Global

Use this workflow when you only need to start a CoreClaw run and continue with custom logic.

Node chain:

```text
Manual Trigger
Lead Search Input
Search CoreClaw Scrapers
Select Google Maps Keyword Scraper
Get Current Scraper Details
Generate Campaign Config
Start CoreClaw Run
Build Starter Summary
```

Output:

```json
{
  "outcome": "started",
  "run_slug": "run_xxx",
  "scraper_slug": "01KPD6M5YQADCQKGVKPDZVYC63",
  "scraper_title": "Google Map Details By Keyword",
  "version": "current version from CoreClaw",
  "keyword": "coffee shop",
  "base_location": "New York, USA",
  "requested_max_results": 5,
  "next_step": "Use Run > Get, Get Results, Export Results, or Logs with this run_slug after the run completes."
}
```

Build on top of this workflow if you want your own webhook callback, custom polling loop, CRM write, sheet append, Slack notification, or enrichment stage.
