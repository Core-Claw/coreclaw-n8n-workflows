/**
 * n8n Template Host for CoreClaw Google Maps lead-generation workflows.
 *
 * Implements the N8N_TEMPLATES_HOST contract so any self-hosted n8n instance
 * pointing N8N_TEMPLATES_HOST at this Worker sees these workflows in its
 * in-app Templates panel and can import them with one click.
 *
 * Endpoints (verified against api.n8n.io):
 *   GET /health                         -> {status:"OK"}
 *   GET /templates/categories           -> {categories:[...]}
 *   GET /templates/search               -> {totalWorkflows, workflows:[...], filters:[...]}
 *   GET /templates/workflows/{id}       -> {workflow:{...detail...}}
 *   GET /workflows/templates/{id}       -> {id, name, workflow:{...importable graph...}}
 *   GET /templates/collections          -> {collections:[...]}
 *   GET /templates/collections/{id}     -> {collection:{...}}
 *
 * Workflow JSONs are bundled into the Worker at deploy time (static imports
 * below) — no runtime fetch, so the host stays fast and works even when GitHub
 * raw is unreachable. Update by editing the *.json files and redeploying.
 * IDs are stable numeric slugs (see WORKFLOWS below).
 */

// ---- Catalog ---------------------------------------------------------------
// id: stable numeric id used in URLs. slug: the workflow file (and GitHub path).
const WORKFLOWS = [
  { id: 1001, slug: "gmaps-leads-to-sheets",
    name: "Scrape Google Maps Leads to Google Sheets",
    category: "Lead Generation",
    description: "Scrape business leads from Google Maps via CoreClaw, enrich and score each result (email coverage, review signal, lead score), then append the structured rows to a Google Sheet." },
  { id: 1002, slug: "gmaps-leads-sheets-email-summary",
    name: "Google Maps Leads → Sheets + Email Summary with Excel",
    category: "Lead Generation",
    description: "Same lead-scrape-and-score pipeline, plus emails you a tidy HTML summary (Top-10 ranked leads table + email-coverage stats) with the full result set attached as an .xlsx file." },
  { id: 1003, slug: "gmaps-leads-callback-export",
    name: "Google Maps Leads via Callback (No Polling) → Email with Excel",
    category: "Lead Generation",
    description: "Event-driven variant for large scrapes: starts an async CoreClaw run with a callback_url, then on completion fetches results, exports .xlsx, and emails the report." },
];

const COLLECTIONS = [
  { id: 1, name: "CoreClaw Google Maps Lead Generation", rank: 0,
    description: "Three production-ready workflows that turn CoreClaw's Google Maps scraper into closed business loops: scrape → score → Google Sheets, with optional email + Excel reporting. A → B → C is a deliberate complexity ramp.",
    workflowIds: [1001, 1002, 1003] },
];

const CREATOR = {
  id: 1, name: "CoreClaw", username: "coreclaw",
  bio: "CoreClaw — high-throughput web-scraping infrastructure. Turn scraped data into closed business loops with n8n.",
  verified: true,
  links: "[\"https://coreclaw.com\",\"https://github.com/Core-Claw\"]",
  avatar: "https://avatars.githubusercontent.com/u/0?v=4",
};

const CREATED_AT = "2026-07-16T00:00:00.000Z";

// Workflows are bundled into the Worker at deploy time (no runtime fetch),
// so the template host stays fast and dependency-free. Update by editing
// these JSON files and redeploying with `wrangler deploy`.
import wfA from "./gmaps-leads-to-sheets.json";
import wfB from "./gmaps-leads-sheets-email-summary.json";
import wfC from "./gmaps-leads-callback-export.json";
const GRAPH_BY_SLUG = {
  "gmaps-leads-to-sheets": wfA,
  "gmaps-leads-sheets-email-summary": wfB,
  "gmaps-leads-callback-export": wfC,
};

// Node metadata extractor: derives the catalog-metadata shape n8n expects
// from a workflow's importable nodes.
function nodeMetadata(node) {
  // friendly display name from node type
  const parts = (node.type || "").split(".");
  const last = parts[parts.length - 1];
  const displayName = node.name || last;
  return {
    id: node.type || last,
    icon: last ? last.toLowerCase() : "default",
    name: last || node.name,
    codex: node.type || undefined,
    group: parts[0] === "n8n-nodes-base" ? "input" : "transform",
    defaults: { color: "#007755" },
    iconData: null,
    displayName,
    typeVersion: node.typeVersion || 1,
    nodeCategories: [],
  };
}

// ---- HTTP helpers ----------------------------------------------------------
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Cache-Control": "public, max-age=300",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function getWorkflowGraph(slug) {
  return GRAPH_BY_SLUG[slug] || null;
}

// ---- Response builders -----------------------------------------------------
function searchListItem(wf) {
  return {
    id: wf.id,
    name: wf.name,
    totalViews: 0,
    price: 0,
    purchaseUrl: "",
    user: { ...CREATOR },
    description: wf.description,
    createdAt: CREATED_AT,
    nodes: [], // populated lazily only when graph is loaded; list view ok empty
  };
}

