# Troubleshooting

## The CoreClaw node is missing after import

Install `n8n-nodes-coreclaw` in the n8n instance, then restart n8n if required by your hosting setup.

## The workflow asks for credentials

This is expected. The public workflow intentionally ships without credential references. Open every CoreClaw node and select your own CoreClaw API credential.

## The run starts but keeps polling

The Complete workflow uses a live polling loop and waits until CoreClaw returns terminal status `>= 3`. Increase `wait_seconds` in **Lead Search Input** for larger jobs or slower networks. If a run is stuck upstream, stop the n8n execution and inspect the run in CoreClaw using the `run_slug`.

## The export step fails

The CoreClaw node expects `format` to be `csv` or `json`. This template exports both CSV and JSON and passes `export_filter_keys` as a comma-separated field list.

If the scraper output schema changes, reduce or clear `export_filter_keys` and rerun.

## The run fails with invalid parameters

Check:

- `keyword` is not empty.
- `base_location` is not empty.
- `max_results` is a positive number.
- The CoreClaw scraper still exposes the expected Google Maps keyword schema.
- The workflow finds the Google Maps keyword scraper in **Search CoreClaw Scrapers**.
- The workflow includes **Get Current Scraper Details** before **Start CoreClaw Run**.

## Network errors

Confirm the n8n server can reach `https://openapi.coreclaw.com`.

For mainland China local development, see [proxy notes](china-mainland-proxy.md). For overseas self-hosted servers, avoid adding local proxy settings unless your server actually needs them.
