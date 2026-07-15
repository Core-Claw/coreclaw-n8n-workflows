const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
let parseFlatted;
try {
  ({ parse: parseFlatted } = require('flatted'));
} catch {
  ({ parse: parseFlatted } = require('E:/n8n/node_modules/flatted'));
}
const N8N_EMAIL = requireEnv('N8N_EMAIL');
const N8N_PASSWORD = requireEnv('N8N_PASSWORD');
const WORKFLOW_ID = process.argv[2] || 'U2dHVWuYZF5WDZhb';
const DESTINATION_NODE = process.argv[3] || 'Success Summary / 成功摘要';
const EXISTING_EXECUTION_ID = process.argv[4] || '';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function request(pathname, options = {}, cookie = '') {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(cookie ? { Cookie: cookie } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`${N8N_BASE_URL}${pathname}`, { ...options, headers });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${pathname} failed ${response.status}: ${text.slice(0, 2000)}`);
  }
  return { response, body };
}

async function login() {
  const { response } = await request('/rest/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrLdapLoginId: N8N_EMAIL, password: N8N_PASSWORD }),
  });
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('n8n login did not return a cookie');
  return setCookie.split(';')[0];
}

function unwrapWorkflow(body) {
  return body?.data || body;
}

function unwrapExecution(body) {
  const execution = body?.data || body;
  if (typeof execution?.data === 'string') {
    execution.data = parseFlatted(execution.data);
  }
  return execution;
}

function resolveNodeName(workflow, requestedName) {
  const nodes = workflow.nodes || [];
  const exact = nodes.find(node => node.name === requestedName);
  if (exact) return exact.name;
  const bilingual = nodes.find(node => node.name.startsWith(`${requestedName} / `));
  if (bilingual) return bilingual.name;
  return requestedName;
}

function lastOutput(execution, nodeName) {
  const runData = execution?.data?.resultData?.runData || {};
  const nodeRuns = runData[nodeName] || [];
  const last = nodeRuns[nodeRuns.length - 1];
  return last?.data?.main?.[0]?.map(item => item.json) || [];
}

function compactRecord(record) {
  return {
    title: record.title || record.full_name || record.username || record.record_key,
    score: record.commercial_score ?? record.opportunity_score,
    priority: record.lead_priority || record.priority,
    rating: record.rating,
    review_count: record.review_count,
    email: record.email,
    website: record.website || record.url || record.profile_url,
    recommended_action: record.ai_action || record.recommended_action,
    payloads: record.destination_payloads ? Object.keys(record.destination_payloads) : [],
  };
}

function compactOutput(output) {
  return output.map(item => ({
    outcome: item.outcome,
    workflow_name: item.workflow_name,
    campaign_name: item.campaign_name,
    run_slug: item.run_slug,
    run_status: item.run_status,
    returned_items: item.returned_items,
    average_commercial_score: item.average_commercial_score,
    high_value_records: item.high_value_records,
    payload_ready_records: item.payload_ready_records,
    business_value: item.business_value,
    top_records: Array.isArray(item.top_records) ? item.top_records.slice(0, 3).map(compactRecord) : [],
    verified_at: item.verified_at,
  }));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const cookie = await login();
  const workflow = unwrapWorkflow((await request(`/rest/workflows/${WORKFLOW_ID}`, {}, cookie)).body);
  const trigger = workflow.nodes.find(node => node.type.includes('manualTrigger') || node.type.includes('scheduleTrigger'));
  if (!trigger) throw new Error('No supported trigger node found');
  const destinationNodeName = resolveNodeName(workflow, DESTINATION_NODE);

  const payload = {
    workflowData: workflow,
    startNodes: [{ name: trigger.name, sourceData: null }],
    destinationNode: { nodeName: destinationNodeName, mode: 'inclusive' },
    runData: {},
    pinData: {},
  };

  const started = EXISTING_EXECUTION_ID
    ? { executionId: EXISTING_EXECUTION_ID }
    : (await request(`/rest/workflows/${WORKFLOW_ID}/run`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'push-ref': 'coreclaw-local-validation' },
    }, cookie)).body;

  if (started.waitingForWebhook) {
    console.log(JSON.stringify({ status: 'waitingForWebhook', started }, null, 2));
    return;
  }
  const executionId = started.executionId || started?.data?.executionId;
  if (!executionId) {
    console.log(JSON.stringify({ status: 'unknown_start_response', started }, null, 2));
    return;
  }

  let execution;
  for (let i = 0; i < 120; i += 1) {
    execution = unwrapExecution((await request(`/rest/executions/${executionId}?includeData=true`, {}, cookie)).body);
    const status = execution.status;
    if (!['new', 'running', 'waiting'].includes(status)) break;
    await sleep(5000);
  }

  const output = lastOutput(execution, destinationNodeName);
  const compact = process.env.COMPACT_OUTPUT === '1';
  console.log(JSON.stringify({
    workflowId: WORKFLOW_ID,
    workflowName: workflow.name,
    executionId,
    status: execution?.status,
    finished: execution?.finished,
    stoppedAt: execution?.stoppedAt,
    output: compact ? compactOutput(output) : output,
    error: execution?.data?.resultData?.error,
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
