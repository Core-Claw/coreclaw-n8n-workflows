# CoreClaw Google Maps Leads n8n 工作流

这是一个完整的 n8n 工作流，用于运行 CoreClaw **Google Map Details By Keyword** 脚本，并导出 Google Maps 商家线索数据。

## 文件

| 文件 | 用途 |
| --- | --- |
| `coreclaw-google-maps-leads-complete-global.json` | 完整 n8n 工作流：搜索脚本、读取实时脚本详情、生成 Campaign Config、启动运行、实时轮询、获取结果、导出 CSV/JSON、获取日志 |

原始导入地址：

```text
https://raw.githubusercontent.com/Core-Claw/coreclaw-n8n-workflows-google-maps/main/coreclaw-google-maps-leads-complete-global.json
```

## 工作流做了什么

这个工作流会：

1. 在 CoreClaw Store 搜索 Google Maps keyword 脚本。
2. 自动选择 **Google Map Details By Keyword**。
3. 每次运行前读取实时脚本详情。
4. 使用 CoreClaw 返回的当前 `version`，不手写版本号。
5. 根据实时 schema 和用户输入自动生成 `customParams`。
6. 复用脚本详情里的 system 默认参数。
7. 启动 CoreClaw run。
8. 轮询到 CoreClaw 返回终态状态。
9. 获取结果预览，导出 CSV/JSON，并获取日志。

## 使用要求

- 自托管 n8n。
- 已安装 `n8n-nodes-coreclaw` 社区节点。
- 已在 n8n 中创建 CoreClaw API credential。

n8n Cloud 可能不允许未验证的社区节点。如果无法使用 CoreClaw 节点，请使用自托管 n8n。

## 导入和运行

1. 打开 n8n。
2. 导入 `coreclaw-google-maps-leads-complete-global.json`，或使用上面的原始导入地址。
3. 在每个 CoreClaw 节点上选择你自己的 CoreClaw credential。
4. 打开 **Lead Search Input** 节点。
5. 修改需要的字段。
6. 执行工作流。

## 用户需要填写的字段

通常只需要修改 **Lead Search Input** 节点：

| 字段 | 含义 | 示例 |
| --- | --- | --- |
| `keyword` | Google Maps 搜索关键词 | `coffee shop` |
| `base_location` | 搜索地点 | `New York, USA` |
| `max_results` | 请求的最大线索数量 | `3` |
| `fetch_reviews` | 是否抓取评论数据 | `false` |
| `fetch_social_info` | 是否抓取网站和社交主页信息 | `false` |
| `wait_seconds` | 每次状态轮询之间的等待秒数 | `10` |

建议首次测试：

```text
keyword = coffee shop
base_location = New York, USA
max_results = 3
fetch_reviews = false
fetch_social_info = false
wait_seconds = 10
```

## 网络说明

这个公开工作流不包含 API key、credential ID、本地路径、代理地址或历史 run ID。

海外用户通常不需要代理。如果 n8n 运行在中国内地，本机或服务器可能需要为 n8n 进程配置出站代理环境变量，但不要把代理地址写进公开共享的 workflow JSON。

## English

English instructions are available in [README.md](README.md).
