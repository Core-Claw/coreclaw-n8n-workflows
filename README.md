# CoreClaw n8n Commercial Workflow Pack

This repository provides mature CoreClaw-first n8n workflows. Every workflow includes bilingual node names and detailed English/Chinese sticky notes.

## Setup

1. Import the JSON workflow into n8n.
2. Select your CoreClaw API credential on each CoreClaw node.
3. Replace `YOUR_LLM_API_KEY` in HTTP Request nodes if AI is used.
4. Edit `Input Config / 输入配置`.
5. Run manually and inspect `Success Summary / 成功摘要`.

## Workflow Map

```mermaid
mindmap
  root((CoreClaw n8n Pack))
    Google Maps
      Leads
      Email Enrichment
      B2B Enrichment
      Reputation
      Global Prospecting
    Amazon
      Product Intelligence
    Instagram
      Profile Intelligence
    Destinations
      Sheets
      Airtable
      Slack
      Notion
      CRM
```

## Workflows

### CoreClaw地图线索 / Maps Leads

- **File:** `coreclaw-gmaps-leads-simple.json`
- **Use case:** Google Maps local lead scraping
- **Parameter example:** `keyword=dentist, base_location=Austin, Texas, USA, max_results=3`
- **How it helps:** Converts raw CoreClaw data into scored, deduplicated, business-ready records with reporting and downstream payloads.

```mermaid
flowchart LR
  A["Trigger / 触发"] --> B["Input Config / 输入配置"]
  B --> C["CoreClaw Run / 启动CoreClaw"]
  C --> D["Poll Status / 等待并轮询"]
  D --> E{"Succeeded? / 成功摘要?"}
  E -->|"Yes / 是"| F["Get Results / 获取结果"]
  E -->|"No / 否"| X["Failure Summary / 失败摘要"]
  F --> G["Normalize + Deduplicate / 规范化并去重"]
  G --> H["AI or Enrichment / AI或增强处理"]
  H --> I["Payloads + Report / 准备载荷并生成报告"]
  I --> J["Success Summary / 成功摘要"]
```

### CoreClaw地图邮箱 / Maps Email

- **File:** `coreclaw-gmaps-leads-email-extraction-simple.json`
- **Use case:** Google Maps leads with website email discovery
- **Parameter example:** `keyword=dentist, base_location=Austin, Texas, USA, max_results=3`
- **How it helps:** Converts raw CoreClaw data into scored, deduplicated, business-ready records with reporting and downstream payloads.

```mermaid
flowchart LR
  A["Trigger / 触发"] --> B["Input Config / 输入配置"]
  B --> C["CoreClaw Run / 启动CoreClaw"]
  C --> D["Poll Status / 等待并轮询"]
  D --> E{"Succeeded? / 成功摘要?"}
  E -->|"Yes / 是"| F["Get Results / 获取结果"]
  E -->|"No / 否"| X["Failure Summary / 失败摘要"]
  F --> G["Normalize + Deduplicate / 规范化并去重"]
  G --> H["AI or Enrichment / AI或增强处理"]
  H --> I["Payloads + Report / 准备载荷并生成报告"]
  I --> J["Success Summary / 成功摘要"]
```

### CoreClaw B2B增强 / B2B Enrich

- **File:** `coreclaw-gmaps-b2b-enrichment-simple.json`
- **Use case:** B2B lead enrichment with AI analysis
- **Parameter example:** `keyword=dentist, base_location=Austin, Texas, USA, max_results=3`
- **How it helps:** Converts raw CoreClaw data into scored, deduplicated, business-ready records with reporting and downstream payloads.

```mermaid
flowchart LR
  A["Trigger / 触发"] --> B["Input Config / 输入配置"]
  B --> C["CoreClaw Run / 启动CoreClaw"]
  C --> D["Poll Status / 等待并轮询"]
  D --> E{"Succeeded? / 成功摘要?"}
  E -->|"Yes / 是"| F["Get Results / 获取结果"]
  E -->|"No / 否"| X["Failure Summary / 失败摘要"]
  F --> G["Normalize + Deduplicate / 规范化并去重"]
  G --> H["AI or Enrichment / AI或增强处理"]
  H --> I["Payloads + Report / 准备载荷并生成报告"]
  I --> J["Success Summary / 成功摘要"]
```

### CoreClaw评论监控 / Reviews Monitor

- **File:** `coreclaw-gmaps-reviews-monitor-simple.json`
- **Use case:** Review and reputation monitoring
- **Parameter example:** `keyword=dentist, base_location=Austin, Texas, USA, max_results=2, max_reviews_per_place=3`
- **How it helps:** Converts raw CoreClaw data into scored, deduplicated, business-ready records with reporting and downstream payloads.

