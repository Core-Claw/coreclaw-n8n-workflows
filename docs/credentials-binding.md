# Binding credentials after import

After importing any workflow from `../workflows/`, the CoreClaw, Google Sheets, and Gmail nodes show a **"Credential to connect with"** dropdown flagged with `REPLACE_WITH_*`. Bind each before running.

## 1. CoreClaw API credential

Create once, reuse on every CoreClaw node:

1. **Settings → Credentials → Add credential** → search `CoreClaw` → **CoreClaw API**.
2. Fields:
   - **API Key**: your CoreClaw API v2 key (from the CoreClaw console).
   - **Base URL**: `https://openapi.coreclaw.com` (default; change only for private deployments).
3. Click **Save** → n8n tests against `GET /api/v2/users/account`. A green "Connected" means OK.
4. Name it `CoreClaw API`.

Bind on these nodes (in each workflow):

- Workflow A: `Run and Get Results`
- Workflow B: `Run and Get Results`, `Export Last Run Results (xlsx)`
- Workflow C: `List Results`, `Export Results (xlsx)`, `Start Run (async+callback)`

## 2. Google Sheets credential

Follow [`google-oauth-setup.md`](./google-oauth-setup.md), then bind on:

- Workflow A: `Append Rows to Sheet`
- Workflow B: `Append Rows to Sheet`

Also set the spreadsheet target:
- Open the `Append Rows to Sheet` node.
- Under **Document**, pick your spreadsheet (create one with a sheet named `Leads` first, or let n8n create it on first run if you switch the operation to `Create`).
- Under **Sheet**, pick `Leads`.
- The first append auto-maps columns from the Code node's output keys (see [`field-map.md`](./field-map.md)).

## 3. Gmail credential

Follow [`google-oauth-setup.md`](./google-oauth-setup.md) (same OAuth client covers Gmail), then bind on:

- Workflow B: `Send Summary Email`
- Workflow C: `Send Email`

The recipient is taken from the `Input Config` node's `recipient_email` field (default `445481611@qq.com`). Change it there, not on the Gmail node.

## Verify

After binding, the node loses its red "missing credential" flag. Click **Execute workflow** — if credentials are wrong, the failing node shows the exact CoreClaw / Google error in its output panel. See the error table in [`../README.md`](../README.md#troubleshooting).
