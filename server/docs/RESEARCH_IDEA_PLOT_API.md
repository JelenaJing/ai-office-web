# Research Idea + 模板画图 — 双入口 API 对接说明

本文档面向**主前端接入方**。实现范围仅包含 **Idea 生成** 与 **模板画图（matplotlib）**；不包含 Domain 生图、Introduction remake 等其它 paper-remake 能力。

主前端类型参考（只读，不在此仓库修改）：

- `ai-office-web/src/modules/research/types.ts` → `ResearchIdeaCard`
- `ai-office-web/src/modules/plot/services/PlotService.ts` → `PlotGenerateResponse` / `PlotRecommendationResponse`

服务端类型镜像：`server/src/features/research/types.ts`

---

## 环境变量

| 变量 | 作用 | 使用方 |
|------|------|--------|
| `LLM_PROVIDER` / `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` | 统一 LLM（与 `ai-gateway` 相同规则） | Express + FastAPI |
| `DEEPSEEK_*` / `QWEN_API_KEY` 等 | LLM 未显式配置时的回落 | FastAPI `unified_llm` |
| `PAPER_REMAKE_BASE_URL` | BFF 代理目标，默认 `http://127.0.0.1:8020` | Express |
| `OPENALEX_EMAIL` | Idea 论文检索 mailto | FastAPI |

**说明：** 模板画图输出为 **matplotlib PNG**，不走 `/api/image/jobs`（AI 生图）。

---

## 入口选型

| 入口 | Base URL | 适用场景 |
|------|----------|----------|
| **BFF（推荐）** | `http://<host>:3001/api/research/*` | 与主 Web Vite proxy、AccountCenter 鉴权一致 |
| **FastAPI v2** | `http://<host>:8020/api/v1/.../v2` | 直连 Python，响应已是 `ResearchIdeaCard` / `PlotGenerateResponse` 形状 |
| **FastAPI v1** | `http://<host>:8020/api/v1/remake/idea`、`/api/v1/data/plot` | Legacy `server/frontend`（8021），字段为 snake_case 原始结构 |

`GET /api/research/parity` 返回三套路由对照与 `fastApiHealthy`。

---

## 入口 B — Express BFF

鉴权：`Authorization: Bearer <token>`（与 `/api/data-analysis` 相同）。

### Idea

**`POST /api/research/ideas/generate`**

```json
{
  "projectId": "optional",
  "selectedText": "选中文本或摘要",
  "field": "AI for Science",
  "contract": "v2",
  "mode": "selection"
}
```

- `mode: "fulltext"` 且提供 `projectId` 时走全文多段（需已上传论文）。
- 默认 `contract=v2` 时代理 FastAPI v2，响应：

```json
{
  "success": true,
  "ideas": [ /* ResearchIdeaCard[] */ ],
  "partialMissing": []
}
```

**`POST /api/research/ideas/generate/fulltext`**

```json
{
  "projectId": "required",
  "field": "未分类",
  "target_chars": 6000,
  "overlap_chars": 300
}
```

### Plot

**`POST /api/research/plots/generate`** — `multipart/form-data`

| 字段 | 说明 |
|------|------|
| `file` | CSV / Excel / JSON |
| `projectId` | 可选，保存到 paper 项目 |
| `templateId` | 如 `pl_line` |
| `useLlmTypeDetection` | 默认 true |

查询 `?contract=v2` 时返回 `PlotGenerateResponse`（含 `image` base64）。

**`POST /api/research/plots/recommend`** — JSON body，`rawText` 或 `data`

**`POST /api/research/plots/templates/preview`** — `{ "style": "all", "useLlm": false }`

---

## 入口 A — FastAPI v2

Swagger：`http://<host>:8020/docs`

| 方法 | 路径 |
|------|------|
| POST | `/api/v1/remake/idea/v2` |
| POST | `/api/v1/remake/idea/fulltext/v2` |
| POST | `/api/v1/data/plot/v2` |
| POST | `/api/v1/data/plot/recommend/v2` |
| POST | `/api/v1/data/plot/templates/preview/v2` |

查询参数 `strict_errors=true` 时失败返回 HTTP 5xx，不再返回占位 Idea。

### Idea v2 请求示例

```bash
curl -s -X POST "http://127.0.0.1:8020/api/v1/remake/idea/v2" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "smoke-lab",
    "selected_text": "钙钛矿电池界面钝化",
    "field": "materials"
  }'
```

`selected_text` 为空时使用项目内已清洗全文（需有效 `project_id`）。

### Plot v2 请求示例

```bash
curl -s -X POST "http://127.0.0.1:8020/api/v1/data/plot/v2" \
  -F "file=@sample.csv" \
  -F "use_llm_type_detection=false"
```

---

## FastAPI v1（Legacy）

| 能力 | 路径 |
|------|------|
| Idea | `POST /api/v1/remake/idea`、`/idea/fulltext` |
| Plot | `POST /api/v1/data/plot`、`/plot/json`、`/plot/recommend` |

响应字段：`ideas[].title|description|innovation|references`，`plot_base64`，`metadata.chart_type` 等。

---

## 本地联调

1. 启动 FastAPI（8020）：

```bash
cd ai-office-web/server/backend
uvicorn app.main:app --host 0.0.0.0 --port 8020
```

2. 启动 Express（3001）：`cd ai-office-web/server && npm run dev`

3. 测试 UI（5175，不改主前端）：

```bash
cd ai-office-web/server && npm run dev:research-lab
```

浏览器打开 `http://127.0.0.1:5175`，可切换 BFF / FastAPI v1 / v2。

4. CLI smoke：

```bash
cd ai-office-web/server
RESEARCH_SMOKE_SKIP_IDEA=1 npm run smoke:research-idea-plot
```

---

## 接入建议（给主前端）

1. 优先对接 **`/api/research/*`**，类型以 `ResearchIdeaCard` 为准。
2. 论文全流程：先 `POST /api/v1/paper/upload`（8020）拿到 `project_id`，再调 BFF。
3. Plot 与 Electron `PlotService`（本地 plot-agent）是**不同栈**；科研模板图请用本 API。
4. 查看 `partialMissing` 了解尚未parity的能力（如异步 Idea job）。

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `backend/app/services/unified_llm.py` | Python 统一 LLM |
| `backend/app/routers/research_v2.py` | FastAPI v2 路由 |
| `server/src/features/research/` | Express BFF |
| `server/dev/research-lab/` | 独立测试页 |
| `server/docs/IDEA_PLOT_DEPLOY_10_20_5_61.md` | 部署到 5.61 |