```mermaid
flowchart LR
  A["Trigger / 触发"] --> B["Input Config / 输入配置"]
  B --> C["CoreClaw Run / 启动CoreClaw"]
  C --> D["Poll Status / 等待并轮询"]
  D --> E{"Succeeded? / 成功摘要?"}
  E -->|"Yes / 是"| F["Get Results / 获取结果"]
  E -->|"No / 否"| X["Failure Summary / 失败摘要"]
  F --> G["Normalize + Deduplicate / 规范化并去重"]
  G --> H["AI or Enrichment / AI或增强处理"]
  H --> I["Payloads + Report / 准备载荷并生成报告"]
  I --> J["Success Summary / 成功摘要"]
```

### CoreClaw表格线索 / Sheets Leads

- **File:** `coreclaw-gmaps-to-sheets.json`
- **Use case:** Advanced Sheets-ready lead operations
- **Parameter example:** `keyword=dentist, base_location=Austin, Texas, USA, max_results=3`
- **How it helps:** Converts raw CoreClaw data into scored, deduplicated, business-ready records with reporting and downstream payloads.

```mermaid
flowchart LR
  A["Trigger / 触发"] --> B["Input Config / 输入配置"]
  B --> C["CoreClaw Run / 启动CoreClaw"]
  C --> D["Poll Status / 等待并轮询"]
  D --> E{"Succeeded? / 成功摘要?"}
  E -->|"Yes / 是"| F["Get Results / 获取结果"]
  E -->|"No / 否"| X["Failure Summary / 失败摘要"]
  F --> G["Normalize + Deduplicate / 规范化并去重"]
  G --> H["AI or Enrichment / AI或增强处理"]
  H --> I["Payloads + Report / 准备载荷并生成报告"]
  I --> J["Success Summary / 成功摘要"]
```

### CoreClaw外联线索 / Email Outreach

- **File:** `coreclaw-gmaps-leads-email-extraction.json`
- **Use case:** Advanced email outreach pipeline
- **Parameter example:** `keyword=dentist, base_location=Austin, Texas, USA, fetch_social_info=true`
- **How it helps:** Converts raw CoreClaw data into scored, deduplicated, business-ready records with reporting and downstream payloads.

```mermaid
flowchart LR
  A["Trigger / 触发"] --> B["Input Config / 输入配置"]
  B --> C["CoreClaw Run / 启动CoreClaw"]
  C --> D["Poll Status / 等待并轮询"]
  D --> E{"Succeeded? / 成功摘要?"}
  E -->|"Yes / 是"| F["Get Results / 获取结果"]
  E -->|"No / 否"| X["Failure Summary / 失败摘要"]
  F --> G["Normalize + Deduplicate / 规范化并去重"]
  G --> H["AI or Enrichment / AI或增强处理"]
  H --> I["Payloads + Report / 准备载荷并生成报告"]
  I --> J["Success Summary / 成功摘要"]
```

### CoreClaw Airtable管道 / Airtable Pipeline

- **File:** `coreclaw-gmaps-airtable-email.json`
- **Use case:** Airtable/CRM lead pipeline
- **Parameter example:** `keyword=dentist, base_location=Austin, Texas, USA, max_results=3`
- **How it helps:** Converts raw CoreClaw data into scored, deduplicated, business-ready records with reporting and downstream payloads.

```mermaid
flowchart LR
  A["Trigger / 触发"] --> B["Input Config / 输入配置"]
  B --> C["CoreClaw Run / 启动CoreClaw"]
  C --> D["Poll Status / 等待并轮询"]
  D --> E{"Succeeded? / 成功摘要?"}
  E -->|"Yes / 是"| F["Get Results / 获取结果"]
  E -->|"No / 否"| X["Failure Summary / 失败摘要"]
  F --> G["Normalize + Deduplicate / 规范化并去重"]
  G --> H["AI or Enrichment / AI或增强处理"]
  H --> I["Payloads + Report / 准备载荷并生成报告"]
  I --> J["Success Summary / 成功摘要"]
```

### CoreClaw完整线索运营 / Lead Ops

- **File:** `coreclaw-gmaps-leads-complete-enhanced.json`
- **Use case:** Complete multi-destination lead operations
- **Parameter example:** `keyword=dentist, base_location=Austin, Texas, USA, max_results=3`
- **How it helps:** Converts raw CoreClaw data into scored, deduplicated, business-ready records with reporting and downstream payloads.

```mermaid
flowchart LR
  A["Trigger / 触发"] --> B["Input Config / 输入配置"]
  B --> C["CoreClaw Run / 启动CoreClaw"]
  C --> D["Poll Status / 等待并轮询"]
  D --> E{"Succeeded? / 成功摘要?"}
  E -->|"Yes / 是"| F["Get Results / 获取结果"]
  E -->|"No / 否"| X["Failure Summary / 失败摘要"]
  F --> G["Normalize + Deduplicate / 规范化并去重"]
  G --> H["AI or Enrichment / AI或增强处理"]
  H --> I["Payloads + Report / 准备载荷并生成报告"]
  I --> J["Success Summary / 成功摘要"]
```

