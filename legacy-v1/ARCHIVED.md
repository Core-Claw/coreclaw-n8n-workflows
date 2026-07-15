# legacy-v1 (archived)

These 12 workflows target the **v1 CoreClaw node contract** (`resource: scraper/run`, `operation: run/get/getResults`, `scraperSlug` + explicit `version: v1.x.x`, `systemParams`/`customParams` input shape).

They are **superseded** by the v2 redesign under `../workflows/`, which uses the current `n8n-nodes-coreclaw` 0.4.0 (`description.version: 2`, 34 operations on `/api/v2/`, `worker_id` + `input.parameters.custom` wrapping, and the `Run and Get Results` composite operation).

Kept for traceability and git history. Do not import these into a current n8n instance expecting them to work against the v2 API — the CoreClaw node parameters no longer match.
