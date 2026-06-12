# CoreClaw n8n Commercial Workflow Pack

This repository contains 12 production-oriented n8n workflow templates for the official CoreClaw community node.

The templates are designed for daily sales, revenue operations, ecommerce intelligence, reputation operations, and partnership workflows. Each workflow produces scored records, recommended actions, and ready-to-send payloads for Google Sheets, Airtable, CRM, Slack, Notion, email drafts, and webhooks.

## What Changed

- Rebuilt all 12 workflows with stable English node names.
- Removed orphan nodes, sticky notes, disconnected NoOp queues, and stale branches.
- Added commercial scoring, priority routing, CRM stages, evidence fields, and executive summaries.
- Added retry settings to CoreClaw, website fetch, and optional AI enrichment nodes.
- Added CoreClaw `systemParams` for consistent worker runtime configuration.
- Added stronger website email extraction with domain matching and placeholder/image-file filtering.
- Kept secrets out of workflow JSON. CoreClaw credentials are bound inside the local n8n instance only.

## Workflows

| File | Workflow | Main use |
| --- | --- | --- |
| `coreclaw-gmaps-leads-simple.json` | CoreClaw Maps Leads | Local lead scoring and CRM-ready payloads |
| `coreclaw-gmaps-leads-email-extraction-simple.json` | CoreClaw Maps Email Finder | Lead enrichment with website email discovery |
| `coreclaw-gmaps-leads-email-extraction.json` | CoreClaw Email Outreach Leads | AI-assisted outbound pitch and next-step generation |
| `coreclaw-gmaps-b2b-enrichment-simple.json` | CoreClaw B2B Enrichment | B2B account qualification and disqualification guardrails |
| `coreclaw-gmaps-leads-complete-enhanced.json` | CoreClaw Lead Operations | Full lead ops pipeline with AI and website signals |
| `coreclaw-google-maps-leads-complete-global.json` | CoreClaw Global Prospecting | International clinic/aesthetic prospecting |
| `coreclaw-gmaps-to-sheets.json` | CoreClaw Sheets Leads | Spreadsheet-ready lead rows |
| `coreclaw-gmaps-airtable-email.json` | CoreClaw Airtable Pipeline | Airtable CRM field payloads |
| `coreclaw-gmaps-reviews-monitor-simple.json` | CoreClaw Reviews Monitor | Daily reputation monitoring |
| `coreclaw-gmaps-reviews-monitor.json` | CoreClaw Reputation Operations | AI-assisted reputation actions |
| `coreclaw-amazon-product-intelligence.json` | CoreClaw Amazon Product Intelligence | Ecommerce competitor and product opportunity intelligence |
| `coreclaw-instagram-profile-intelligence.json` | CoreClaw Instagram Profile Intelligence | Brand, creator, and partner account intelligence |

## Requirements

- n8n 2.22.5 or newer.
- `n8n-nodes-coreclaw` installed in n8n community nodes.
- A CoreClaw API credential configured in n8n.
- Optional AI enrichment: set `ASTRON_API_KEY` in the n8n runtime environment, or replace the placeholder privately inside your n8n instance.

Do not commit real API keys into these JSON files.

## Import Notes

After importing the JSON files, bind the CoreClaw credential on every `Start CoreClaw Run`, `Get Run Status`, and `Get Run Results` node.

The workflow JSON intentionally contains no credential IDs. The local sync helper can bind credentials to a local n8n instance without modifying repository templates:

```powershell
$env:N8N_EMAIL="you@example.com"
$env:N8N_PASSWORD="..."
$env:ASTRON_API_KEY="..."
node tools\sync-local-n8n.js
```

## Validation

The local n8n instance was backed up before cleanup. The cleanup deleted 222 historical CoreClaw duplicate workflows and left exactly 12 current CoreClaw workflows.

Representative real executions in local n8n:

| Workflow | Execution ID | Result |
| --- | ---: | --- |
| CoreClaw Maps Leads | 167 | Success, 3 records, avg score 60, payloads ready |
| CoreClaw Email Outreach Leads | 168 | Success, AI enrichment, hot lead, verified email |
| CoreClaw Amazon Product Intelligence | 169 | Success, 3 products, 2 high-value records |
| CoreClaw Instagram Profile Intelligence | 171 | Success, Tier-1 brand account intelligence |
| CoreClaw Maps Email Finder | 173 | Success, enriched email payloads |
| CoreClaw Sheets Leads | 172 | Success, spreadsheet-ready lead rows |
| CoreClaw B2B Enrichment | 174 | Success, B2B qualification guardrails |
| CoreClaw Lead Operations | 175 | Success, full-funnel lead ops output |
| CoreClaw Airtable Pipeline | 176 | Success, Airtable/CRM payloads |
| CoreClaw Global Prospecting | 181 | Success, international clinic prospecting |
| CoreClaw Reviews Monitor | 178 | Success, daily reputation summary |
| CoreClaw Reputation Operations | 179 | Success, AI-assisted reputation actions |

Repository validation checks:

- All 12 JSON files parse successfully.
- No sticky notes or NoOp orphan nodes remain.
- No missing connection sources or targets.
- No code-node syntax errors.
- No real CoreClaw or AI API keys are present in repository files.

## Local Tools

- `tools/generate-commercial-workflows.js`: regenerates all 12 workflow JSON files from a single source of truth.
- `tools/sync-local-n8n.js`: syncs the repository workflows into a local n8n instance, binds local credentials, and removes duplicate CoreClaw workflows.
- `tools/run-local-workflow.js`: triggers a workflow through n8n REST and reads the final execution output.

These tools are operational helpers, not required for normal n8n import.
