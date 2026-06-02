import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflowsDir = resolve(root, 'workflows');

mkdirSync(workflowsDir, { recursive: true });

const GOOGLE_MAPS_KEYWORD_SCRAPER = '01KPD6M5YQADCQKGVKPDZVYC63';
const GOOGLE_MAPS_KEYWORD_NAME = 'Google Map Details By Keyword';
const GOOGLE_MAPS_SEARCH_QUERY = 'google maps';
const DEFAULT_EXPORT_FILTER_KEYS = 'title,address,phone,website,review_rating,review_count,primary_category,url';
const DEFAULT_LANGUAGE = 'en-US';
const DEFAULT_MAX_RESULTS = 3;
const DEFAULT_MAX_REVIEWS_PER_PLACE = 5;
const DEFAULT_RESULT_LIMIT = 20;
const DEFAULT_WAIT_SECONDS = 10;
const DEFAULT_HARD_LIMIT = 100;

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
          { id: 'keyword', name: 'keyword', value: 'coffee shop', type: 'string' },
          { id: 'base_location', name: 'base_location', value: 'New York, USA', type: 'string' },
          { id: 'max_results', name: 'max_results', value: DEFAULT_MAX_RESULTS, type: 'number' },
          { id: 'fetch_reviews', name: 'fetch_reviews', value: false, type: 'boolean' },
          { id: 'fetch_social_info', name: 'fetch_social_info', value: false, type: 'boolean' },
          { id: 'wait_seconds', name: 'wait_seconds', value: DEFAULT_WAIT_SECONDS, type: 'number' },
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
      query: GOOGLE_MAPS_SEARCH_QUERY,
      limit: 20,
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

const targetSlug = "${GOOGLE_MAPS_KEYWORD_SCRAPER}";
const targetTitle = "${GOOGLE_MAPS_KEYWORD_NAME}".toLowerCase();

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
    store_search_query: "${GOOGLE_MAPS_SEARCH_QUERY}",
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
const primaryCustomProperty = customProperties.find((property) => property.name === customSchema.b)
  ?? customProperties.find((property) => property.type === "array")
  ?? customProperties[0]
  ?? {};
const customParamRoot = String(primaryCustomProperty.name || customSchema.b || "").trim();
if (!customParamRoot) {
  throw new Error("CoreClaw scraper detail did not expose a custom input root field.");
}

const itemDefaultSource = Array.isArray(primaryCustomProperty.default)
  ? primaryCustomProperty.default[0]
  : primaryCustomProperty.default;
const customItem = itemDefaultSource && typeof itemDefaultSource === "object"
  ? { ...itemDefaultSource }
  : {};
const itemParamList = Array.isArray(primaryCustomProperty.param_list) ? primaryCustomProperty.param_list : [];
const allowedItemFields = new Set([
  ...Object.keys(customItem),
  ...itemParamList.map((entry) => entry.param).filter(Boolean),
]);
const requiredCustomFields = customProperties
  .filter((property) => property.required)
  .map((property) => property.name)
  .filter(Boolean);
const requiredItemFields = itemParamList
  .filter((entry) => entry.required)
  .map((entry) => entry.param)
  .filter(Boolean);

const keyword = String(input.keyword ?? "").trim();
const baseLocation = String(input.base_location ?? "").trim();
if (!keyword) throw new Error("keyword is required.");
if (!baseLocation) throw new Error("base_location is required.");

const hardLimit = ${DEFAULT_HARD_LIMIT};
const maxResults = Math.min(Math.max(1, Number(input.max_results || ${DEFAULT_MAX_RESULTS})), hardLimit);
const fetchReviews = Boolean(input.fetch_reviews);
const fetchSocialInfo = Boolean(input.fetch_social_info);

function numberValue(value, fallback, minimum = 0) {
  const normalized = Number(value ?? fallback);
  return Math.max(minimum, Number.isFinite(normalized) ? normalized : fallback);
}

function numberFromInput(name, fallback, minimum = 0) {
  return numberValue(input[name], fallback, minimum);
}

