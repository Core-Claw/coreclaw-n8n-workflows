# CoreClaw Google Maps Leads n8n Workflow

One complete n8n workflow for running the CoreClaw **Google Map Details By Keyword** scraper and exporting Google Maps lead data.

## File

| File | Purpose |
| --- | --- |
| `coreclaw-google-maps-leads-complete-global.json` | Complete n8n workflow: scraper discovery, live scraper details, generated campaign config, run start, live polling, results, CSV/JSON export, and logs |

Raw import URL:

```text
https://raw.githubusercontent.com/Core-Claw/coreclaw-n8n-workflows-google-maps/main/coreclaw-google-maps-leads-complete-global.json
```

## What It Does

The workflow:

1. Searches CoreClaw Store for the Google Maps keyword scraper.
2. Selects **Google Map Details By Keyword**.
3. Reads the live scraper details before each run.
4. Uses the current scraper `version` from CoreClaw.
5. Builds `customParams` from the live scraper schema and user inputs.
6. Reuses system defaults from the live scraper details.
7. Starts the CoreClaw run.
8. Polls until CoreClaw returns a terminal status.
9. Fetches result preview, exports CSV and JSON, and retrieves logs.

## Requirements

- A self-hosted n8n instance.
- The `n8n-nodes-coreclaw` community node installed.
- A CoreClaw API credential created in n8n.

n8n Cloud may not allow unverified community nodes. If the CoreClaw node is unavailable, use self-hosted n8n.

## Import And Run

1. Open n8n.
2. Import `coreclaw-google-maps-leads-complete-global.json`, or import from the raw URL above.
3. Select your CoreClaw credential on every CoreClaw node.
4. Open **Lead Search Input**.
5. Edit the fields you need.
6. Execute the workflow.

## User Inputs

Only the **Lead Search Input** node normally needs editing:

| Field | Meaning | Example |
| --- | --- | --- |
| `keyword` | Google Maps search keyword | `coffee shop` |
| `base_location` | Search location | `New York, USA` |
| `max_results` | Maximum lead count to request | `3` |
| `fetch_reviews` | Whether to fetch review data | `false` |
| `fetch_social_info` | Whether to enrich websites/social profiles | `false` |
| `wait_seconds` | Delay between polling attempts | `10` |

Recommended first test:

```text
keyword = coffee shop
base_location = New York, USA
max_results = 3
fetch_reviews = false
fetch_social_info = false
wait_seconds = 10
```

## Network Notes

The workflow does not include API keys, credential IDs, local file paths, proxy settings, or historical run IDs.

Overseas users normally should not need a proxy. Users running n8n from mainland China may need to configure outbound proxy environment variables on the n8n server process, but proxy addresses should not be saved inside the shared workflow JSON.

## 中文说明

中文使用说明见 [README.zh-CN.md](README.zh-CN.md).