async function detailWrapper(wf) {
  const graph = getWorkflowGraph(wf.slug);
  if (!graph) return null;
  return {
    workflow: {
      id: wf.id,
      name: wf.name,
      views: 0,
      recentViews: 0,
      totalViews: 0,
      createdAt: CREATED_AT,
      description: wf.description,
      workflow: {
        meta: { instanceId: "coreclaw-public-templates" },
        nodes: graph.nodes,
        pinData: {},
        connections: graph.connections,
      },
      lastUpdatedBy: CREATOR.id,
      workflowInfo: {
        nodeCount: graph.nodes.length,
        nodeTypes: [...new Set(graph.nodes.map((n) => n.type))],
      },
      status: "published",
      reviewStatus: "published",
      readyToDemo: true,
      user: { name: CREATOR.name, username: CREATOR.username, bio: CREATOR.bio, verified: CREATOR.verified, links: CREATOR.links, avatar: CREATOR.avatar },
      nodes: graph.nodes.map(nodeMetadata),
      categories: [{ name: wf.category }],
      image: "",
    },
  };
}

async function flatImport(wf) {
  const graph = getWorkflowGraph(wf.slug);
  if (!graph) return null;
  return {
    id: wf.id,
    name: wf.name,
    workflow: {
      meta: { instanceId: "coreclaw-public-templates" },
      nodes: graph.nodes,
      pinData: {},
      connections: graph.connections,
    },
  };
}

// ---- Router ----------------------------------------------------------------
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");
    const seg = path.split("/").filter(Boolean); // e.g. ["templates","workflows","1001"]

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });

    // GET /health
    if (seg.length === 1 && seg[0] === "health") return json({ status: "OK" });

    // GET /templates/categories
    if (seg.join("/") === "templates/categories") {
      const cats = [{ id: 2, name: "Sales", displayName: null, icon: "💼", parent: null },
                    { id: 37, name: "Lead Generation", displayName: "Lead Generation", icon: "🏷️", parent: { id: 2, name: "Sales", icon: "💼" } }];
      return json({ categories: cats });
    }

    // GET /templates/search
    if (seg.join("/") === "templates/search") {
      const q = (url.searchParams.get("search") || "").toLowerCase();
      const cat = url.searchParams.get("category");
      let items = WORKFLOWS;
      if (q) items = items.filter((w) => (w.name + w.description).toLowerCase().includes(q));
      if (cat) items = items.filter((w) => w.category === cat);
      // build list items with node metadata for the browse UI
      const out = [];
      for (const w of items) {
        const graph = getWorkflowGraph(w.slug);
        const item = searchListItem(w);
        if (graph) item.nodes = graph.nodes.map(nodeMetadata);
        out.push(item);
      }
      return json({
        totalWorkflows: out.length,
        workflows: out,
        filters: [
          { counts: {}, field_name: "category", sampled: false, stats: {} },
          { counts: {}, field_name: "node_type", sampled: false, stats: {} },
        ],
      });
    }

    // GET /templates/workflows/{id}
    const m1 = seg.join("/").match(/^templates\/workflows\/(\d+)$/);
    if (m1) {
      const wf = WORKFLOWS.find((w) => String(w.id) === m1[1]);
      if (!wf) return json({ error: "not found" }, 404);
      const body = await detailWrapper(wf);
      return body ? json(body) : json({ error: "workflow unavailable" }, 502);
    }

    // GET /workflows/templates/{id}
    const m2 = seg.join("/").match(/^workflows\/templates\/(\d+)$/);
    if (m2) {
      const wf = WORKFLOWS.find((w) => String(w.id) === m2[1]);
      if (!wf) return json({ error: "not found" }, 404);
      const body = await flatImport(wf);
      return body ? json(body) : json({ error: "workflow unavailable" }, 502);
    }

    // GET /templates/collections
    if (seg.join("/") === "templates/collections") {
      const out = COLLECTIONS.map((c) => ({
        id: c.id, rank: c.rank, name: c.name, totalViews: 0, createdAt: CREATED_AT,
        workflows: c.workflowIds.map((id) => ({ id })), nodes: [],
      }));
      return json({ collections: out });
    }

    // GET /templates/collections/{id}
    const m3 = seg.join("/").match(/^templates\/collections\/(\d+)$/);
    if (m3) {
      const c = COLLECTIONS.find((x) => String(x.id) === m3[1]);
      if (!c) return json({ error: "not found" }, 404);
      const wfs = [];
      for (const id of c.workflowIds) {
        const wf = WORKFLOWS.find((w) => w.id === id);
        if (wf) wfs.push(searchListItem(wf));
      }
      return json({ collection: { id: c.id, name: c.name, description: c.description, workflows: wfs } });
    }

    // root / fallback
    if (path === "" || path === "/") {
      return json({
        name: "CoreClaw n8n Template Host",
        workflows: WORKFLOWS.map((w) => ({ id: w.id, name: w.name })),
        usage: "Set N8N_TEMPLATES_HOST=<this url> on your self-hosted n8n to see these in the Templates panel.",
      });
    }

    return json({ error: "not found", path }, 404);
  },
};
