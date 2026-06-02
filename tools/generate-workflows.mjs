import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflowsDir = resolve(root, 'workflows');

mkdirSync(workflowsDir, { recursive: true });

const GOOGLE_MAPS_KEYWORD_SCRAPER = '01KPD6M5YQADCQKGVKPDZVYC63';
const GOOGLE_MAPS_KEYWORD_NAME = 'Google Map Details By Keyword';
const GOOGLE_MAPS_SEARCH_QUERY = 'Google Maps keyword';
const MAX_POLL_ATTEMPTS = 6;

function node({
  id,
  name,
  type,
  typeVersion,
  position,
  parameters = {},
  extra = {},
}) {
  return {
    parameters,
    id,
    name,
    type,
    typeVersion,
    position,
    ...extra,
  };
}

function coreClawNode({ id, name, position, parameters, extra = {} }) {
  return node({
    id,
    name,
    type: 'n8n-nodes-coreclaw.coreClaw',
    typeVersion: 1,
    position,
    parameters,
    extra: {
      retryOnFail: true,
      maxTries: 3,
      waitBetweenTries: 5000,
      notesInFlow: true,
      notes: 'Select your own CoreClaw API credential after importing this workflow.',
      ...extra,
    },
  });
}

function stickyNote({ id, name, position, width, height, content }) {
  return node({
    id,
    name,
    type: 'n8n-nodes-base.stickyNote',
    typeVersion: 1,
    position,
    parameters: {
      content,
      width,
      height,
    },
  });
}

function leadSearchInputNode(position) {
  return node({
    id: 'lead-search-input',
    name: 'Lead Search Input',
    type: 'n8n-nodes-base.set',
    typeVersion: 3.4,
    position,
    parameters: {
      assignments: {
        assignments: [
          { id: 'store_search_query', name: 'store_search_query', value: GOOGLE_MAPS_SEARCH_QUERY, type: 'string' },
          { id: 'store_search_limit', name: 'store_search_limit', value: 20, type: 'number' },
          { id: 'target_scraper_title', name: 'target_scraper_title', value: GOOGLE_MAPS_KEYWORD_NAME, type: 'string' },
          { id: 'target_scraper_slug', name: 'target_scraper_slug', value: GOOGLE_MAPS_KEYWORD_SCRAPER, type: 'string' },
          { id: 'keyword', name: 'keyword', value: 'coffee shop', type: 'string' },
          { id: 'base_location', name: 'base_location', value: 'New York, USA', type: 'string' },
          { id: 'max_results', name: 'max_results', value: 5, type: 'number' },
          { id: 'lang', name: 'lang', value: 'en-US', type: 'string' },
          { id: 'fetch_reviews', name: 'fetch_reviews', value: false, type: 'boolean' },
          { id: 'fetch_social_info', name: 'fetch_social_info', value: false, type: 'boolean' },
          { id: 'max_reviews_per_place', name: 'max_reviews_per_place', value: 5, type: 'number' },
          { id: 'result_limit', name: 'result_limit', value: 20, type: 'number' },
          { id: 'max_results_hard_limit', name: 'max_results_hard_limit', value: 100, type: 'number' },
          { id: 'wait_seconds', name: 'wait_seconds', value: 30, type: 'number' },
          { id: 'cpus', name: 'cpus', value: 1, type: 'number' },
          { id: 'memory', name: 'memory', value: 4096, type: 'number' },
          { id: 'execute_limit_time_seconds', name: 'execute_limit_time_seconds', value: 900, type: 'number' },
          { id: 'max_total_charge', name: 'max_total_charge', value: 0, type: 'number' },
          { id: 'max_total_traffic', name: 'max_total_traffic', value: 0, type: 'number' },
          {
            id: 'export_filter_keys',
            name: 'export_filter_keys',
            value: 'title,address,phone,website,review_rating,review_count,primary_category,url',
            type: 'string',
          },
        ],
      },
      options: {},
    },
  });
}

