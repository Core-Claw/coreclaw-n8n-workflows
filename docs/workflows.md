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
Wait/Get Status/If Succeeded/If Failed x 6
Success: Get Results -> Summarize Results -> Export CSV -> Export JSON -> Get Success Logs -> Build Success Summary
Failure: Get Failure Logs -> Build Failure Summary
Timeout: Get Timeout Logs -> Build Timeout Summary
```

What it does:

- Searches the CoreClaw Store for the Google Maps keyword scraper.
- Selects the target scraper from store search results by slug/title.
- Reads the current scraper details before every run.
- Uses the current `version` returned by CoreClaw instead of hardcoding a worker version.
- Reads `parameters.custom` and `parameters.system` from Get Details.
- Generates the Google Maps keyword campaign config from **Lead Search Input** plus the live scraper detail response.
- Starts the scraper run.
- Polls status up to six times.
- Routes terminal status `3` to the success branch.
- Routes terminal status `4` to the failure branch.
- Routes non-terminal status after six attempts to the timeout branch.
- Returns a compact summary with `run_slug`, result counts, first lead preview, CSV download URL, JSON download URL, and logs URL.

Key config fields:

| Field | Meaning |
| --- | --- |
| `store_search_query` | Search phrase used to find the scraper in CoreClaw Store |
| `store_search_limit` | Maximum number of scraper store results to inspect |
| `target_scraper_title` | Expected scraper title |
| `target_scraper_slug` | Expected scraper slug used as the strongest selection signal |
| `keyword` | Search phrase, for example `coffee shop` |
| `base_location` | Search location, for example `New York, USA` |
| `max_results` | Requested result count for the scraper |
| `max_results_hard_limit` | Guardrail that caps `max_results` |
| `wait_seconds` | Delay between status polls |
| `result_limit` | Number of inline result records to fetch after success |
| `export_filter_keys` | Comma-separated CSV columns |
| `fetch_reviews` | Whether to collect review data |
| `fetch_social_info` | Whether to collect social information |
| `cpus`, `memory`, `execute_limit_time_seconds` | CoreClaw system runtime settings |

Recommended first run:

```text
keyword = coffee shop
base_location = New York, USA
max_results = 5
wait_seconds = 30
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
