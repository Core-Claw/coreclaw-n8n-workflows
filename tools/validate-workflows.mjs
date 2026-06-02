import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflowsDir = resolve(root, 'workflows');

const forbiddenTextPatterns = [
  { name: 'CoreClaw API key placeholder or secret', pattern: /scraper_api_[A-Za-z0-9_-]+|CORECLAW_API_KEY|api-key/i },
  { name: 'local Windows path', pattern: /[A-Za-z]:\\/ },
  { name: 'localhost proxy', pattern: /127\.0\.0\.1|localhost:7897|7897/ },
  { name: 'proxy environment variable', pattern: /HTTP_PROXY|HTTPS_PROXY|https_proxy_license_server/i },
  { name: 'known local credential label', pattern: /coreclawTestApi01|CoreClaw Test API/i },
  { name: 'n8n data directory', pattern: /\.n8n-data|\.n8n[\\/]/i },
];

const requiredWorkflowFiles = [
  'coreclaw-google-maps-leads-complete-global.json',
  'coreclaw-google-maps-leads-starter-global.json',
];

function fail(message) {
  throw new Error(message);
}

function readWorkflow(fileName) {
  const file = resolve(workflowsDir, fileName);
  const raw = readFileSync(file, 'utf8');
  for (const check of forbiddenTextPatterns) {
    if (check.pattern.test(raw)) {
      fail(`${fileName}: found forbidden content: ${check.name}`);
    }
  }
  return JSON.parse(raw);
}

function assertNoCredentials(workflow, fileName) {
  for (const n of workflow.nodes ?? []) {
    if ('credentials' in n) {
      fail(`${fileName}: node "${n.name}" contains exported credentials`);
    }
    if (n.type === 'n8n-nodes-coreclaw.coreClaw' && !n.notes?.includes('Select your own CoreClaw API credential')) {
      fail(`${fileName}: CoreClaw node "${n.name}" is missing import credential note`);
    }
  }
}

function assertHasNodes(workflow, fileName, names) {
  const actual = new Set((workflow.nodes ?? []).map((n) => n.name));
  for (const name of names) {
    if (!actual.has(name)) {
      fail(`${fileName}: missing node "${name}"`);
    }
  }
}

function assertConnection(workflow, fileName, from, to, outputIndex = 0) {
  const outputs = workflow.connections?.[from]?.main ?? [];
  const targets = outputs[outputIndex] ?? [];
  if (!targets.some((target) => target.node === to)) {
    fail(`${fileName}: missing connection ${from} output ${outputIndex} -> ${to}`);
  }
}

function validateComplete(workflow, fileName) {
  assertHasNodes(workflow, fileName, [
    'Manual Trigger',
    'Lead Search Input',
    'Search CoreClaw Scrapers',
    'Select Google Maps Keyword Scraper',
    'Get Current Scraper Details',
    'Generate Campaign Config',
    'Start CoreClaw Run',
    'Get Run Results',
    'Summarize Results',
    'Export CSV',
    'Export JSON',
    'Get Success Logs',
    'Build Success Summary',
    'Get Failure Logs',
    'Build Failure Summary',
    'Get Timeout Logs',
    'Build Timeout Summary',
  ]);

  assertConnection(workflow, fileName, 'Manual Trigger', 'Lead Search Input');
  assertConnection(workflow, fileName, 'Lead Search Input', 'Search CoreClaw Scrapers');
  assertConnection(workflow, fileName, 'Search CoreClaw Scrapers', 'Select Google Maps Keyword Scraper');
  assertConnection(workflow, fileName, 'Select Google Maps Keyword Scraper', 'Get Current Scraper Details');
  assertConnection(workflow, fileName, 'Get Current Scraper Details', 'Generate Campaign Config');
  assertConnection(workflow, fileName, 'Generate Campaign Config', 'Start CoreClaw Run');
  assertConnection(workflow, fileName, 'Start CoreClaw Run', 'Wait Before Poll 1');
  assertConnection(workflow, fileName, 'Get Run Results', 'Summarize Results');
  assertConnection(workflow, fileName, 'Summarize Results', 'Export CSV');
  assertConnection(workflow, fileName, 'Export CSV', 'Export JSON');
  assertConnection(workflow, fileName, 'Export JSON', 'Get Success Logs');
  assertConnection(workflow, fileName, 'Get Failure Logs', 'Build Failure Summary');
  assertConnection(workflow, fileName, 'Get Timeout Logs', 'Build Timeout Summary');

  for (let i = 1; i <= 6; i += 1) {
    assertHasNodes(workflow, fileName, [
      `Wait Before Poll ${i}`,
      `Get Run Status ${i}`,
      `If Run Succeeded ${i}`,
      `If Run Failed ${i}`,
    ]);
    assertConnection(workflow, fileName, `Wait Before Poll ${i}`, `Get Run Status ${i}`);
    assertConnection(workflow, fileName, `Get Run Status ${i}`, `If Run Succeeded ${i}`);
    assertConnection(workflow, fileName, `If Run Succeeded ${i}`, 'Get Run Results', 0);
    assertConnection(workflow, fileName, `If Run Succeeded ${i}`, `If Run Failed ${i}`, 1);
    assertConnection(workflow, fileName, `If Run Failed ${i}`, 'Get Failure Logs', 0);
    if (i < 6) {
      assertConnection(workflow, fileName, `If Run Failed ${i}`, `Wait Before Poll ${i + 1}`, 1);
    } else {
      assertConnection(workflow, fileName, `If Run Failed ${i}`, 'Get Timeout Logs', 1);
    }
  }
}

function validateStarter(workflow, fileName) {
  assertHasNodes(workflow, fileName, [
    'Manual Trigger',
    'Lead Search Input',
    'Search CoreClaw Scrapers',
    'Select Google Maps Keyword Scraper',
    'Get Current Scraper Details',
    'Generate Campaign Config',
    'Start CoreClaw Run',
    'Build Starter Summary',
  ]);
  assertConnection(workflow, fileName, 'Manual Trigger', 'Lead Search Input');
  assertConnection(workflow, fileName, 'Lead Search Input', 'Search CoreClaw Scrapers');
  assertConnection(workflow, fileName, 'Search CoreClaw Scrapers', 'Select Google Maps Keyword Scraper');
  assertConnection(workflow, fileName, 'Select Google Maps Keyword Scraper', 'Get Current Scraper Details');
  assertConnection(workflow, fileName, 'Get Current Scraper Details', 'Generate Campaign Config');
  assertConnection(workflow, fileName, 'Generate Campaign Config', 'Start CoreClaw Run');
  assertConnection(workflow, fileName, 'Start CoreClaw Run', 'Build Starter Summary');
}

const files = readdirSync(workflowsDir).filter((file) => file.endsWith('.json')).sort();
for (const required of requiredWorkflowFiles) {
  if (!files.includes(required)) fail(`missing required workflow file: ${required}`);
}

for (const fileName of files) {
  const workflow = readWorkflow(fileName);
  if (!workflow.name || !Array.isArray(workflow.nodes) || typeof workflow.connections !== 'object') {
    fail(`${fileName}: not a valid n8n workflow export shape`);
  }
  assertNoCredentials(workflow, fileName);
  if (fileName.includes('complete')) validateComplete(workflow, fileName);
  if (fileName.includes('starter')) validateStarter(workflow, fileName);
  console.log(`ok ${fileName}: ${workflow.nodes.length} nodes`);
}

console.log('workflow validation passed');