function manualTrigger(position, name = 'Manual Trigger', id = 'manual-trigger') {
  return node({
    id,
    name,
    type: 'n8n-nodes-base.manualTrigger',
    typeVersion: 1,
    position,
    parameters: {},
  });
}

function searchScrapers(position) {
  return coreClawNode({
    id: 'search-scrapers',
    name: 'Search CoreClaw Scrapers',
    position,
    parameters: {
      resource: 'scraper',
      operation: 'search',
      query: '={{ $node["Lead Search Input"].json.store_search_query }}',
      limit: '={{ Number($node["Lead Search Input"].json.store_search_limit || 20) }}',
    },
  });
}

function selectGoogleMapsKeywordScraper(position) {
  return node({
    id: 'select-google-maps-keyword-scraper',
    name: 'Select Google Maps Keyword Scraper',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position,
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
const candidates = $input.all().map((item) => item.json).filter(Boolean);
const input = $node["Lead Search Input"].json;

const targetSlug = String(input.target_scraper_slug || "").trim();
const targetTitle = String(input.target_scraper_title || "${GOOGLE_MAPS_KEYWORD_NAME}").trim().toLowerCase();

const selected = candidates.find((candidate) => String(candidate.slug || "") === targetSlug)
  ?? candidates.find((candidate) => String(candidate.title || "").trim().toLowerCase() === targetTitle)
  ?? candidates.find((candidate) => /google\\s*map/i.test(String(candidate.title || "")) && /keyword/i.test(String(candidate.title || "")));

if (!selected?.slug) {
  const found = candidates.map((candidate) => candidate.title || candidate.slug).filter(Boolean).slice(0, 10).join(", ");
  throw new Error(\`Could not find the Google Maps keyword scraper from CoreClaw store search. Found: \${found || "none"}\`);
}

return [{
  json: {
    scraper_slug: selected.slug,
    scraper_title: selected.title || "${GOOGLE_MAPS_KEYWORD_NAME}",
    scraper_description: selected.description || "",
    store_search_query: input.store_search_query,
    store_candidates_checked: candidates.length,
  },
}];
`.trim(),
    },
  });
}

function getScraperDetails(position) {
  return coreClawNode({
    id: 'get-scraper-details',
    name: 'Get Current Scraper Details',
    position,
    parameters: {
      resource: 'scraper',
      operation: 'getDetails',
      scraperSlug: {
        __rl: true,
        mode: 'id',
        value: '={{ $json.scraper_slug }}',
        cachedResultName: GOOGLE_MAPS_KEYWORD_NAME,
      },
    },
  });
}

function generateCampaignConfig(position) {
  return node({
    id: 'generate-campaign-config',
    name: 'Generate Campaign Config',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position,
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
const detail = $input.all()[0]?.json ?? {};
const selected = $node["Select Google Maps Keyword Scraper"].json;
const input = $node["Lead Search Input"].json;

const version = detail.version;
if (!version) {
  throw new Error("CoreClaw scraper detail did not include a version. Re-check the scraper slug or API response.");
}

const parameters = detail.parameters ?? {};
const customSchema = parameters.custom ?? {};
const systemDefaults = parameters.system ?? {};
const customProperties = Array.isArray(customSchema.properties) ? customSchema.properties : [];
const requiredCustomFields = customProperties
  .filter((property) => property.required)
  .map((property) => property.name)
  .filter(Boolean);

const keyword = String(input.keyword ?? "").trim();
const baseLocation = String(input.base_location ?? "").trim();
if (!keyword) throw new Error("keyword is required.");
if (!baseLocation) throw new Error("base_location is required.");

const hardLimit = Math.max(1, Number(input.max_results_hard_limit || 100));
const maxResults = Math.min(Math.max(1, Number(input.max_results || 5)), hardLimit);
const fetchReviews = Boolean(input.fetch_reviews);
const fetchSocialInfo = Boolean(input.fetch_social_info);

function numberFromInput(name, fallback, minimum = 0) {
  return Math.max(minimum, Number(input[name] ?? fallback));
}

function systemDefault(names, fallback) {
  for (const name of names) {
    const value = systemDefaults[name];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

return [{
  json: {
    scraper_slug: selected.scraper_slug,
    scraper_title: selected.scraper_title,
    scraper_description: selected.scraper_description,
    version,
    custom_schema: customSchema,
    system_defaults: systemDefaults,
    required_custom_fields: requiredCustomFields,
    keyword,
    base_location: baseLocation,
    max_results: maxResults,
    result_limit: numberFromInput("result_limit", maxResults || 20, 1),
    wait_seconds: numberFromInput("wait_seconds", 30, 5),
    max_poll_attempts: ${MAX_POLL_ATTEMPTS},
    export_filter_keys: String(input.export_filter_keys || "title,address,phone,website,review_rating,review_count,primary_category,url"),
    customParams: JSON.stringify({
      url: [{
        lang: String(input.lang || "en-US"),
        keyword,
        max_results: maxResults,
        base_location: baseLocation,
        fetch_reviews: fetchReviews,
        fetch_social_info: fetchSocialInfo,
        max_reviews_per_place: numberFromInput("max_reviews_per_place", 0, 0),
      }],
    }),
    systemParams: JSON.stringify({
      cpus: numberFromInput("cpus", systemDefault(["cpus"], 1), 0.125),
      memory: numberFromInput("memory", systemDefault(["memory", "memory_bytes"], 4096), 512),
      execute_limit_time_seconds: numberFromInput("execute_limit_time_seconds", systemDefault(["execute_limit_time_seconds"], 900), 60),
      max_total_charge: numberFromInput("max_total_charge", systemDefault(["max_total_charge"], 0), 0),
      max_total_traffic: numberFromInput("max_total_traffic", systemDefault(["max_total_traffic"], 0), 0),
    }),
  },
}];
`.trim(),
    },
  });
}

function startRun(position) {
  return coreClawNode({
    id: 'start-coreclaw-run',
    name: 'Start CoreClaw Run',
    position,
    parameters: {
      resource: 'scraper',
      operation: 'run',
      scraperSlug: {
        __rl: true,
        mode: 'id',
        value: '={{ $json.scraper_slug }}',
        cachedResultName: GOOGLE_MAPS_KEYWORD_NAME,
      },
      version: '={{ $json.version }}',
      customParams: '={{ $json.customParams }}',
      additionalFields: {
        systemParams: '={{ $json.systemParams }}',
      },
    },
  });
}

function waitNode(index, position) {
  return node({
    id: `wait-before-poll-${index}`,
    name: `Wait Before Poll ${index}`,
    type: 'n8n-nodes-base.wait',
    typeVersion: 1.1,
    position,
    parameters: {
      resume: 'timeInterval',
      amount: '={{ Number($node["Generate Campaign Config"].json.wait_seconds || 30) }}',
      unit: 'seconds',
    },
  });
}

function getRunStatus(index, position) {
  return coreClawNode({
    id: `get-run-status-${index}`,
    name: `Get Run Status ${index}`,
    position,
    parameters: {
      resource: 'run',
      operation: 'get',
      runSlug: '={{ $node["Start CoreClaw Run"].json.run_slug }}',
    },
    extra: {
      continueOnFail: true,
    },
  });
}

function ifStatus(index, status, label, position) {
  return node({
    id: `if-run-${label.toLowerCase()}-${index}`,
    name: `If Run ${label} ${index}`,
    type: 'n8n-nodes-base.if',
    typeVersion: 2.2,
    position,
    parameters: {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: '',
          typeValidation: 'strict',
          version: 2,
        },
        conditions: [
          {
            id: `status-${status}-${index}`,
            leftValue: '={{ Number($json.status) }}',
            rightValue: status,
            operator: {
              type: 'number',
              operation: 'equals',
            },
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
  });
}

function getResults(position) {
  return coreClawNode({
    id: 'get-run-results',
    name: 'Get Run Results',
    position,
    parameters: {
      resource: 'run',
      operation: 'getResults',
      runSlug: '={{ $node["Start CoreClaw Run"].json.run_slug }}',
      returnAll: false,
      limit: '={{ Number($node["Generate Campaign Config"].json.result_limit || 20) }}',
    },
  });
}

function summarizeResults(position) {
  return node({
    id: 'summarize-results',
    name: 'Summarize Results',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position,
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
const results = $input.all().map((item) => item.json);
const first = results[0] ?? {};
return [{
  json: {
    run_slug: $node["Start CoreClaw Run"].json.run_slug,
    result_items_returned: results.length,
    first_result_title: first.title ?? "",
    first_result_address: first.address ?? "",
    first_result_phone: first.phone ?? "",
    first_result_website: first.website ?? "",
    sample_results: results.slice(0, 3),
  },
}];
`.trim(),
    },
  });
}

function exportResults(format, id, name, position) {
  return coreClawNode({
    id,
    name,
    position,
    parameters: {
      resource: 'run',
      operation: 'exportResults',
      runSlug: '={{ $node["Start CoreClaw Run"].json.run_slug }}',
      format,
      filterKeys: '={{ $node["Generate Campaign Config"].json.export_filter_keys }}',
    },
  });
}

function getLogs(name, id, position) {
  return coreClawNode({
    id,
    name,
    position,
    parameters: {
      resource: 'run',
      operation: 'getLogs',
      runSlug: '={{ $node["Start CoreClaw Run"].json.run_slug }}',
    },
    extra: {
      continueOnFail: true,
    },
  });
}

function buildSummary(kind, position) {
  const isSuccess = kind === 'Success';
  const statusNodes = Array.from({ length: MAX_POLL_ATTEMPTS }, (_, i) => `Get Run Status ${i + 1}`);
  return node({
    id: `build-${kind.toLowerCase()}-summary`,
    name: `Build ${kind} Summary`,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position,
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
function firstJson(nodeName) {
  try {
    const items = $items(nodeName);
    return items?.[0]?.json ?? null;
  } catch (error) {
    return null;
  }
}

const status = ${JSON.stringify(statusNodes)}.map(firstJson).filter(Boolean).at(-1) ?? {};
const logs = $input.all()[0]?.json ?? {};
const runSlug = $node["Start CoreClaw Run"].json.run_slug;
const cfg = $node["Generate Campaign Config"].json;
const resultSummary = firstJson("Summarize Results") ?? {};
const exportResult = firstJson("Export CSV") ?? {};
const jsonExportResult = firstJson("Export JSON") ?? {};

return [{
  json: {
    outcome: "${kind.toLowerCase()}",
    run_slug: runSlug,
    scraper_slug: cfg.scraper_slug,
    scraper_title: cfg.scraper_title,
    version: cfg.version,
    keyword: cfg.keyword,
    base_location: cfg.base_location,
    requested_max_results: cfg.max_results,
    run_status: status.status ?? null,
    run_error_message: status.err_msg ?? "",
    coreclaw_result_count: status.results ?? null,
    duration_seconds: status.duration ?? null,
    returned_result_items: resultSummary.result_items_returned ?? 0,
    first_result_title: resultSummary.first_result_title ?? "",
    first_result_address: resultSummary.first_result_address ?? "",
    csv_download_url: exportResult.download_url ?? "",
    json_download_url: jsonExportResult.download_url ?? "",
    logs_url: logs.all_logs_url ?? "",
    log_count: Array.isArray(logs.list) ? logs.list.length : 0,
    next_step: ${isSuccess
      ? '"Use csv_download_url or sample_results for downstream CRM, sheet, or notification steps."'
      : '"Open logs_url and inspect run_error_message before retrying with smaller max_results or longer timeout."'},
    sample_results: resultSummary.sample_results ?? [],
  },
}];
`.trim(),
    },
  });
}

function buildStarterSummary(position) {
  return node({
    id: 'build-starter-summary',
    name: 'Build Starter Summary',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position,
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `
const run = $input.all()[0]?.json ?? {};
const cfg = $node["Generate Campaign Config"].json;
return [{
  json: {
    outcome: "started",
    run_slug: run.run_slug,
    scraper_slug: cfg.scraper_slug,
    scraper_title: cfg.scraper_title,
    version: cfg.version,
    keyword: cfg.keyword,
    base_location: cfg.base_location,
    requested_max_results: cfg.max_results,
    next_step: "Use Run > Get, Get Results, Export Results, or Logs with this run_slug after the run completes.",
  },
}];
`.trim(),
    },
  });
}

function connect(connections, from, to, outputIndex = 0) {
  if (!connections[from]) connections[from] = { main: [] };
  while (connections[from].main.length <= outputIndex) connections[from].main.push([]);
  connections[from].main[outputIndex].push({ node: to, type: 'main', index: 0 });
}

function workflowBase({ id, name, nodes, connections }) {
  return {
    id,
    name,
    active: false,
    nodes,
    connections,
    settings: {
      executionOrder: 'v1',
      saveManualExecutions: true,
    },
    staticData: null,
    meta: {},
    pinData: {},
    tags: [],
  };
}

function buildCompleteWorkflow() {
  const nodes = [
    stickyNote({
      id: 'note-setup',
      name: 'Setup Note',
      position: [-1460, -340],
      width: 640,
      height: 320,
      content:
        '## CoreClaw Google Maps Leads - Complete Global\\n\\n1. Install `n8n-nodes-coreclaw`.\\n2. Create a CoreClaw API credential.\\n3. Select that credential on every CoreClaw node after import.\\n4. Edit Lead Search Input, then execute.\\n\\nFlow: Search scrapers -> select Google Maps keyword scraper -> get details/version/schema -> generate campaign config -> run -> poll -> results -> CSV/JSON exports -> logs.\\n\\nNo API key, local path, or proxy setting is stored in this workflow.',
    }),
    manualTrigger([-1380, 120]),
    leadSearchInputNode([-1160, 120]),
    searchScrapers([-900, 120]),
    selectGoogleMapsKeywordScraper([-640, 120]),
    getScraperDetails([-380, 120]),
    generateCampaignConfig([-120, 120]),
    startRun([140, 120]),
    getResults([2060, -340]),
    summarizeResults([2320, -340]),
    exportResults('csv', 'export-csv', 'Export CSV', [2580, -340]),
    exportResults('json', 'export-json', 'Export JSON', [2840, -340]),
    getLogs('Get Success Logs', 'get-success-logs', [3100, -340]),
    buildSummary('Success', [3360, -340]),
    getLogs('Get Failure Logs', 'get-failure-logs', [2060, 240]),
    buildSummary('Failure', [2320, 240]),
    getLogs('Get Timeout Logs', 'get-timeout-logs', [2060, 520]),
    buildSummary('Timeout', [2320, 520]),
  ];

  const connections = {};
  connect(connections, 'Manual Trigger', 'Lead Search Input');
  connect(connections, 'Lead Search Input', 'Search CoreClaw Scrapers');
  connect(connections, 'Search CoreClaw Scrapers', 'Select Google Maps Keyword Scraper');
  connect(connections, 'Select Google Maps Keyword Scraper', 'Get Current Scraper Details');
  connect(connections, 'Get Current Scraper Details', 'Generate Campaign Config');
  connect(connections, 'Generate Campaign Config', 'Start CoreClaw Run');

  for (let i = 1; i <= MAX_POLL_ATTEMPTS; i += 1) {
    const y = 120 + (i - 1) * 180;
    nodes.push(waitNode(i, [260 + (i - 1) * 260, y]));
    nodes.push(getRunStatus(i, [260 + (i - 1) * 260, y + 120]));
    nodes.push(ifStatus(i, 3, 'Succeeded', [260 + (i - 1) * 260, y + 260]));
    nodes.push(ifStatus(i, 4, 'Failed', [260 + (i - 1) * 260, y + 420]));

    if (i === 1) {
      connect(connections, 'Start CoreClaw Run', 'Wait Before Poll 1');
    }
    connect(connections, `Wait Before Poll ${i}`, `Get Run Status ${i}`);
    connect(connections, `Get Run Status ${i}`, `If Run Succeeded ${i}`);
    connect(connections, `If Run Succeeded ${i}`, 'Get Run Results', 0);
    connect(connections, `If Run Succeeded ${i}`, `If Run Failed ${i}`, 1);
    connect(connections, `If Run Failed ${i}`, 'Get Failure Logs', 0);
    if (i < MAX_POLL_ATTEMPTS) {
      connect(connections, `If Run Failed ${i}`, `Wait Before Poll ${i + 1}`, 1);
    } else {
      connect(connections, `If Run Failed ${i}`, 'Get Timeout Logs', 1);
    }
  }

  connect(connections, 'Get Run Results', 'Summarize Results');
  connect(connections, 'Summarize Results', 'Export CSV');
  connect(connections, 'Export CSV', 'Export JSON');
  connect(connections, 'Export JSON', 'Get Success Logs');
  connect(connections, 'Get Success Logs', 'Build Success Summary');
  connect(connections, 'Get Failure Logs', 'Build Failure Summary');
  connect(connections, 'Get Timeout Logs', 'Build Timeout Summary');

  return workflowBase({
    id: 'coreclawGoogleMapsLeadsCompleteGlobal',
    name: 'CoreClaw Google Maps Leads Complete Global',
    nodes,
    connections,
  });
}

function buildStarterWorkflow() {
  const nodes = [
    stickyNote({
      id: 'note-starter',
      name: 'Setup Note',
      position: [-1380, -260],
      width: 620,
      height: 260,
      content:
        '## CoreClaw Google Maps Leads - Starter Global\\n\\nSearches CoreClaw Store, selects the Google Maps keyword scraper, reads details/version/schema, generates campaign config, starts a run, and returns `run_slug`.\\n\\nAfter import, select your own CoreClaw API credential on each CoreClaw node.',
    }),
    manualTrigger([-1280, 120]),
    leadSearchInputNode([-1040, 120]),
    searchScrapers([-780, 120]),
    selectGoogleMapsKeywordScraper([-520, 120]),
    getScraperDetails([-260, 120]),
    generateCampaignConfig([0, 120]),
    startRun([260, 120]),
    buildStarterSummary([520, 120]),
  ];
  const connections = {};
  connect(connections, 'Manual Trigger', 'Lead Search Input');
  connect(connections, 'Lead Search Input', 'Search CoreClaw Scrapers');
  connect(connections, 'Search CoreClaw Scrapers', 'Select Google Maps Keyword Scraper');
  connect(connections, 'Select Google Maps Keyword Scraper', 'Get Current Scraper Details');
  connect(connections, 'Get Current Scraper Details', 'Generate Campaign Config');
  connect(connections, 'Generate Campaign Config', 'Start CoreClaw Run');
  connect(connections, 'Start CoreClaw Run', 'Build Starter Summary');
  return workflowBase({
    id: 'coreclawGoogleMapsLeadsStarterGlobal',
    name: 'CoreClaw Google Maps Leads Starter Global',
    nodes,
    connections,
  });
}

function writeWorkflow(filename, workflow) {
  const file = resolve(workflowsDir, filename);
  writeFileSync(file, `${JSON.stringify(workflow, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${file}`);
}

writeWorkflow('coreclaw-google-maps-leads-complete-global.json', buildCompleteWorkflow());
writeWorkflow('coreclaw-google-maps-leads-starter-global.json', buildStarterWorkflow());
