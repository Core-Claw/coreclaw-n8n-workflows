# CoreClaw n8n Workflows: Google Maps Leads

Importable n8n workflows for running the CoreClaw **Google Map Details By Keyword** scraper and turning Google Maps search results into lead records.

This repository is meant for public sharing. The workflow JSON files do not include API keys, credential IDs, local file paths, proxy settings, or historical run IDs.

## Workflows

| Workflow | File | Best for |
| --- | --- | --- |
| CoreClaw Google Maps Leads Complete Global | `workflows/coreclaw-google-maps-leads-complete-global.json` | Full lead run with store search, scraper selection, detail/schema discovery, generated campaign config, live polling loop, success/failure branches, result preview, CSV/JSON export, and logs |
| CoreClaw Google Maps Leads Starter Global | `workflows/coreclaw-google-maps-leads-starter-global.json` | Store search plus generated run config, then returns `run_slug` for users who want to build their own downstream steps |

## Quick Start

1. Use a self-hosted n8n instance.
2. Install the community node package `n8n-nodes-coreclaw`.
3. Create a CoreClaw API credential in n8n.
4. Import one of the workflow JSON files from this repository.
5. Select your CoreClaw credential on every CoreClaw node.
6. Edit **Lead Search Input** and execute the workflow.

Raw import URLs after this repository is pushed:

```text
https://raw.githubusercontent.com/Core-Claw/coreclaw-n8n-workflows-google-maps/main/workflows/coreclaw-google-maps-leads-complete-global.json
https://raw.githubusercontent.com/Core-Claw/coreclaw-n8n-workflows-google-maps/main/workflows/coreclaw-google-maps-leads-starter-global.json
```

See [setup](docs/setup.md), [workflow guide](docs/workflows.md), and [troubleshooting](docs/troubleshooting.md).

## Important Notes

- The workflows run inside n8n. GitHub is only the public distribution and version-control location.
- n8n Cloud may not allow unverified community nodes. If `n8n-nodes-coreclaw` is not verified in the target environment, use self-hosted n8n.
- The Complete workflow polls live until CoreClaw returns a terminal status. Increase `wait_seconds` in **Lead Search Input** for larger jobs or slower networks.
- Overseas users normally should not need a local outbound proxy. Users in mainland China may need to configure the n8n server process with outbound proxy variables. See [China mainland proxy notes](docs/china-mainland-proxy.md).

## Development

Regenerate and validate workflow exports:

```bash
npm run check
```

Validation checks that the generated workflow JSON is import-shaped and does not contain credentials, local paths, proxy addresses, or known secret patterns.

## Publishing

These workflow JSON files can be shared on GitHub and imported into n8n from a raw GitHub URL. Publishing to the official n8n template gallery is separate and optional; see [publishing](docs/publishing.md).
