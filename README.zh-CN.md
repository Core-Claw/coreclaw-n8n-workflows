# CoreClaw n8n 工作流(v2)

把 [CoreClaw](https://coreclaw.com) 的 Google Maps 采集器变成完整业务闭环的生产级 n8n 模板:采集 → 评分 → **写入 Google 表格** → **发送带 Excel 附件的摘要邮件**。

基于 `n8n-nodes-coreclaw` **0.4.1**(节点 `description.version: 2`,34 个 operation,全 `/api/v2/`)。已在 n8n **2.30.4** 端到端验证。

## 工作流清单

| 工作流 | 作用 | 运行模式 | 下游 |
| --- | --- | --- | --- |
| [`workflows/gmaps-leads-to-sheets.json`](workflows/gmaps-leads-to-sheets.json) | 跑 Google Maps 采集器,扁平化+评分,追加到 Google 表格。 | `运行并取结果`(轮询) | Google Sheets |
| [`workflows/gmaps-leads-sheets-email-summary.json`](workflows/gmaps-leads-sheets-email-summary.json) | 同上,再加:导出 run 为 `.xlsx`、下载、发一封 HTML 摘要邮件(Top10 表+邮箱覆盖率统计)带 xlsx 附件。 | `运行并取结果`(轮询) | Google Sheets + Gmail |
| [`workflows/gmaps-leads-callback-export.json`](workflows/gmaps-leads-callback-export.json) | 事件驱动:异步 run + `callback_url`,平台回调时取结果、导 xlsx、发邮件。免轮询——需要 n8n 公网可达。 | callback webhook | Gmail |

A → B → C 是刻意设计的复杂度递进:选能完成工作的最小那个。

## 为什么替换旧的工作流包

[`legacy-v1/`](legacy-v1/ARCHIVED.md) 里的旧 12 个工作流已归档,原因:

1. 它们绑定 **v1 节点契约**(`scraperSlug` + `scraper.run`/`run.get`/`run.getResults` + 显式 `version: v1.x.x`)。v2 节点用 `worker_id` + `运行并取结果`,参数结构已不匹配。
2. 它们**号称**集成 Google Sheets / Gmail / Airtable,但实际一个这类节点都没有——只是 Code 节点拼字段名。本仓库的工作流真实连了下游节点。
3. 12 个里有 9 个是同一个 Google Maps 采集器换不同后处理,靠单一脚本批量生成。本仓库 3 个工作流是针对真实 worker schema 手写的。

## 前置条件

- n8n **2.22.5+**(在 2.30.4 上构建并验证导入)。
- 安装社区节点包 `n8n-nodes-coreclaw`(**设置 → 社区节点 → 安装 `n8n-nodes-coreclaw`**)。自托管 Docker 也可在 n8n 用户目录 `npm install n8n-nodes-coreclaw` 后重启。
- 三套凭证——见 [`docs/credentials-binding.md`](docs/credentials-binding.md) 和 [`docs/google-oauth-setup.md`](docs/google-oauth-setup.md):
  - **CoreClaw API**(key + baseUrl `https://openapi.coreclaw.com`)
  - **Google Sheets OAuth2**
  - **Gmail OAuth2**(仅工作流 B、C 需要)

## 快速开始

1. **装节点包** + **建上述凭证**。
2. **建一个 Google 表格**,工作表名 `Leads`(工作流 A、B 写到这里)。
3. **导入**工作流 JSON:n8n → Workflows → ⋮ → **Import from File**。
4. 在每个标 `REPLACE_WITH_*` 的节点上**绑定凭证**(见 [`docs/credentials-binding.md`](docs/credentials-binding.md))。
5. 工作流 C:在 `Start Run` 节点把 `callback_url` 设为 CoreClaw Trigger 的 webhook 地址——并确保 n8n 公网可达(或用 cpolar/frp 内网穿透)。
6. 打开 `Input Config` 节点,设好 `keywords` / `base_location` / `max_results`,点 **Execute workflow**。

默认搜索(`HVAC Contractors` / `New York, USA` / `max_results=5`)按 worker 公开价约 `$0.008` 一次,30–40 秒完成。

## 评分逻辑

`Normalize & Score` Code 节点计算 `lead_score`(0–100):

```
score = round(min(100, review_rating · log10(review_count + 1) · 12  +  有邮箱·15  +  有网站·5))
```

权重在 Code 节点里改。写表和邮件表格前按 `lead_score` 降序排列。

## 字段映射

worker 结果字段 → 表格列见 [`docs/field-map.md`](docs/field-map.md)。该文件还列出 worker README 示例与真实输出的 4 处差异(如真实是 `review_rating`/`review_count` 而非 `rating`/`reviews_total`;`all_emails` 是字符串不是数组)——本工作流用的是真实字段。

## 验证记录

工作流 A、B 已在 n8n 2.30.4 上用真实 CoreClaw 账户和 Google 账户端到端跑通(worker `coreclaw/google-maps-scraper`,搜索 `HVAC Contractors` / `New York, USA` / `max_results=5`):

| 工作流 | 结果 |
| --- | --- |
| A — gmaps-leads-to-sheets | ✅ `success` — 抓 5 条,评分,追加到 Google 表格(`Leads` 工作表,20 列)。 |
| B — gmaps-leads-sheets-email-summary | ✅ `success` — 同样抓取+写表,另导出 `.xlsx`(64KB)发到收件邮箱,正文 HTML 含 Top10 摘要。 |
| C — gmaps-leads-callback-export | 已导入并激活;运行需公网/内网穿透 webhook 地址(本地未实跑)。见工作流 sticky note。 |

运行创建的 Google 表格:名为 **CoreClaw Maps Leads**,含 **Leads** 工作表,20 列表头(`lead_score, search_rank, title, phone, website, emails, primary_category, categories, review_rating, review_count, status, city, state, address, latitude, longitude, place_url, source_keyword, source_location, scraped_at`)。

## 节点包 bug(已在 0.4.1 修复)

验证时 **Run and Get Results** 节点报 `NodeOperationError: Could not find property`(来自 `collectParams`)。根因:`n8n-nodes-coreclaw` ≤ 0.4.0 里 `runAndGetResults`/`rerunAndGetResults` 的 spec 把 `runBodyParams`(callback_url/is_async/body offset+limit)和分页参数展开进 `spec.params`,但节点描述只对 `run`/`rerunLastRun`/`abortLastRun` 显示这些字段,不含 `runAndGetResults`,导致 `findDisplayedProperty` 抛错。

**已在 0.4.1 上游修复**([commit](https://github.com/Core-Claw/n8n-nodes-coreclaw/commit/1710c22)):复合 spec 的 `params` 现在只保留 `workerId`/`version`/`input_json`/`raw_input_json`(returnAll 在 `router.js` 单独取,offset/limit 回退 0/50)。修复已发到 npm,任何人装 `n8n-nodes-coreclaw@latest`(≥ 0.4.1)拿到的就是修好的版本,无需手动打补丁。

## 故障排查

| 现象 | 原因/修复 |
| --- | --- |
| 节点显示 `REPLACE_WITH_*` / 红标 | 绑凭证(见 credentials-binding.md)。 |
| CoreClaw `12001` / `12002` | API key 无效或无权限——重建 CoreClaw API 凭证。 |
| CoreClaw `11004` | 找不到 worker——`workerId` 的 id 模式值必须是 `coreclaw~google-maps-scraper`(owner path)或商店 slug。 |
| CoreClaw `30001` | 账户余额不足。 |
| `Run did not finish before polling timed out` | `运行并取结果` 最长轮询约 4 分钟。长任务改用工作流 C(callback)。 |
| Google `redirect_uri_mismatch` | OAuth 回调地址必须精确为 `http://localhost:5678/rest/oauth2-credential/callback`(见 google-oauth-setup.md)。 |
| Gmail `invalid_scope` | 只用 `gmail.send`。 |
| 工作流 C 不触发 | n8n 公网不可达;CoreClaw 无法 POST 到你的 webhook。用内网穿透或公网部署。 |
| `emails`/`categories` 列空 | 你的 worker 版本输出仍是数组——查 [`docs/field-map.md`](docs/field-map.md) 的"差异"段。 |

## 仓库结构

```
.
├── workflows/          # 3 个 v2 工作流 JSON(导入这些)
├── docs/               # 凭证配置、绑定指南、字段映射
├── legacy-v1/          # 归档的 v1 工作流(v2 节点下不可用)
└── README.md / README.zh-CN.md
```

## 许可证

MIT——与上游节点包一致。
