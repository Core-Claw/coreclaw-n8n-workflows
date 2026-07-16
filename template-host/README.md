# CoreClaw n8n Template Host

A Cloudflare Worker that serves the three CoreClaw lead-generation workflows as
an **n8n template source**. Any self-hosted n8n instance can point at it and see
these workflows in its in-app **Templates** panel — one-click import, no manual
JSON download.

**Live URL:** `https://coreclaw-n8n-templates.t445481611.workers.dev`

## What it serves

Implements the `N8N_TEMPLATES_HOST` contract (verified against `api.n8n.io`):

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Liveness probe |
| `GET /templates/categories` | Category taxonomy (Sales → Lead Generation) |
| `GET /templates/search` | Browseable list of all 3 workflows |
| `GET /templates/workflows/{id}` | Full detail (description, nodes, creator) |
| `GET /workflows/templates/{id}` | Flat importable graph (what n8n imports) |
| `GET /templates/collections` | Collections list |
| `GET /templates/collections/{id}` | The "CoreClaw Google Maps Lead Generation" collection (all 3) |

Workflow IDs: `1001` (→ Sheets), `1002` (→ Sheets + Email + Excel), `1003` (callback → Email + Excel).

The workflow JSONs are **bundled into the Worker at deploy time** (static imports) — no runtime fetch of GitHub, so the host stays fast and works even if GitHub raw is unreachable.

## Use it in your n8n

Set one environment variable on your self-hosted n8n and restart:

```bash
# docker-compose.yml
services:
  n8n:
    environment:
      - N8N_TEMPLATES_HOST=https://coreclaw-n8n-templates.t445481611.workers.dev
```

```bash
# or plain docker
docker run -e N8N_TEMPLATES_HOST=https://coreclaw-n8n-templates.t445481611.workers.dev ...
```

Open n8n → **Templates** panel → you'll see the three CoreClaw workflows instead of the default library. Click any → **Use workflow** → it imports into your canvas.

> Note: this replaces n8n's official template library for your instance. To revert, unset `N8N_TEMPLATES_HOST`. To merge with the official library, run your own Worker that proxies both — see `worker.js`.

## Deploy your own

```bash
cd template-host
npm i -g wrangler
wrangler login           # or set CLOUDFLARE_API_TOKEN
wrangler deploy
```

Then edit the three `*.json` files (or `WORKFLOWS`/`COLLECTIONS` arrays in `worker.js`) and redeploy to update.

## Files

- `worker.js` — the Worker (router + response builders; static-imports the workflow JSONs)
- `wrangler.toml` — Cloudflare Workers config
- `gmaps-leads-to-sheets.json` / `gmaps-leads-sheets-email-summary.json` / `gmaps-leads-callback-export.json` — publishable workflow definitions (credentials stripped)

The canonical workflow sources live in [`../templates/`](../templates/) and [`../workflows/`](../workflows/); the copies here are what the Worker bundles.
