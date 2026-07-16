# Community post draft — n8n forum "Share your workflows"

> Post this to https://community.n8n.io/c/workflows/ (the "Share your workflows" category).
> Title: **3 production-ready Google Maps lead-generation workflows (scrape → score → Sheets + email + Excel)**

---

## 3 production-ready Google Maps lead-gen workflows (scrape → score → Sheets + email + Excel)

I packaged three CoreClaw + n8n workflows that turn Google Maps scraping into closed business loops — scrape leads, score them, write to Google Sheets, and optionally email an HTML summary with the full result set as an `.xlsx` attachment. All three are verified end-to-end on n8n 2.30 with real data.

They're available as a **self-hosted n8n template feed** — point your n8n at it and they show up in your Templates panel for one-click import:

```
N8N_TEMPLATES_HOST=https://coreclaw-n8n-templates.t445481611.workers.dev
```

### The three workflows (A → B → C complexity ramp)

**A — Scrape Google Maps Leads to Google Sheets**
Runs the CoreClaw Google Maps scraper for one keyword + location, flattens and scores every lead (email coverage, review signal, ranking), appends 20 structured columns to a Google Sheet. The simplest closed loop: search → enrich → spreadsheet.

**B — Google Maps Leads → Sheets + Email Summary with Excel**
Same pipeline, plus emails you an HTML summary — Top-10 ranked leads table + email-coverage stats — with the full result set attached as `gmaps-leads.xlsx`. One run gives you both a live Sheet and an inbox-ready report. Ideal for daily/weekly lead drops to a sales team.

**C — Google Maps Leads via Callback (No Polling) → Email with Excel**
Event-driven variant for large scrapes: starts an async CoreClaw run with a `callback_url`, then the moment CoreClaw POSTs back on completion it fetches results, exports `.xlsx`, and emails the report. No polling, no wasted wait. Best for long-running or high-volume jobs (needs your n8n reachable from the internet).

### Requirements
- `n8n-nodes-coreclaw` community node (≥ 0.4.1, on npm) — provides the CoreClaw scraper node
- A CoreClaw API key (free tier available)
- Google Sheets OAuth2 (A, B) and/or Gmail OAuth2 (B, C) credentials

### How to get them

**Option 1 — Templates panel (recommended):** set `N8N_TEMPLATES_HOST=https://coreclaw-n8n-templates.t445481611.workers.dev` on your self-hosted n8n, restart, open Templates, click **Use workflow**.

**Option 2 — Import from URL:** grab the raw JSON from the GitHub repo and use n8n's *Import from URL*.

**Option 3 — Clone the repo:** https://github.com/Core-Claw/coreclaw-n8n-workflows

### What's inside the scoring
Each lead gets a 0–100 score blending email availability (40 pts), review count/rating signal (35 pts), and search-rank position (25 pts), plus a normalized status tier. The Code node is fully readable — tweak the weights for your own definition of "good lead."

### Notes
- The `Run and Get Results` node needed a fix in the CoreClaw node package (a `spec.params` / display-options mismatch that threw `Could not find property`). It's fixed in `n8n-nodes-coreclaw` 0.4.1 on npm — install `@latest` and you're set.
- Workflows import with credentials stripped; you bind your own CoreClaw/Google creds on import.

Happy to take feedback on the scoring weights or the workflow structure. If you build something cool on top of this, share it back!
