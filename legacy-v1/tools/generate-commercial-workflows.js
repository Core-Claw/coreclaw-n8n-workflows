const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const MAPS_SLUG = '01KPD6M5YQADCQKGVKPDZVYC63';
const MAPS_VERSION = 'v1.2.1';
const AMAZON_SLUG = '01KNXXZHPV394AKVGFM18E5N6B';
const AMAZON_VERSION = 'v1.0.5';
const INSTAGRAM_SLUG = '01KPD6M5YVHWCNQCRK3W1JD9W2';
const INSTAGRAM_VERSION = 'v1.0.2';

const LABELS = {
  manualTrigger: ['Manual Trigger', '手动触发'],
  scheduleTrigger: ['Every 24 Hours', '每24小时执行'],
  inputConfig: ['Input Config', '输入配置'],
  startCoreClawRun: ['Start CoreClaw Run', '启动CoreClaw任务'],
  waitBeforePoll: ['Wait Before Poll', '等待轮询'],
  getRunStatus: ['Get Run Status', '获取任务状态'],
  ifTerminal: ['If Terminal', '是否结束'],
  ifSuccess: ['If Success', '是否成功'],
  getRunResults: ['Get Run Results', '获取任务结果'],
  normalizeRecords: ['Normalize Records', '标准化记录'],
  removeDuplicates: ['Remove Duplicates', '去重'],
  aiAnalysis: ['AI Commercial Analysis', 'AI商业分析'],
  parseAiOutput: ['Parse AI Output', '解析AI输出'],
  fetchWebsite: ['Fetch Website', '抓取网站'],
  extractWebsiteSignals: ['Extract Website Signals', '提取网站信号'],
  preparePayloads: ['Prepare Destination Payloads', '准备目标系统载荷'],
  aggregateResults: ['Aggregate Results', '汇总结果'],
  successSummary: ['Success Summary', '成功摘要'],
  failureSummary: ['Failure Summary', '失败摘要'],
  stickyOverview: ['Overview', '概览'],
  stickyInputs: ['Inputs', '输入'],
  stickyFlow: ['Flow', '流程'],
  stickyOutputs: ['Outputs', '输出'],
};

const NODES = Object.fromEntries(
  Object.entries(LABELS).map(([key, [en, zh]]) => [key, `${en} / ${zh}`])
);

function workflowName(spec) {
  return `${spec.name} / ${spec.zhName}`;
}

