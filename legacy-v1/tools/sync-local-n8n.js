const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_EMAIL = requireEnv('N8N_EMAIL');
const N8N_PASSWORD = requireEnv('N8N_PASSWORD');
const CORECLAW_CREDENTIAL = {
  id: process.env.CORECLAW_CREDENTIAL_ID || 'coreclawTestApi01',
  name: process.env.CORECLAW_CREDENTIAL_NAME || 'CoreClaw Test API',
};
const LOCAL_ASTRON_API_KEY = process.env.ASTRON_API_KEY || '';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const workflowFiles = [
  'coreclaw-gmaps-leads-simple.json',
  'coreclaw-gmaps-leads-email-extraction-simple.json',
  'coreclaw-gmaps-leads-email-extraction.json',
  'coreclaw-gmaps-b2b-enrichment-simple.json',
  'coreclaw-gmaps-leads-complete-enhanced.json',
  'coreclaw-google-maps-leads-complete-global.json',
  'coreclaw-gmaps-to-sheets.json',
  'coreclaw-gmaps-airtable-email.json',
  'coreclaw-gmaps-reviews-monitor-simple.json',
  'coreclaw-gmaps-reviews-monitor.json',
  'coreclaw-amazon-product-intelligence.json',
  'coreclaw-instagram-profile-intelligence.json',
];

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
    throw new Error(`${options.method || 'GET'} ${pathname} failed ${response.status}: ${text.slice(0, 1000)}`);
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

function unwrapList(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  return [];
}

function asWorkflow(body) {
  return body?.data || body;
}

function workflowUpdatedAt(workflow) {
  return Date.parse(workflow.updatedAt || workflow.createdAt || 0) || 0;
}

function patchLocalCredentials(workflow) {
  for (const node of workflow.nodes) {
    if (node.type === 'n8n-nodes-coreclaw.coreClaw') {
      node.credentials = {
        coreClawApi: {
          id: CORECLAW_CREDENTIAL.id,
          name: CORECLAW_CREDENTIAL.name,
        },
      };
    }
    if (node.type === 'n8n-nodes-base.httpRequest') {
      const headers = node.parameters?.headerParameters?.parameters || [];
      for (const header of headers) {
        if (String(header.name).toLowerCase() === 'authorization') {
          header.value = LOCAL_ASTRON_API_KEY
            ? `Bearer ${LOCAL_ASTRON_API_KEY}`
            : "={{ 'Bearer ' + ($env.ASTRON_API_KEY || 'YOUR_LLM_API_KEY') }}";
        }
      }
    }
  }
}

function updatePayload(current, desired) {
  const payload = {
    name: desired.name,
    nodes: desired.nodes,
    connections: desired.connections,
    settings: desired.settings || current.settings || {},
    meta: desired.meta || current.meta || {},
    staticData: current.staticData || null,
    pinData: {},
    active: false,
    versionId: current.versionId,
  };
  patchLocalCredentials(payload);
  return payload;
}

async function patchWorkflow(cookie, current, desired) {
  const payload = updatePayload(current, desired);
  const { body } = await request(`/rest/workflows/${current.id}?forceSave=true`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, cookie);
  return asWorkflow(body);
}

async function archiveAndDelete(cookie, workflow) {
  if (!workflow.isArchived) {
    await request(`/rest/workflows/${workflow.id}/archive`, { method: 'POST' }, cookie);
  }
  await request(`/rest/workflows/${workflow.id}`, { method: 'DELETE' }, cookie);
}

async function main() {
  const cookie = await login();
  const desiredByName = new Map();
  for (const file of workflowFiles) {
    const workflow = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    desiredByName.set(workflow.name, { file, workflow });
  }

  const listResponse = await request('/rest/workflows?limit=1000', {}, cookie);
  const workflows = unwrapList(listResponse.body);
  const coreclawWorkflows = workflows.filter(workflow => {
    const name = String(workflow.name || '');
    const nodes = JSON.stringify(workflow.nodes || []);
    return name.includes('CoreClaw') || nodes.includes('n8n-nodes-coreclaw.coreClaw');
  });

  const keepByName = new Map();
  for (const workflow of coreclawWorkflows) {
    if (!desiredByName.has(workflow.name)) continue;
    const current = keepByName.get(workflow.name);
    if (!current || workflowUpdatedAt(workflow) > workflowUpdatedAt(current)) {
      keepByName.set(workflow.name, workflow);
    }
  }

  const created = [];
  const updated = [];
  const deleted = [];

  for (const [name, desired] of desiredByName.entries()) {
    let keep = keepByName.get(name);
    if (!keep) {
      const payload = JSON.parse(JSON.stringify(desired.workflow));
      patchLocalCredentials(payload);
      const { body } = await request('/rest/workflows', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, cookie);
      keep = asWorkflow(body);
      keepByName.set(name, keep);
      created.push({ name, id: keep.id, file: desired.file });
    }
  }

  for (const [name, keepSummary] of keepByName.entries()) {
    const desired = desiredByName.get(name);
    if (!desired) continue;
    const current = asWorkflow((await request(`/rest/workflows/${keepSummary.id}`, {}, cookie)).body);
    const patched = await patchWorkflow(cookie, current, JSON.parse(JSON.stringify(desired.workflow)));
    updated.push({ name, id: patched.id || keepSummary.id, file: desired.file });
  }

  const keepIds = new Set([...keepByName.values()].map(workflow => workflow.id));
  for (const workflow of coreclawWorkflows) {
    if (keepIds.has(workflow.id)) continue;
    await archiveAndDelete(cookie, workflow);
    deleted.push({ name: workflow.name, id: workflow.id });
  }

  const finalResponse = await request('/rest/workflows?limit=1000', {}, cookie);
  const finalWorkflows = unwrapList(finalResponse.body);
  const finalCoreclaw = finalWorkflows.filter(workflow => {
    const name = String(workflow.name || '');
    const nodes = JSON.stringify(workflow.nodes || []);
    return !workflow.isArchived && (name.includes('CoreClaw') || nodes.includes('n8n-nodes-coreclaw.coreClaw'));
  });

  console.log(JSON.stringify({
    created,
    updated,
    deleted_count: deleted.length,
    deleted_sample: deleted.slice(0, 20),
    final_active_coreclaw_workflows: finalCoreclaw.map(workflow => ({ id: workflow.id, name: workflow.name, nodes: workflow.nodes?.length })),
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