### CoreClaw口碑运营 / Reputation Ops

- **File:** `coreclaw-gmaps-reviews-monitor.json`
- **Use case:** Advanced reputation operations
- **Parameter example:** `keyword=dentist, base_location=Austin, Texas, USA, fetch_reviews=true`
- **How it helps:** Converts raw CoreClaw data into scored, deduplicated, business-ready records with reporting and downstream payloads.

```mermaid
flowchart LR
  A["Trigger / 触发"] --> B["Input Config / 输入配置"]
  B --> C["CoreClaw Run / 启动CoreClaw"]
  C --> D["Poll Status / 等待并轮询"]
  D --> E{"Succeeded? / 成功摘要?"}
  E -->|"Yes / 是"| F["Get Results / 获取结果"]
  E -->|"No / 否"| X["Failure Summary / 失败摘要"]
  F --> G["Normalize + Deduplicate / 规范化并去重"]
  G --> H["AI or Enrichment / AI或增强处理"]
  H --> I["Payloads + Report / 准备载荷并生成报告"]
  I --> J["Success Summary / 成功摘要"]
```

### CoreClaw全球拓客 / Global Prospecting

- **File:** `coreclaw-google-maps-leads-complete-global.json`
- **Use case:** Global local-business prospecting
- **Parameter example:** `keyword=restaurant, base_location=Singapore, max_results=3`
- **How it helps:** Converts raw CoreClaw data into scored, deduplicated, business-ready records with reporting and downstream payloads.

```mermaid
flowchart LR
  A["Trigger / 触发"] --> B["Input Config / 输入配置"]
  B --> C["CoreClaw Run / 启动CoreClaw"]
  C --> D["Poll Status / 等待并轮询"]
  D --> E{"Succeeded? / 成功摘要?"}
  E -->|"Yes / 是"| F["Get Results / 获取结果"]
  E -->|"No / 否"| X["Failure Summary / 失败摘要"]
  F --> G["Normalize + Deduplicate / 规范化并去重"]
  G --> H["AI or Enrichment / AI或增强处理"]
  H --> I["Payloads + Report / 准备载荷并生成报告"]
  I --> J["Success Summary / 成功摘要"]
```

### CoreClaw亚马逊情报 / Amazon Intel

- **File:** `coreclaw-amazon-product-intelligence.json`
- **Use case:** Amazon product intelligence
- **Parameter example:** `domain=https://www.amazon.com, keyword=coffee grinder, limit=3`
- **How it helps:** Converts raw CoreClaw data into scored, deduplicated, business-ready records with reporting and downstream payloads.

```mermaid
flowchart LR
  A["Trigger / 触发"] --> B["Input Config / 输入配置"]
  B --> C["CoreClaw Run / 启动CoreClaw"]
  C --> D["Poll Status / 等待并轮询"]
  D --> E{"Succeeded? / 成功摘要?"}
  E -->|"Yes / 是"| F["Get Results / 获取结果"]
  E -->|"No / 否"| X["Failure Summary / 失败摘要"]
  F --> G["Normalize + Deduplicate / 规范化并去重"]
  G --> H["AI or Enrichment / AI或增强处理"]
  H --> I["Payloads + Report / 准备载荷并生成报告"]
  I --> J["Success Summary / 成功摘要"]
```

### CoreClaw Instagram账号情报 / Instagram Intel

- **File:** `coreclaw-instagram-profile-intelligence.json`
- **Use case:** Instagram profile intelligence
- **Parameter example:** `username=instagram, limit=1`
- **How it helps:** Converts raw CoreClaw data into scored, deduplicated, business-ready records with reporting and downstream payloads.

```mermaid
flowchart LR
  A["Trigger / 触发"] --> B["Input Config / 输入配置"]
  B --> C["CoreClaw Run / 启动CoreClaw"]
  C --> D["Poll Status / 等待并轮询"]
  D --> E{"Succeeded? / 成功摘要?"}
  E -->|"Yes / 是"| F["Get Results / 获取结果"]
  E -->|"No / 否"| X["Failure Summary / 失败摘要"]
  F --> G["Normalize + Deduplicate / 规范化并去重"]
  G --> H["AI or Enrichment / AI或增强处理"]
  H --> I["Payloads + Report / 准备载荷并生成报告"]
  I --> J["Success Summary / 成功摘要"]
```

## Security

No public workflow JSON contains private CoreClaw or LLM keys. Use n8n credentials or environment variables for production.