function jsSingle(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function jsDouble(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const specs = [
  {
    file: 'coreclaw-gmaps-leads-simple.json',
    name: 'CoreClaw Maps Leads',
    zhName: 'CoreClaw 地图线索',
    kind: 'maps_leads',
    domain: 'maps',
    campaign: 'Local services lead generation',
    owner: 'Sales Ops',
    keyword: 'dentist',
    location: 'Austin, Texas, USA',
    maxResults: 3,
    targetIcp: 'Local service businesses with website, phone, and visible customer demand',
    offer: 'Book a 15 minute automation audit to capture more inbound leads',
    proxyRegion: 'US',
  },
  {
    file: 'coreclaw-gmaps-leads-email-extraction-simple.json',
    name: 'CoreClaw Maps Email Finder',
    zhName: 'CoreClaw 地图邮箱发现',
    kind: 'maps_email_finder',
    domain: 'maps',
    website: true,
    campaign: 'Local lead email enrichment',
    owner: 'Growth Ops',
    keyword: 'dentist',
    location: 'Austin, Texas, USA',
    maxResults: 3,
    targetIcp: 'Local companies where direct contact data unlocks outbound sales',
    offer: 'Verify and enrich contact data before the first outreach sequence',
    proxyRegion: 'US',
  },
  {
    file: 'coreclaw-gmaps-leads-email-extraction.json',
    name: 'CoreClaw Email Outreach Leads',
    zhName: 'CoreClaw 邮件外联线索',
    kind: 'email_outreach',
    domain: 'maps',
    ai: true,
    website: true,
    campaign: 'AI assisted local outbound',
    owner: 'Revenue Ops',
    keyword: 'dentist',
    location: 'Austin, Texas, USA',
    maxResults: 3,
    fetchSocial: true,
    targetIcp: 'Owner operated local businesses with clear service demand',
    offer: 'Automate missed-call capture, review monitoring, and outbound follow up',
    proxyRegion: 'US',
  },
  {
    file: 'coreclaw-gmaps-b2b-enrichment-simple.json',
    name: 'CoreClaw B2B Enrichment',
    zhName: 'CoreClaw B2B线索增强',
    kind: 'b2b_enrichment',
    domain: 'maps',
    ai: true,
    website: true,
    campaign: 'B2B account qualification',
    owner: 'Sales Development',
    keyword: 'commercial cleaning',
    location: 'Dallas, Texas, USA',
    maxResults: 3,
    targetIcp: 'B2B service providers that need predictable appointment generation',
    offer: 'Enrich each account with buying triggers, contactability, and next action',
    proxyRegion: 'US',
  },
  {
    file: 'coreclaw-gmaps-leads-complete-enhanced.json',
    name: 'CoreClaw Lead Operations',
    zhName: 'CoreClaw 完整线索运营',
    kind: 'lead_operations',
    domain: 'maps',
    ai: true,
    website: true,
    campaign: 'Full funnel lead operations',
    owner: 'RevOps',
    keyword: 'dentist',
    location: 'Austin, Texas, USA',
    maxResults: 3,
    fetchSocial: true,
    targetIcp: 'High intent local businesses ready for CRM handoff',
    offer: 'Score, enrich, route, and prepare outbound payloads in one run',
    proxyRegion: 'US',
  },
  {
    file: 'coreclaw-google-maps-leads-complete-global.json',
    name: 'CoreClaw Global Prospecting',
    zhName: 'CoreClaw 全球拓客',
    kind: 'global_prospecting',
    domain: 'maps',
    ai: true,
    website: true,
    campaign: 'International market prospecting',
    owner: 'Market Expansion',
    keyword: 'aesthetic clinic',
    location: 'Singapore',
    maxResults: 3,
    targetIcp: 'Aesthetic, wellness, and medical clinics with strong local demand and measurable acquisition economics',
    offer: 'Benchmark international clinic targets and prioritize outreach with contact, demand, and reputation signals',
    proxyRegion: 'SG',
  },
  {
    file: 'coreclaw-gmaps-to-sheets.json',
    name: 'CoreClaw Sheets Leads',
    zhName: 'CoreClaw 表格线索',
    kind: 'sheets_leads',
    domain: 'maps',
    campaign: 'Spreadsheet ready lead list',
    owner: 'Marketing Ops',
    keyword: 'dentist',
    location: 'Austin, Texas, USA',
    maxResults: 3,
    targetIcp: 'Teams that need clean tabular lead data without manual copy paste',
    offer: 'Produce spreadsheet rows with score, action, and CRM-ready fields',
    proxyRegion: 'US',
  },
  {
    file: 'coreclaw-gmaps-airtable-email.json',
    name: 'CoreClaw Airtable Pipeline',
    zhName: 'CoreClaw Airtable管道',
    kind: 'airtable_pipeline',
    domain: 'maps',
    website: true,
    campaign: 'Airtable CRM lead queue',
    owner: 'Operations',
    keyword: 'dentist',
    location: 'Austin, Texas, USA',
    maxResults: 3,
    targetIcp: 'Small teams using Airtable as lightweight CRM',
    offer: 'Create clean Airtable field payloads with contact and priority metadata',
    proxyRegion: 'US',
  },
  {
    file: 'coreclaw-gmaps-reviews-monitor-simple.json',
    name: 'CoreClaw Reviews Monitor',
    zhName: 'CoreClaw 评论监控',
    kind: 'reviews_monitor',
    domain: 'reviews',
    trigger: 'schedule',
    campaign: 'Daily local reputation monitor',
    owner: 'Customer Success',
    keyword: 'dentist',
    location: 'Austin, Texas, USA',
    maxResults: 2,
    fetchReviews: true,
    maxReviewsPerPlace: 3,
    targetIcp: 'Local businesses where new reviews create sales and retention signals',
    offer: 'Catch reputation risk and customer praise before the team misses it',
    proxyRegion: 'US',
  },
  {
    file: 'coreclaw-gmaps-reviews-monitor.json',
    name: 'CoreClaw Reputation Operations',
    zhName: 'CoreClaw 口碑运营',
    kind: 'reputation_operations',
    domain: 'reviews',
    trigger: 'schedule',
    ai: true,
    campaign: 'AI assisted reputation operations',
    owner: 'Customer Success',
    keyword: 'dentist',
    location: 'Austin, Texas, USA',
    maxResults: 2,
    fetchReviews: true,
    maxReviewsPerPlace: 3,
    targetIcp: 'Local brands where reviews affect conversion, ranking, and retention',
    offer: 'Turn fresh reviews into response guidance, escalation queues, and reporting',
    proxyRegion: 'US',
  },
  {
    file: 'coreclaw-amazon-product-intelligence.json',
    name: 'CoreClaw Amazon Product Intelligence',
    zhName: 'CoreClaw 亚马逊商品情报',
    kind: 'amazon_product_intelligence',
    domain: 'amazon',
    ai: true,
    campaign: 'Amazon competitive intelligence',
    owner: 'Ecommerce Ops',
    amazonDomain: 'https://www.amazon.com',
    keyword: 'coffee grinder',
    limit: 3,
    targetIcp: 'Ecommerce operators tracking price, rating, seller, and demand signals',
    offer: 'Prioritize product opportunities and pricing actions from live marketplace data',
    proxyRegion: 'US',
  },
  {
    file: 'coreclaw-instagram-profile-intelligence.json',
    name: 'CoreClaw Instagram Profile Intelligence',
    zhName: 'CoreClaw Instagram账号情报',
    kind: 'instagram_profile_intelligence',
    domain: 'instagram',
    ai: true,
    campaign: 'Creator and brand account intelligence',
    owner: 'Partnerships',
    username: 'glossier',
    limit: 1,
    targetIcp: 'Brand, creator, and partner accounts where audience quality matters',
    offer: 'Qualify social accounts for outreach, partnership, and competitive monitoring',
    proxyRegion: 'US',
  },
];

function assignment(name, value, type) {
  return { id: name, name, value, type };
}

function inputAssignments(spec) {
  const common = [
    assignment('campaign_name', spec.campaign, 'string'),
    assignment('owner', spec.owner, 'string'),
    assignment('target_icp', spec.targetIcp, 'string'),
    assignment('offer', spec.offer, 'string'),
    assignment('proxy_region', spec.proxyRegion || 'US', 'string'),
    assignment('min_score_for_alert', 75, 'number'),
    assignment('wait_seconds', spec.waitSeconds || (spec.domain === 'instagram' ? 10 : 15), 'number'),
  ];

  if (spec.domain === 'amazon') {
    return [
      assignment('domain', spec.amazonDomain, 'string'),
      assignment('keyword', spec.keyword, 'string'),
      assignment('limit', spec.limit || 3, 'number'),
      ...common,
    ];
  }

  if (spec.domain === 'instagram') {
    return [
      assignment('username', spec.username, 'string'),
      assignment('limit', spec.limit || 1, 'number'),
      ...common,
    ];
  }

  return [
    assignment('keyword', spec.keyword, 'string'),
    assignment('base_location', spec.location, 'string'),
    assignment('max_results', spec.maxResults || 3, 'number'),
    assignment('lang', 'en', 'string'),
    assignment('fetch_reviews', Boolean(spec.fetchReviews), 'boolean'),
    assignment('fetch_social_info', Boolean(spec.fetchSocial), 'boolean'),
    assignment('max_reviews_per_place', spec.maxReviewsPerPlace || 3, 'number'),
    assignment('review_sort_by', 'newest', 'string'),
    ...common,
  ];
}

function mapsCustomParams() {
  return `={
  "keyword": [{"string": "{{ $json.keyword }}"}],
  "base_location": "{{ $json.base_location }}",
  "max_results": {{ $json.max_results }},
  "lang": "{{ $json.lang }}",
  "fetch_reviews": {{ $json.fetch_reviews }},
  "fetch_social_info": {{ $json.fetch_social_info }},
  "max_reviews_per_place": {{ $json.max_reviews_per_place }},
  "review_sort_by": "{{ $json.review_sort_by }}",
  "include_reviewer_info": {{ $json.fetch_reviews }}
}`;
}

function amazonCustomParams() {
  return `={
  "keyword_list": [{"domain": "{{ $json.domain }}", "keyword": "{{ $json.keyword }}", "max_results": "{{ $json.limit }}"}]
}`;
}

function instagramCustomParams() {
  return `={
  "username": [{"string": "{{ $json.username }}"}]
}`;
}

function systemParams() {
  return `={
  "cpus": 2,
  "memory": 8192,
  "max_total_charge": 0,
  "max_total_traffic": 0,
  "execute_limit_time_seconds": 0,
  "proxy_region": "{{ $json.proxy_region || 'US' }}"
}`;
}

function node(id, name, type, position, parameters, extra = {}) {
  return {
    id,
    name,
    type,
    typeVersion: extra.typeVersion || defaultTypeVersion(type),
    position,
    parameters,
    ...Object.fromEntries(Object.entries(extra).filter(([key]) => key !== 'typeVersion')),
  };
}

function defaultTypeVersion(type) {
  if (type === 'n8n-nodes-base.set') return 3.4;
  if (type === 'n8n-nodes-base.wait') return 1.1;
  if (type === 'n8n-nodes-base.if') return 2.2;
  if (type === 'n8n-nodes-base.code') return 2;
  if (type === 'n8n-nodes-base.removeDuplicates') return 2;
  if (type === 'n8n-nodes-base.aggregate') return 1;
  if (type === 'n8n-nodes-base.httpRequest') return 4.2;
  if (type === 'n8n-nodes-base.scheduleTrigger') return 1.1;
  return 1;
}

function coreClawNode(id, name, position, parameters, continueOnFail = false) {
  return node(id, name, 'n8n-nodes-coreclaw.coreClaw', position, parameters, {
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    continueOnFail,
    notesInFlow: true,
    notes: 'Bind a CoreClaw API credential after import. / 导入后请绑定 CoreClaw API 凭证。This node uses the official CoreClaw community package. / 本节点使用 CoreClaw 官方社区节点包。',
  });
}

function ifNode(id, name, position, leftValue, rightValue, operation = 'gte') {
  return node(id, name, 'n8n-nodes-base.if', position, {
    conditions: {
      options: {
        caseSensitive: true,
        leftValue: '',
        typeValidation: 'strict',
        version: 2,
      },
      conditions: [
        {
          id,
          leftValue,
          rightValue,
          operator: { type: 'number', operation },
        },
      ],
      combinator: 'and',
    },
    options: {},
  });
}

function normalizeMapsCode(kind) {
  return `const input = $items('${jsSingle(NODES.inputConfig)}')?.[0]?.json || {};
const rows = $input.all().map(item => item.json || {});
const workflowKind = ${JSON.stringify(kind)};

function first(row, names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
}

function cleanUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const withProtocol = /^https?:\\/\\//i.test(raw) ? raw : 'https://' + raw;
  return withProtocol.split('#')[0].replace(/\\/$/, '');
}

function num(value) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function emailsFrom(row) {
  const values = [
    row.email, row.email_1, row.email_2, row.email_3, row.email_4,
    row.all_emails, row.emails, row.discovered_emails,
  ].filter(Boolean).join(', ');
  return [...new Set(String(values).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi) || [])].map(v => v.toLowerCase());
}

function scoreLead(row, website, emails, phone, rating, reviewCount) {
  let contactability = 15;
  if (website) contactability += 25;
  if (emails.length) contactability += 25;
  if (phone) contactability += 25;
  if (first(row, ['linkedin', 'facebook', 'instagram', 'social_links'])) contactability += 10;

  let demand = 25;
  if (reviewCount >= 250) demand += 25;
  else if (reviewCount >= 100) demand += 20;
  else if (reviewCount >= 25) demand += 12;
  if (rating >= 4.6) demand += 20;
  else if (rating >= 4.2) demand += 14;
  else if (rating > 0 && rating < 3.8) demand += 8;

  let fit = 25;
  const category = String(first(row, ['primary_category', 'category', 'all_categories'])).toLowerCase();
  const keyword = String(input.keyword || '').toLowerCase();
  if (category && keyword && category.includes(keyword.split(' ')[0])) fit += 20;
  if (first(row, ['address', 'city', 'state', 'country'])) fit += 15;

  const reputationRisk = rating > 0 && rating < 4 ? Math.min(30, Math.round((4 - rating) * 18 + Math.min(reviewCount, 100) / 10)) : 0;
  const commercialScore = Math.max(0, Math.min(100, Math.round(contactability * 0.4 + demand * 0.35 + fit * 0.25 + reputationRisk * 0.15)));
  return { contactability, demand, fit, reputationRisk, commercialScore };
}

return rows.map((row, index) => {
  const website = cleanUrl(first(row, ['website', 'site', 'domain', 'url']));
  const emailList = emailsFrom(row);
  const phone = String(first(row, ['phone', 'phone_number', 'telephone'])).trim();
  const rating = num(first(row, ['rating', 'review_rating', 'total_score', 'stars']));
  const reviewCount = num(first(row, ['reviews_count', 'review_count', 'reviews']));
  const title = String(first(row, ['title', 'name', 'business_name', 'place_name'])).trim();
  const category = String(first(row, ['primary_category', 'category', 'all_categories'])).trim();
  const score = scoreLead(row, website, emailList, phone, rating, reviewCount);
  const priority = score.commercialScore >= 75 ? 'hot' : score.commercialScore >= 55 ? 'warm' : 'nurture';
  const recommendedAction = priority === 'hot'
    ? 'Call today, add to CRM as SQL, and send a personalized first email.'
    : priority === 'warm'
      ? 'Send a tailored email sequence and schedule a follow-up call within 48 hours.'
      : 'Keep in nurture, enrich contacts, and re-score after more signals are available.';
  const key = String(first(row, ['cid', 'data_id', 'place_id', 'google_id', 'website', 'url']) || title || index).toLowerCase().trim();
  return {
    json: {
      workflow_kind: workflowKind,
      record_key: key,
      campaign_name: input.campaign_name || '',
      owner: input.owner || '',
      target_icp: input.target_icp || '',
      offer: input.offer || '',
      source_keyword: first(row, ['source_keyword']) || input.keyword || '',
      source_location: first(row, ['source_location']) || input.base_location || '',
      title,
      category,
      address: first(row, ['address', 'full_address']),
      city: first(row, ['city']),
      state: first(row, ['state', 'province']),
      country: first(row, ['country']),
      postal_code: first(row, ['postal_code', 'zip']),
      phone,
      website,
      email: emailList.join(', '),
      email_count: emailList.length,
      rating,
      review_count: reviewCount,
      google_maps_url: first(row, ['url', 'google_maps_url', 'place_url']),
      social_profiles: {
        linkedin: first(row, ['linkedin']),
        facebook: first(row, ['facebook']),
        instagram: first(row, ['instagram']),
      },
      contactability_score: Math.min(100, score.contactability),
      demand_score: Math.min(100, score.demand),
      icp_fit_score: Math.min(100, score.fit),
      reputation_risk_score: score.reputationRisk,
      commercial_score: score.commercialScore,
      lead_priority: priority,
      crm_stage: priority === 'hot' ? 'Sales Qualified' : priority === 'warm' ? 'Marketing Qualified' : 'Nurture',
      recommended_action: recommendedAction,
      outreach_angle: score.reputationRisk >= 15
        ? 'Lead with review response, reputation recovery, and conversion lift.'
        : 'Lead with automation ROI, missed opportunity capture, and faster follow-up.',
      evidence: [
        website ? 'website available' : 'missing website',
        emailList.length ? 'email found' : 'email not found',
        phone ? 'phone available' : 'missing phone',
        rating ? 'rating ' + rating : 'no rating',
        reviewCount ? reviewCount + ' reviews' : 'no review count',
      ],
      raw: row,
      processed_at: new Date().toISOString(),
    },
  };
});`;
}

function normalizeReviewsCode(kind) {
  return normalizeMapsCode(kind).replace(
    `const recommendedAction = priority === 'hot'
    ? 'Call today, add to CRM as SQL, and send a personalized first email.'
    : priority === 'warm'
      ? 'Send a tailored email sequence and schedule a follow-up call within 48 hours.'
      : 'Keep in nurture, enrich contacts, and re-score after more signals are available.';`,
    `const recommendedAction = score.reputationRisk >= 15
    ? 'Escalate reputation risk, draft a response, and notify the account owner today.'
    : priority === 'hot'
      ? 'Send positive-review amplification brief to the operator and prepare upsell outreach.'
      : 'Track as normal review intelligence and include in the weekly reputation digest.';`
  ).replace(
    "workflow_kind: workflowKind,",
    `workflow_kind: workflowKind,
      reputation_status: score.reputationRisk >= 15 ? 'risk' : rating >= 4.5 ? 'strong' : 'watch',`
  );
}

function normalizeAmazonCode(kind) {
  return `const input = $items('${jsSingle(NODES.inputConfig)}')?.[0]?.json || {};
const rows = $input.all().map(item => item.json || {});
const workflowKind = ${JSON.stringify(kind)};

function first(row, names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
}

function num(value) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

return rows.map((row, index) => {
  const title = String(first(row, ['title', 'product_title', 'name'])).trim();
  const asin = String(first(row, ['asin', 'product_id'])).trim();
  const price = num(first(row, ['price', 'final_price', 'current_price']));
  const listPrice = num(first(row, ['list_price', 'original_price']));
  const rating = num(first(row, ['rating', 'stars']));
  const reviewCount = num(first(row, ['reviews_count', 'review_count', 'reviews']));
  const rank = num(first(row, ['rank', 'best_seller_rank', 'bsr']));
  const discountPct = listPrice > price && price > 0 ? Math.round((1 - price / listPrice) * 100) : 0;
  let score = 25;
  if (rating >= 4.4) score += 20;
  else if (rating >= 4) score += 12;
  if (reviewCount >= 1000) score += 25;
  else if (reviewCount >= 200) score += 18;
  else if (reviewCount >= 50) score += 10;
  if (discountPct >= 15) score += 10;
  if (rank > 0 && rank <= 10000) score += 15;
  if (price > 0) score += 5;
  score = Math.max(0, Math.min(100, score));
  const priority = score >= 80 ? 'high' : score >= 60 ? 'watch' : 'benchmark';
  return {
    json: {
      workflow_kind: workflowKind,
      record_key: (asin || first(row, ['url', 'product_url']) || title || index).toString().toLowerCase(),
      campaign_name: input.campaign_name || '',
      owner: input.owner || '',
      target_icp: input.target_icp || '',
      offer: input.offer || '',
      keyword: input.keyword || '',
      marketplace_domain: input.domain || '',
      title,
      brand: first(row, ['brand']),
      seller_name: first(row, ['seller_name', 'seller']),
      asin,
      price,
      list_price: listPrice,
      discount_pct: discountPct,
      rating,
      review_count: reviewCount,
      rank,
      url: first(row, ['url', 'product_url']),
      opportunity_score: score,
      priority,
      recommended_action: priority === 'high'
        ? 'Review price, listing angle, and seller positioning today.'
        : priority === 'watch'
          ? 'Track as competitive benchmark and compare against owned SKUs weekly.'
          : 'Store as baseline market data; enrich again when demand changes.',
      evidence: [
        price ? 'price ' + price : 'price missing',
        rating ? 'rating ' + rating : 'rating missing',
        reviewCount ? reviewCount + ' reviews' : 'reviews missing',
        discountPct ? discountPct + '% discount' : 'no discount signal',
      ],
      raw: row,
      processed_at: new Date().toISOString(),
    },
  };
});`;
}

function normalizeInstagramCode(kind) {
  return `const input = $items('${jsSingle(NODES.inputConfig)}')?.[0]?.json || {};
const rows = $input.all().map(item => item.json || {});
const workflowKind = ${JSON.stringify(kind)};

function first(row, names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
}

function num(value) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

return rows.map((row, index) => {
  const username = String(first(row, ['username', 'user_name', 'handle']) || input.username || '').replace(/^@/, '');
  const followers = num(first(row, ['followers', 'followers_count', 'follower_count']));
  const following = num(first(row, ['following', 'following_count']));
  const posts = num(first(row, ['posts', 'posts_count', 'media_count']));
  const isVerified = Boolean(first(row, ['is_verified', 'verified']));
  const isBusiness = Boolean(first(row, ['is_business_account', 'business_account']));
  let score = 25;
  if (followers >= 100000) score += 30;
  else if (followers >= 10000) score += 22;
  else if (followers >= 1000) score += 12;
  if (posts >= 100) score += 12;
  if (isVerified) score += 15;
  if (isBusiness) score += 10;
  if (first(row, ['external_url', 'website'])) score += 8;
  score = Math.max(0, Math.min(100, score));
  const priority = score >= 80 ? 'partner' : score >= 60 ? 'watch' : 'monitor';
  return {
    json: {
      workflow_kind: workflowKind,
      record_key: (username || first(row, ['id', 'profile_url']) || index).toString().toLowerCase(),
      campaign_name: input.campaign_name || '',
      owner: input.owner || '',
      target_icp: input.target_icp || '',
      offer: input.offer || '',
      username,
      full_name: first(row, ['full_name', 'name']),
      biography: first(row, ['biography', 'bio']),
      website: first(row, ['external_url', 'website']),
      followers,
      following,
      posts,
      is_verified: isVerified,
      is_business_account: isBusiness,
      category: first(row, ['category_name', 'business_category_name']),
      profile_url: first(row, ['profile_url', 'url']) || (username ? 'https://www.instagram.com/' + username + '/' : ''),
      opportunity_score: score,
      priority,
      recommended_action: priority === 'partner'
        ? 'Prepare partnership or competitive brief and assign owner for outreach.'
        : priority === 'watch'
          ? 'Track content cadence and audience changes before outreach.'
          : 'Keep in monitoring list and enrich when growth signal improves.',
      evidence: [
        followers ? followers + ' followers' : 'followers missing',
        isVerified ? 'verified' : 'not verified',
        isBusiness ? 'business account' : 'creator or personal account',
        posts ? posts + ' posts' : 'posts missing',
      ],
      raw: row,
      processed_at: new Date().toISOString(),
    },
  };
});`;
}

function aiNode() {
  return node('ai-analysis', NODES.aiAnalysis, 'n8n-nodes-base.httpRequest', [1160, -100], {
    method: 'POST',
    url: 'https://maas-coding-api.cn-huabei-1.xf-yun.com/v2/chat/completions',
    authentication: 'none',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        {
          name: 'Authorization',
          value: "={{ 'Bearer ' + ($env.ASTRON_API_KEY || 'YOUR_LLM_API_KEY') }}",
        },
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: "={{ ({ model: 'astron-code-latest', temperature: 0.2, messages: [{ role: 'system', content: 'Return compact JSON only. You are a senior revenue operations analyst. Fields: opportunity, risk, action, priority, pitch, next_step.' }, { role: 'user', content: 'Assess this CoreClaw workflow record for commercial use. Return JSON only. Record: ' + JSON.stringify($json) }] }) }}",
    options: { timeout: 60000 },
  }, {
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 3000,
    continueOnFail: true,
    notesInFlow: true,
    notes: 'Optional LLM enrichment. Set ASTRON_API_KEY locally or replace the placeholder only in your private n8n instance. / 可选大模型增强。请在本地设置 ASTRON_API_KEY，或只在私有 n8n 实例内替换占位值。',
  });
}

function parseAiCode() {
  return `let sourceItems = [];
try { sourceItems = $items('${jsSingle(NODES.removeDuplicates)}').map(item => item.json || {}); } catch (error) { sourceItems = []; }

function parseContent(body) {
  const content = body?.choices?.[0]?.message?.content || body?.data?.choices?.[0]?.message?.content || '';
  const cleaned = String(content || '').replace(/^\\s*\`\`\`json\\s*/i, '').replace(/^\\s*\`\`\`\\s*/i, '').replace(/\\s*\`\`\`\\s*$/i, '').trim();
  if (!cleaned) return {};
  try { return JSON.parse(cleaned); } catch (error) { return { raw: content }; }
}

return $input.all().map((item, index) => {
  const source = sourceItems[index] || sourceItems[0] || {};
  const parsed = parseContent(item.json || {});
  const fallbackPriority = source.lead_priority || source.priority || 'normal';
  return {
    json: {
      ...source,
      ai_status: parsed.raw || Object.keys(parsed).length === 0 ? 'fallback' : 'enriched',
      ai_opportunity: parsed.opportunity || source.outreach_angle || source.recommended_action || '',
      ai_risk: parsed.risk || '',
      ai_action: parsed.action || source.recommended_action || '',
      ai_priority: parsed.priority || fallbackPriority,
      ai_pitch: parsed.pitch || source.outreach_angle || '',
      ai_next_step: parsed.next_step || source.recommended_action || '',
      ai_raw: parsed,
    },
  };
});`;
}

function websiteNode(position) {
  return node('fetch-website', NODES.fetchWebsite, 'n8n-nodes-base.httpRequest', position, {
    method: 'GET',
    url: "={{ $json.website || $json.domain || $json.url || 'https://example.com' }}",
    options: {
      timeout: 15000,
      response: {
        response: {
          responseFormat: 'text',
        },
      },
    },
  }, {
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 2000,
    continueOnFail: true,
  });
}

function extractWebsiteCode(sourceNode) {
  return `let sourceItems = [];
try { sourceItems = $items(${JSON.stringify(sourceNode)}).map(item => item.json || {}); } catch (error) { sourceItems = []; }

function hostOf(value) {
  try { return new URL(String(value || '')).hostname.replace(/^www\\./, '').toLowerCase(); } catch (error) { return ''; }
}

function emailDomain(email) {
  return String(email || '').split('@')[1]?.toLowerCase() || '';
}

return $input.all().map((item, index) => {
  const source = sourceItems[index] || sourceItems[0] || {};
  const text = JSON.stringify(item.json || {});
  const sourceHost = hostOf(source.website || source.url || '');
  const emails = [...new Set((text.match(/\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.(?!png\\b|jpg\\b|jpeg\\b|gif\\b|webp\\b|svg\\b|css\\b|js\\b)[A-Z]{2,24}\\b/gi) || []).map(email => email.toLowerCase()))]
    .filter(email => {
      if (/(example|xxxxxx|placeholder|sentry|wixpress|schema|domain|godaddy|wordpress|webflow|shopify|squarespace|typemade|lab6|google|facebook|instagram|youtube|linkedin|x\\.com)/i.test(email)) return false;
      const domain = emailDomain(email);
      if (!domain) return false;
      if (!sourceHost) return true;
      return sourceHost.endsWith(domain) || domain.endsWith(sourceHost) || sourceHost.split('.').slice(-2).join('.') === domain.split('.').slice(-2).join('.');
    });
  const phones = [...new Set((text.match(/(?:\\+?1[\\s.-]?)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}/g) || []).map(phone => phone.trim()))];
  const mergedEmails = [...new Set([source.email, source.discovered_emails, ...emails].filter(Boolean).join(', ').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi) || [])].map(email => email.toLowerCase());
  return {
    json: {
      ...source,
      email: mergedEmails.join(', '),
      discovered_emails: emails.join(', '),
      discovered_phones: phones.join(', '),
      email_count: mergedEmails.length,
      website_enrichment_status: emails.length || phones.length ? 'signals_found' : 'no_public_signals',
    },
  };
});`;
}

function preparePayloadsCode(workflowName) {
  return `const workflowName = ${JSON.stringify(workflowName)};

function compact(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''));
}

return $input.all().map(item => {
  const r = item.json || {};
  const score = Number(r.commercial_score ?? r.opportunity_score ?? 0);
  const priority = r.lead_priority || r.priority || (score >= 80 ? 'high' : score >= 60 ? 'medium' : 'normal');
  const title = r.title || r.full_name || r.username || r.brand || r.record_key || 'CoreClaw record';
  const externalId = r.record_key || r.asin || r.username || title;
  const email = r.email || r.discovered_emails || '';
  const action = r.ai_action || r.recommended_action || 'Review and assign an owner.';
  const sheetRow = compact({
    workflow_name: workflowName,
    campaign_name: r.campaign_name,
    owner: r.owner,
    external_id: externalId,
    title,
    category: r.category,
    location: [r.city, r.state, r.country].filter(Boolean).join(', '),
    phone: r.phone,
    email,
    website: r.website,
    rating: r.rating,
    review_count: r.review_count,
    score,
    priority,
    recommended_action: action,
    ai_pitch: r.ai_pitch,
    source_keyword: r.source_keyword || r.keyword,
    processed_at: r.processed_at,
  });
  const crmPayload = compact({
    external_id: externalId,
    company_name: title,
    stage: r.crm_stage || (priority === 'hot' || priority === 'high' ? 'Qualified' : 'New'),
    owner: r.owner,
    score,
    priority,
    phone: r.phone,
    email,
    website: r.website,
    next_step: r.ai_next_step || action,
    source: 'CoreClaw n8n workflow',
  });
  const slackText = '[' + String(priority).toUpperCase() + '] ' + title + ' | score ' + score + ' | ' + action;
  const emailDraft = compact({
    to: email,
    subject: title ? 'Quick idea for ' + title : 'Quick automation idea',
    body: [
      'Hi,',
      '',
      r.ai_pitch || r.outreach_angle || 'I noticed a few operational signals that may be worth acting on.',
      '',
      'Relevant signal: ' + (r.evidence || []).join('; '),
      'Suggested next step: ' + action,
      '',
      'Best,',
      r.owner || 'CoreClaw Ops',
    ].join('\\n'),
  });

  return {
    json: {
      ...r,
      destination_payloads: {
        google_sheets: sheetRow,
        airtable: { fields: sheetRow },
        crm: crmPayload,
        slack: { text: slackText },
        notion: { title, properties: sheetRow },
        email_draft: emailDraft,
        webhook: { event: 'coreclaw.workflow.record_ready', workflow_name: workflowName, payload: sheetRow },
      },
      integration_contract_version: '2026-06-12.commercial-v1',
    },
  };
});`;
}

function successSummaryCode(workflowName) {
  return `const aggregate = $input.first()?.json || {};
const records = Array.isArray(aggregate.records) ? aggregate.records : $input.all().map(item => item.json || {});
let status = {};
let input = {};
try { status = $items('${jsSingle(NODES.getRunStatus)}')?.[0]?.json || {}; } catch (error) {}
try { input = $items('${jsSingle(NODES.inputConfig)}')?.[0]?.json || {}; } catch (error) {}

function scoreOf(record) {
  return Number(record.commercial_score ?? record.opportunity_score ?? 0);
}

const sorted = [...records].sort((a, b) => scoreOf(b) - scoreOf(a));
const alertThreshold = Number(input.min_score_for_alert || 75);
const highValue = sorted.filter(record => scoreOf(record) >= alertThreshold);
const payloadCoverage = records.filter(record => record.destination_payloads).length;
const avgScore = records.length ? Math.round(records.reduce((sum, record) => sum + scoreOf(record), 0) / records.length) : 0;
const reportLines = [
  '# ' + ${JSON.stringify(workflowName)},
  '',
  '- Outcome: success',
  '- CoreClaw run: ' + ($items('${jsSingle(NODES.startCoreClawRun)}')?.[0]?.json?.run_slug || ''),
  '- Returned records: ' + records.length,
  '- Average commercial score: ' + avgScore,
  '- Alert threshold records: ' + highValue.length,
  '- Payload-ready records: ' + payloadCoverage,
  '',
  '## Top actions',
  ...sorted.slice(0, 5).map((record, index) => (index + 1) + '. ' + (record.title || record.full_name || record.username || record.record_key || 'Record') + ' - score ' + scoreOf(record) + ' - ' + (record.ai_action || record.recommended_action || 'Review')),
];

return [{
  json: {
    outcome: 'success',
    workflow_name: ${JSON.stringify(workflowName)},
    campaign_name: input.campaign_name || '',
    owner: input.owner || '',
    run_slug: $items('${jsSingle(NODES.startCoreClawRun)}')?.[0]?.json?.run_slug || '',
    run_status: status.status,
    coreclaw_result_count: status.results ?? status.result_count ?? records.length,
    returned_items: records.length,
    average_commercial_score: avgScore,
    high_value_records: highValue.length,
    payload_ready_records: payloadCoverage,
    business_value: 'Commercially usable output: scored records, prioritized actions, CRM/table/Airtable/Slack/Notion/email payloads, and an executive summary.',
    top_records: sorted.slice(0, 5),
    report_markdown: reportLines.join('\\n'),
    verified_at: new Date().toISOString(),
  },
}];`;
}

function failureSummaryCode(workflowName) {
  return `let status = {};
let input = {};
try { status = $items('${jsSingle(NODES.getRunStatus)}')?.[0]?.json || {}; } catch (error) {}
try { input = $items('${jsSingle(NODES.inputConfig)}')?.[0]?.json || {}; } catch (error) {}

const statusCode = Number(status.status || 0);
const diagnosis = status.error || status.err_msg || status.message || (statusCode === 4 ? 'CoreClaw run failed.' : statusCode === 5 ? 'CoreClaw run was aborted.' : 'CoreClaw run did not complete successfully.');

return [{
  json: {
    outcome: 'failure',
    workflow_name: ${JSON.stringify(workflowName)},
    campaign_name: input.campaign_name || '',
    run_slug: $items('${jsSingle(NODES.startCoreClawRun)}')?.[0]?.json?.run_slug || '',
    run_status: status.status,
    diagnosis,
    recommended_fix: 'Check CoreClaw run logs, verify scraper parameters and quota, then re-run with a small limit before scaling.',
    input_snapshot: input,
    verified_at: new Date().toISOString(),
  },
}];`;
}

function normalizeCode(spec) {
  if (spec.domain === 'amazon') return normalizeAmazonCode(spec.kind);
  if (spec.domain === 'instagram') return normalizeInstagramCode(spec.kind);
  if (spec.domain === 'reviews') return normalizeReviewsCode(spec.kind);
  return normalizeMapsCode(spec.kind);
}

function coreRunParams(spec) {
  if (spec.domain === 'amazon') {
    return {
      resource: 'scraper',
      operation: 'run',
      scraperSlug: { __rl: true, mode: 'id', value: AMAZON_SLUG },
      version: AMAZON_VERSION,
      customParams: amazonCustomParams(),
      additionalFields: { systemParams: systemParams() },
    };
  }
  if (spec.domain === 'instagram') {
    return {
      resource: 'scraper',
      operation: 'run',
      scraperSlug: { __rl: true, mode: 'id', value: INSTAGRAM_SLUG },
      version: INSTAGRAM_VERSION,
      customParams: instagramCustomParams(),
      additionalFields: { systemParams: systemParams() },
    };
  }
  return {
    resource: 'scraper',
    operation: 'run',
    scraperSlug: { __rl: true, mode: 'id', value: MAPS_SLUG },
    version: MAPS_VERSION,
    customParams: mapsCustomParams(),
    additionalFields: { systemParams: systemParams() },
  };
}

function resultLimitExpression(spec) {
  if (spec.domain === 'amazon' || spec.domain === 'instagram') {
    return `={{ Number($items("${jsDouble(NODES.inputConfig)}")?.[0]?.json?.limit || 10) }}`;
  }
  return `={{ Number($items("${jsDouble(NODES.inputConfig)}")?.[0]?.json?.max_results || 10) }}`;
}

function triggerNode(spec) {
  if (spec.trigger === 'schedule') {
    return node('schedule-trigger', NODES.scheduleTrigger, 'n8n-nodes-base.scheduleTrigger', [-1460, 120], {
      rule: {
        interval: [
          {
            field: 'hours',
            hoursInterval: 24,
          },
        ],
      },
    });
  }
  return node('manual-trigger', NODES.manualTrigger, 'n8n-nodes-base.manualTrigger', [-1460, 120], {});
}

function connect(connections, from, outputs) {
  connections[from] = { main: outputs.map(output => output.map(nodeName => ({ node: nodeName, type: 'main', index: 0 }))) };
}

function sourceDescription(spec) {
  if (spec.domain === 'amazon') return 'Amazon marketplace product listings / 亚马逊商品列表';
  if (spec.domain === 'instagram') return 'Instagram profile intelligence / Instagram账号情报';
  if (spec.domain === 'reviews') return 'Google Maps businesses and fresh reviews / Google Maps商家与最新评论';
  return 'Google Maps business search / Google Maps商家搜索';
}

function stickyNote(id, name, position, content, width = 720, height = 260) {
  return node(id, name, 'n8n-nodes-base.stickyNote', position, {
    content,
    height,
    width,
  }, { typeVersion: 1 });
}

function stickyNotes(spec) {
  const name = workflowName(spec);
  const trigger = spec.trigger === 'schedule' ? 'Runs every 24 hours / 每24小时自动执行' : 'Manual operator trigger / 人工手动触发';
  const enrichment = [
    spec.website ? 'Website signal extraction / 网站公开信号提取' : '',
    spec.ai ? 'Optional LLM business analysis / 可选大模型商业分析' : '',
  ].filter(Boolean).join('\n- ') || 'CoreClaw data normalization and scoring / CoreClaw数据标准化与评分';

  return [
    stickyNote('sticky-overview', NODES.stickyOverview, [-1460, -520], `## ${NODES.stickyOverview}
Workflow / 工作流: ${name}

Business goal: turn live CoreClaw data into prioritized, CRM-ready operating records.

业务目标：把实时 CoreClaw 数据转成可进入 CRM、表格和运营系统的高优先级业务记录。`),
    stickyNote('sticky-inputs', NODES.stickyInputs, [-700, -520], `## ${NODES.stickyInputs}
Source / 数据源: ${sourceDescription(spec)}

Trigger / 触发方式: ${trigger}

Key inputs / 关键输入: campaign, owner, ICP, offer, proxy region, wait time, and result limits.

关键参数会在 ${NODES.inputConfig} 节点集中维护，方便导入后按客户场景修改。`),
    stickyNote('sticky-flow', NODES.stickyFlow, [-1460, -220], `## ${NODES.stickyFlow}
1. Start CoreClaw run / 启动 CoreClaw 任务
2. Poll until terminal status / 轮询直到任务结束
3. Normalize and deduplicate records / 标准化并去重
4. Enrich, score, and route / 增强、评分、路由

- ${enrichment}`),
    stickyNote('sticky-outputs', NODES.stickyOutputs, [-700, -220], `## ${NODES.stickyOutputs}
Each successful run returns an executive summary plus destination payloads.

每次成功执行都会输出执行摘要，以及可直接对接的目标系统 payload。

Outputs / 输出: Google Sheets, Airtable, CRM, Slack, Notion, email draft, webhook, evidence fields, and recommended next actions.`),
  ];
}

function buildWorkflow(spec) {
  const displayName = workflowName(spec);
  const nodes = [
    ...stickyNotes(spec),
    triggerNode(spec),
    node('input-config', NODES.inputConfig, 'n8n-nodes-base.set', [-1200, 120], {
      assignments: { assignments: inputAssignments(spec) },
      options: {},
    }),
    coreClawNode('start-coreclaw-run', NODES.startCoreClawRun, [-900, 120], coreRunParams(spec)),
    node('wait-before-poll', NODES.waitBeforePoll, 'n8n-nodes-base.wait', [-640, 120], {
      resume: 'timeInterval',
      amount: `={{ Number($items("${jsDouble(NODES.inputConfig)}")?.[0]?.json?.wait_seconds || 15) }}`,
      unit: 'seconds',
    }),
    coreClawNode('get-run-status', NODES.getRunStatus, [-380, 120], {
      resource: 'run',
      operation: 'get',
      runSlug: `={{ $('${jsSingle(NODES.startCoreClawRun)}').item.json.run_slug }}`,
    }, true),
    ifNode('if-terminal', NODES.ifTerminal, [-120, 120], '={{ $json.error ? 4 : Number($json.status) }}', 3, 'gte'),
    ifNode('if-success', NODES.ifSuccess, [120, 40], '={{ $json.error ? 4 : Number($json.status) }}', 3, 'equals'),
    coreClawNode('get-run-results', NODES.getRunResults, [380, -100], {
      resource: 'run',
      operation: 'getResults',
      runSlug: `={{ $('${jsSingle(NODES.startCoreClawRun)}').item.json.run_slug }}`,
      returnAll: false,
      limit: resultLimitExpression(spec),
    }),
    node('normalize-records', NODES.normalizeRecords, 'n8n-nodes-base.code', [640, -100], {
      mode: 'runOnceForAllItems',
      jsCode: normalizeCode(spec),
    }),
    node('remove-duplicates', NODES.removeDuplicates, 'n8n-nodes-base.removeDuplicates', [900, -100], {
      compare: 'selectedFields',
      fieldsToCompare: 'record_key',
      options: {},
    }),
  ];

  let previous = NODES.removeDuplicates;
  let x = 1160;

  if (spec.ai) {
    const ai = aiNode();
    ai.position = [x, -100];
    nodes.push(ai);
    nodes.push(node('parse-ai-output', NODES.parseAiOutput, 'n8n-nodes-base.code', [x + 260, -100], {
      mode: 'runOnceForAllItems',
      jsCode: parseAiCode(),
    }));
    previous = NODES.parseAiOutput;
    x += 520;
  }

  if (spec.website) {
    nodes.push(websiteNode([x, -100]));
    nodes.push(node('extract-website-signals', NODES.extractWebsiteSignals, 'n8n-nodes-base.code', [x + 260, -100], {
      mode: 'runOnceForAllItems',
      jsCode: extractWebsiteCode(previous),
    }));
    previous = NODES.extractWebsiteSignals;
    x += 520;
  }

  nodes.push(
    node('prepare-payloads', NODES.preparePayloads, 'n8n-nodes-base.code', [x, -100], {
      mode: 'runOnceForAllItems',
      jsCode: preparePayloadsCode(displayName),
    }),
    node('aggregate-results', NODES.aggregateResults, 'n8n-nodes-base.aggregate', [x + 260, -100], {
      aggregate: 'aggregateAllItemData',
      destinationFieldName: 'records',
      options: {},
    }),
    node('success-summary', NODES.successSummary, 'n8n-nodes-base.code', [x + 520, -100], {
      mode: 'runOnceForAllItems',
      jsCode: successSummaryCode(displayName),
    }),
    node('failure-summary', NODES.failureSummary, 'n8n-nodes-base.code', [380, 240], {
      mode: 'runOnceForAllItems',
      jsCode: failureSummaryCode(displayName),
    }),
  );

  const connections = {};
  connect(connections, spec.trigger === 'schedule' ? NODES.scheduleTrigger : NODES.manualTrigger, [[NODES.inputConfig]]);
  connect(connections, NODES.inputConfig, [[NODES.startCoreClawRun]]);
  connect(connections, NODES.startCoreClawRun, [[NODES.waitBeforePoll]]);
  connect(connections, NODES.waitBeforePoll, [[NODES.getRunStatus]]);
  connect(connections, NODES.getRunStatus, [[NODES.ifTerminal]]);
  connect(connections, NODES.ifTerminal, [[NODES.ifSuccess], [NODES.waitBeforePoll]]);
  connect(connections, NODES.ifSuccess, [[NODES.getRunResults], [NODES.failureSummary]]);
  connect(connections, NODES.getRunResults, [[NODES.normalizeRecords]]);
  connect(connections, NODES.normalizeRecords, [[NODES.removeDuplicates]]);

  previous = NODES.removeDuplicates;
  if (spec.ai) {
    connect(connections, previous, [[NODES.aiAnalysis]]);
    connect(connections, NODES.aiAnalysis, [[NODES.parseAiOutput]]);
    previous = NODES.parseAiOutput;
  }
  if (spec.website) {
    connect(connections, previous, [[NODES.fetchWebsite]]);
    connect(connections, NODES.fetchWebsite, [[NODES.extractWebsiteSignals]]);
    previous = NODES.extractWebsiteSignals;
  }
  connect(connections, previous, [[NODES.preparePayloads]]);
  connect(connections, NODES.preparePayloads, [[NODES.aggregateResults]]);
  connect(connections, NODES.aggregateResults, [[NODES.successSummary]]);

  return {
    name: displayName,
    nodes,
    connections,
    active: false,
    settings: {
      executionOrder: 'v1',
      saveManualExecutions: true,
      timezone: 'Asia/Shanghai',
    },
    versionId: `${spec.kind}-commercial-v1`,
    meta: {
      templateId: spec.file.replace(/\\.json$/, ''),
      instanceId: 'coreclaw-commercial-2026-06-12',
    },
    tags: [],
  };
}

function validateWorkflow(workflow) {
  const names = new Set(workflow.nodes.map(n => n.name));
  const inbound = new Set();
  for (const [source, payload] of Object.entries(workflow.connections || {})) {
    if (!names.has(source)) throw new Error(`Connection source missing: ${source}`);
    for (const output of payload.main || []) {
      for (const link of output || []) {
        if (!names.has(link.node)) throw new Error(`Connection target missing: ${link.node}`);
        inbound.add(link.node);
      }
    }
  }
  const triggers = workflow.nodes.filter(n => n.type.includes('Trigger'));
  const allowedNoInbound = new Set(triggers.map(n => n.name));
  for (const sticky of workflow.nodes.filter(n => n.type === 'n8n-nodes-base.stickyNote')) {
    allowedNoInbound.add(sticky.name);
  }
  const noInbound = workflow.nodes.filter(n => !inbound.has(n.name) && !allowedNoInbound.has(n.name));
  if (noInbound.length) throw new Error(`Unconnected nodes: ${noInbound.map(n => n.name).join(', ')}`);

  const missingBilingualNames = workflow.nodes
    .filter(n => n.type !== 'n8n-nodes-base.stickyNote')
    .filter(n => !n.name.includes(' / ') || !/[\u4e00-\u9fff]/.test(n.name));
  if (missingBilingualNames.length) throw new Error(`Nodes missing bilingual names: ${missingBilingualNames.map(n => n.name).join(', ')}`);

  const stickyNotes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.stickyNote');
  if (stickyNotes.length < 4) throw new Error(`Missing bilingual sticky notes in ${workflow.name}`);
  const badStickyNotes = stickyNotes.filter(n => !/[\u4e00-\u9fff]/.test(n.parameters?.content || '') || !/[A-Za-z]/.test(n.parameters?.content || ''));
  if (badStickyNotes.length) throw new Error(`Sticky notes missing bilingual content: ${badStickyNotes.map(n => n.name).join(', ')}`);
}

for (const spec of specs) {
  const workflow = buildWorkflow(spec);
  validateWorkflow(workflow);
  fs.writeFileSync(path.join(ROOT, spec.file), JSON.stringify(workflow, null, 2) + '\n', 'utf8');
  console.log(`wrote ${spec.file}: ${workflow.nodes.length} nodes`);
}
