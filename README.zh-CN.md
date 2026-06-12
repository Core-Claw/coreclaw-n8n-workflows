# CoreClaw n8n 商业工作流包

本仓库包含 12 个面向真实业务场景的 n8n 工作流模板，核心数据源为 CoreClaw 官方社区节点。

这些工作流不再只是演示 CoreClaw 调用，而是直接输出可进入日常运营系统的数据：线索评分、优先级、CRM 阶段、推荐动作、证据字段，以及 Google Sheets、Airtable、CRM、Slack、Notion、邮件草稿、Webhook 的目标 payload。

## 本次改造内容

- 全量重建 12 个工作流，统一使用稳定英文节点名，降低 n8n 表达式和脚本引用风险。
- 清理 sticky note、NoOp 队列、断开的旧分支、不可达节点和历史重复工作流。
- 增加商业评分、优先级、CRM 阶段、行动建议、证据字段和执行摘要。
- 给 CoreClaw、网站抓取、AI HTTP 节点增加重试和容错。
- 给 CoreClaw 启动节点增加 `systemParams`，稳定 worker 运行配置。
- 强化网站邮箱提取：要求邮箱域名与目标网站匹配，并过滤占位邮箱、图片文件名、平台邮箱、开发商邮箱。
- 仓库 JSON 不包含真实 API key；本地 n8n 凭证只在本机实例中绑定。

## 工作流清单

| 文件 | 工作流 | 业务用途 |
| --- | --- | --- |
| `coreclaw-gmaps-leads-simple.json` | CoreClaw Maps Leads | 本地地图线索评分和 CRM payload |
| `coreclaw-gmaps-leads-email-extraction-simple.json` | CoreClaw Maps Email Finder | 地图线索加网站邮箱发现 |
| `coreclaw-gmaps-leads-email-extraction.json` | CoreClaw Email Outreach Leads | AI 外联话术、下一步动作和邮箱线索 |
| `coreclaw-gmaps-b2b-enrichment-simple.json` | CoreClaw B2B Enrichment | B2B 账户资格判断和排除规则 |
| `coreclaw-gmaps-leads-complete-enhanced.json` | CoreClaw Lead Operations | 完整线索运营：评分、AI、网站信号、payload |
| `coreclaw-google-maps-leads-complete-global.json` | CoreClaw Global Prospecting | 国际医美/诊所拓客和市场优先级 |
| `coreclaw-gmaps-to-sheets.json` | CoreClaw Sheets Leads | 可直接写入表格的线索行 |
| `coreclaw-gmaps-airtable-email.json` | CoreClaw Airtable Pipeline | Airtable CRM 字段 payload |
| `coreclaw-gmaps-reviews-monitor-simple.json` | CoreClaw Reviews Monitor | 每日口碑/评论监控 |
| `coreclaw-gmaps-reviews-monitor.json` | CoreClaw Reputation Operations | AI 辅助口碑运营动作 |
| `coreclaw-amazon-product-intelligence.json` | CoreClaw Amazon Product Intelligence | 亚马逊商品竞品和机会情报 |
| `coreclaw-instagram-profile-intelligence.json` | CoreClaw Instagram Profile Intelligence | 品牌、达人、合作伙伴账号情报 |

## 使用要求

- n8n 2.22.5 或更高版本。
- n8n 已安装 `n8n-nodes-coreclaw` 社区节点。
- n8n 中已配置 CoreClaw API 凭证。
- 如需 AI 增强，在 n8n 运行环境中设置 `ASTRON_API_KEY`，或只在私有 n8n 实例里替换 HTTP 节点的占位值。

不要把真实 API key 写入仓库 JSON。

## 导入说明

导入 JSON 后，需要在所有 CoreClaw 节点上选择 CoreClaw 凭证，包括：

- `Start CoreClaw Run`
- `Get Run Status`
- `Get Run Results`

本仓库提供本地同步脚本，可在不修改仓库 JSON 的情况下，把工作流同步到本地 n8n 并绑定本地凭证：

```powershell
$env:N8N_EMAIL="you@example.com"
$env:N8N_PASSWORD="..."
$env:ASTRON_API_KEY="..."
node tools\sync-local-n8n.js
```

## 本地清理和验收

执行清理前已备份本地 n8n 数据库和导出工作流。清理后，本地 n8n 删除了 222 个历史 CoreClaw 重复/遗弃工作流，只保留 12 个最终版本 CoreClaw 工作流。

本地 n8n 真实执行验收记录：

| 工作流 | Execution ID | 结果 |
| --- | ---: | --- |
| CoreClaw Maps Leads | 167 | 成功，3 条线索，平均分 60，payload 完整 |
| CoreClaw Email Outreach Leads | 168 | 成功，AI 增强，产出 hot lead 和真实邮箱 |
| CoreClaw Amazon Product Intelligence | 169 | 成功，3 个商品，2 个高价值机会 |
| CoreClaw Instagram Profile Intelligence | 171 | 成功，品牌账号情报和合作建议 |
| CoreClaw Maps Email Finder | 173 | 成功，邮箱增强和目标系统 payload |
| CoreClaw Sheets Leads | 172 | 成功，表格行 payload |
| CoreClaw B2B Enrichment | 174 | 成功，B2B 资格判断和排除规则 |
| CoreClaw Lead Operations | 175 | 成功，完整线索运营输出 |
| CoreClaw Airtable Pipeline | 176 | 成功，Airtable/CRM payload |
| CoreClaw Global Prospecting | 181 | 成功，国际诊所拓客输出 |
| CoreClaw Reviews Monitor | 178 | 成功，口碑监控摘要 |
| CoreClaw Reputation Operations | 179 | 成功，AI 口碑运营动作 |

仓库结构校验：

- 12 个 JSON 均可解析。
- 不存在 sticky note、NoOp 遗弃节点。
- 不存在缺失连接源或目标节点。
- Code 节点语法校验通过。
- 仓库中不存在真实 CoreClaw 或 AI API key。

## 工具脚本

- `tools/generate-commercial-workflows.js`：从统一源生成全部 12 个工作流 JSON。
- `tools/sync-local-n8n.js`：把仓库工作流同步到本地 n8n、绑定本地凭证、删除重复 CoreClaw 工作流。
- `tools/run-local-workflow.js`：通过 n8n REST 触发工作流，并读取最终执行输出。

这些脚本用于本地维护和验收，普通导入 n8n 时不是必需步骤。
