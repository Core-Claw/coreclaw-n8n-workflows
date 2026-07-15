# Google OAuth Setup for n8n (Google Sheets + Gmail)

This guide walks you through creating Google OAuth2 credentials so the **Google Sheets** and **Gmail** nodes in these workflows can read/write spreadsheets and send mail.

## Why OAuth2

n8n's built-in Google Sheets and Gmail nodes use OAuth2. You register an OAuth client in Google Cloud Console once; n8n stores the tokens. No API key, no service account, no app password needed.

## Step 1 — Create a Google Cloud project

1. Go to <https://console.cloud.google.com/>.
2. Click the project picker (top bar) → **New Project**. Name it e.g. `n8n-coreclaw`. Create.

## Step 2 — Enable the APIs

In the project, enable both APIs:

1. **Google Sheets API**: <https://console.cloud.google.com/apis/library/sheets.googleapis.com>
2. **Gmail API**: <https://console.cloud.google.com/apis/library/gmail.googleapis.com>

Click **ENABLE** on each.

## Step 3 — Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. User type: **External** (unless you have a Workspace, then Internal). **Create**.
3. Fill mandatory fields:
   - App name: `n8n CoreClaw`
   - User support email: your email
   - Developer contact: your email
4. **Scopes** → Add and remove scopes. Add:
   - `https://www.googleapis.com/auth/spreadsheets` (Sheets, full)
   - `https://www.googleapis.com/auth/gmail.send` (Gmail, send only — least privilege)
   - Optional: `https://www.googleapis.com/auth/drive.file` (if you want n8n to create new spreadsheets)
5. **Test users** → Add your own Google account email as a test user. (While the app is in "Testing" status, only test users can authorize.)
6. Save. The app stays in **Testing** — that's fine for personal use; no verification needed.

## Step 4 — Create the OAuth client credentials

1. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Name: `n8n local`.
4. **Authorized redirect URIs** — add exactly this (your local n8n callback):

   ```
   http://localhost:5678/rest/oauth2-credential/callback
   ```

   If you later run n8n on another host/port, add that URL too (e.g. `https://n8n.example.com/rest/oauth2-credential/callback`).
5. **Create**. You get a **Client ID** and **Client Secret**. Copy both.

## Step 5 — Create the credentials in n8n

Open n8n at <http://localhost:5678/>.

### Google Sheets credential

1. **Settings → Credentials → Add credential**.
2. Search `Google Sheets`. Choose **Google Sheets account** (OAuth2).
3. Fill:
   - **Client ID**: paste from step 4.
   - **Client Secret**: paste from step 4.
4. Click to sign in with Google → authorize the test user account → accept the scopes. n8n stores the token.
5. Name it `Google Sheets account`. Save.

### Gmail credential

Repeat, but search `Gmail` → **Gmail account** (OAuth2), same Client ID/Secret, authorize, name it `Gmail account`.

> Both can share the **same** OAuth client (step 4) — the scopes from step 3 cover both.

## Step 6 — Bind credentials on the workflow nodes

After importing a workflow, open it. Nodes flagged `REPLACE_WITH_*` in the JSON will show a credential dropdown. Select the credential you just created:

- `Run and Get Results` node → **CoreClaw API** credential.
- `Append Rows to Sheet` node → **Google Sheets account** credential.
- `Send Email` node → **Gmail account** credential.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `redirect_uri_mismatch` | The redirect URI in Google Console (step 4) must exactly match `http://localhost:5678/rest/oauth2-credential/callback`. Re-check trailing slash / http vs https. |
| `access blocked: app not verified` | Add your Google account as a **test user** in step 3.5. App must stay in Testing status. |
| `invalid_scope` for Gmail | Use `gmail.send` only (send mail). Avoid `gmail.modify`/`gmail.readonly` unless you need to read mail. |
| Can't find Sheets API in library | Confirm you're in the right project (top bar). Re-enable. |

## What you get

After this, the workflow JSON files in `../workflows/` can be imported and run end-to-end: CoreClaw scrapes → rows written to a Google Sheet → a Gmail summary with an Excel attachment lands in your inbox.