function systemDefault(names, fallback) {
  for (const name of names) {
    const value = systemDefaults[name];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function isSupportedItemField(name) {
  return allowedItemFields.size === 0 || allowedItemFields.has(name);
}

function setFirstSupported(names, value) {
  const fieldName = names.find(isSupportedItemField);
  if (!fieldName) return "";
  customItem[fieldName] = value;
  return fieldName;
}

const fieldMapping = {
  keyword: setFirstSupported(["keyword", "search_keyword", "query"], keyword),
  base_location: setFirstSupported(["base_location", "location", "search_location"], baseLocation),
  max_results: setFirstSupported(["max_results", "max_result", "limit"], maxResults),
  lang: setFirstSupported(["lang", "language"], String(customItem.lang || customItem.language || "${DEFAULT_LANGUAGE}")),
  fetch_reviews: setFirstSupported(["fetch_reviews"], fetchReviews),
  fetch_social_info: setFirstSupported(["fetch_social_info"], fetchSocialInfo),
  max_reviews_per_place: setFirstSupported(
    ["max_reviews_per_place"],
    numberValue(customItem.max_reviews_per_place, ${DEFAULT_MAX_REVIEWS_PER_PLACE}, 0),
  ),
};

if (!fieldMapping.keyword) {
  throw new Error("CoreClaw custom schema did not expose a keyword field.");
}
if (!fieldMapping.base_location) {
  throw new Error("CoreClaw custom schema did not expose a base location field.");
}

const missingRequiredItemFields = requiredItemFields
  .filter((fieldName) => customItem[fieldName] === undefined || customItem[fieldName] === null || customItem[fieldName] === "");
if (missingRequiredItemFields.length) {
  throw new Error(\`Generated custom params are missing required item fields: \${missingRequiredItemFields.join(", ")}\`);
}

return [{
  json: {
    scraper_slug: selected.scraper_slug,
    scraper_title: selected.scraper_title,
    scraper_description: selected.scraper_description,
    version,
    custom_schema: customSchema,
    custom_param_root: customParamRoot,
    custom_item_fields: Object.keys(customItem),
    custom_item_field_mapping: fieldMapping,
    system_defaults: systemDefaults,
    required_custom_fields: requiredCustomFields,
    required_item_fields: requiredItemFields,
    keyword,
    base_location: baseLocation,
    max_results: maxResults,
    result_limit: ${DEFAULT_RESULT_LIMIT},
    wait_seconds: numberFromInput("wait_seconds", ${DEFAULT_WAIT_SECONDS}, 5),
    export_filter_keys: "${DEFAULT_EXPORT_FILTER_KEYS}",
    customParams: JSON.stringify({ [customParamRoot]: [customItem] }),
    systemParams: JSON.stringify({
      cpus: numberValue(systemDefault(["cpus"], 1), 1, 0.125),
      memory: numberValue(systemDefault(["memory", "memory_bytes"], 4096), 4096, 512),
      execute_limit_time_seconds: numberValue(systemDefault(["execute_limit_time_seconds"], 900), 900, 0),
      max_total_charge: numberValue(systemDefault(["max_total_charge"], 0), 0, 0),
      max_total_traffic: numberValue(systemDefault(["max_total_traffic"], 0), 0, 0),
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

function waitNode(position) {
  return node({
    id: 'wait-before-next-poll',
    name: 'Wait Before Next Poll',
    type: 'n8n-nodes-base.wait',
    typeVersion: 1.1,
    position,
    parameters: {
      resume: 'timeInterval',
      amount: `={{ Number($node["Generate Campaign Config"].json.wait_seconds || ${DEFAULT_WAIT_SECONDS}) }}`,
      unit: 'seconds',
    },
  });
}

function getRunStatus(position) {
  return coreClawNode({
    id: 'get-run-status',
    name: 'Get Run Status',
    position,
    parameters: {
      resource: 'run',
      operation: 'get',
      runSlug: "={{ $('Start CoreClaw Run').item.json.run_slug }}",
    },
    extra: {
      continueOnFail: true,
    },
  });
}

function ifRunTerminal(position) {
  return node({
    id: 'if-run-terminal',
    name: 'If Run Terminal',
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
            id: 'status-terminal',
            leftValue: '={{ Number($json.status) }}',
            rightValue: 3,
            operator: {
              type: 'number',
              operation: 'gte',
            },
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
  });
}

function ifRunSucceeded(position) {
  return node({
    id: 'if-run-succeeded',
    name: 'If Run Succeeded',
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
            id: 'status-succeeded',
            leftValue: '={{ Number($json.status) }}',
            rightValue: 3,
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
      runSlug: "={{ $('Start CoreClaw Run').item.json.run_slug }}",
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
      runSlug: "={{ $('Start CoreClaw Run').item.json.run_slug }}",
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
      runSlug: "={{ $('Start CoreClaw Run').item.json.run_slug }}",
    },
    extra: {
      continueOnFail: true,
    },
  });
}

function buildSummary(kind, position) {
  const isSuccess = kind === 'Success';
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

const status = firstJson("Get Run Status") ?? {};
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
      : '"Open logs_url and inspect run_error_message before retrying with smaller max_results or fewer optional enrichments."'},
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
        '## CoreClaw Google Maps Leads - Complete Global\\n\\n1. Install `n8n-nodes-coreclaw`.\\n2. Create a CoreClaw API credential.\\n3. Select that credential on every CoreClaw node after import.\\n4. Edit only keyword, base_location, max_results, optional review switches, then execute.\\n\\nFlow: search Google Maps scraper -> get details/version/schema -> generate config -> run -> live poll until terminal status -> results -> CSV/JSON exports -> logs.\\n\\nNo API key, local path, or proxy setting is stored in this workflow.',
    }),
    manualTrigger([-1380, 120]),
    leadSearchInputNode([-1160, 120]),
    searchScrapers([-900, 120]),
    selectGoogleMapsKeywordScraper([-640, 120]),
    getScraperDetails([-380, 120]),
    generateCampaignConfig([-120, 120]),
    startRun([140, 120]),
    waitNode([400, 120]),
    getRunStatus([660, 120]),
    ifRunTerminal([920, 120]),
    ifRunSucceeded([1180, -120]),
    getResults([1440, -340]),
    summarizeResults([1700, -340]),
    exportResults('csv', 'export-csv', 'Export CSV', [1960, -340]),
    exportResults('json', 'export-json', 'Export JSON', [2220, -340]),
    getLogs('Get Success Logs', 'get-success-logs', [2480, -340]),
    buildSummary('Success', [2740, -340]),
    getLogs('Get Failure Logs', 'get-failure-logs', [1440, 160]),
    buildSummary('Failure', [1700, 160]),
  ];

  const connections = {};
  connect(connections, 'Manual Trigger', 'Lead Search Input');
  connect(connections, 'Lead Search Input', 'Search CoreClaw Scrapers');
  connect(connections, 'Search CoreClaw Scrapers', 'Select Google Maps Keyword Scraper');
  connect(connections, 'Select Google Maps Keyword Scraper', 'Get Current Scraper Details');
  connect(connections, 'Get Current Scraper Details', 'Generate Campaign Config');
  connect(connections, 'Generate Campaign Config', 'Start CoreClaw Run');
  connect(connections, 'Start CoreClaw Run', 'Wait Before Next Poll');
  connect(connections, 'Wait Before Next Poll', 'Get Run Status');
  connect(connections, 'Get Run Status', 'If Run Terminal');
  connect(connections, 'If Run Terminal', 'If Run Succeeded', 0);
  connect(connections, 'If Run Terminal', 'Wait Before Next Poll', 1);
  connect(connections, 'If Run Succeeded', 'Get Run Results', 0);
  connect(connections, 'If Run Succeeded', 'Get Failure Logs', 1);
  connect(connections, 'Get Run Results', 'Summarize Results');
  connect(connections, 'Summarize Results', 'Export CSV');
  connect(connections, 'Export CSV', 'Export JSON');
  connect(connections, 'Export JSON', 'Get Success Logs');
  connect(connections, 'Get Success Logs', 'Build Success Summary');
  connect(connections, 'Get Failure Logs', 'Build Failure Summary');

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
