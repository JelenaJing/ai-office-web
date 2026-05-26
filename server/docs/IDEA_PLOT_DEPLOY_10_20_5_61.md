# Idea 生成 + 模板画图 — 功能说明与 10.20.5.61 部署

本文档只覆盖两项能力：**科研 Idea 生成**、**按模板自动画图**。其它 remake 能力（Introduction、Domain、实验链路等）不在本次范围，但同步整仓后端时仍会带上路由，未配置的外部依赖调用时会失败，不影响本两条链路。

## 1. 功能与 API

### 1.1 生成 Idea

| 项 | 说明 |
|----|------|
| 路由 | `POST /api/v1/remake/idea` |
| 全文多段 | `POST /api/v1/remake/idea/fulltext` |
| 依赖 | `DEEPSEEK_*`（必填）、`OPENALEX_EMAIL`（建议，用于检索最新论文） |
| 代码 | `backend/app/agents/idea_generator.py`、`backend/app/routers/remake.py` |
| 前置 | 需先 `POST /api/v1/paper/upload` 创建项目并得到 `project_id`；或请求里带 `selected_text` / 全文 |

请求体（节选，见 Swagger）：

```json
{
  "project_id": "20260422_161506_d1c999e6",
  "selected_text": "",
  "context": null
}
```

`selected_text` 为空时，后端用项目内已清洗全文（`PaperProcessor.get_paper_text(..., variant="cleaned")`）。

### 1.2 模板画图

| 项 | 说明 |
|----|------|
| 上传文件出图 | `POST /api/v1/data/plot`（multipart：`file` + 可选 `template_id`） |
| JSON 出图 | `POST /api/v1/data/plot/json` |
| 仅推荐模板 | `POST /api/v1/data/plot/recommend` |
| 模板预览 | `POST /api/v1/data/plot/templates/preview` |
| 依赖 | 内置 `PlotService`，**不需要** `PLOT_AGENT_URL` / draw-gateway |
| 可选 LLM | `use_llm_type_detection=true` 时会调 DeepSeek 做数据类型分类 |
| 代码 | `backend/app/services/plot/`、`backend/app/routers/data.py` |
| 模板表 | `backend/app/services/plot/templates/template_registry.json` |

常用表单字段：`project_id`、`file`、`template_id`、`auto_recommend`、`chart_type`、`x`/`y`/`hue` 等。

## 2. 环境变量（目标机 `backend/.env`）

你提到 5.61 上配置已有，部署脚本**不会覆盖** `.env`。若新建环境，至少：

```bash
DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
OPENALEX_EMAIL=your_email@example.com
# 可选：数据目录，默认仓库下 data/projects/
# PAPER_REMAKE_DATA_DIR=/data/darebug/aioffice-server/ai-office-web/server/data
```

Idea / 画图**不需要** `DRAW_GATEWAY_BASE_URL`、`DEEPSYN_API_URL`。

## 3. 部署到 10.20.5.61

### 3.1 路径约定

| 变量 | 默认值 |
|------|--------|
| 主机 | `darebug@10.20.5.61` |
| 目录 | `/data/darebug/aioffice-server/ai-office-web/server` |
| 后端端口 | `8020` |
| 前端端口 | `8021`（可选） |

若你机器上目录不同，改 `scripts/deploy_idea_plot_to_10_20_5_61.sh` 顶部变量即可。

### 3.2 本机执行（会提示 SSH/rsync 密码）

```bash
cd /home/ywt/w/paper-remake-service
bash scripts/deploy_idea_plot_to_10_20_5_61.sh
```

仅同步代码、不重启：

```bash
bash scripts/deploy_idea_plot_to_10_20_5_61.sh sync-only
```

首次连接若报 `Host key verification failed`，先执行：

```bash
ssh-keyscan -H 10.20.5.61 >> ~/.ssh/known_hosts
```

### 3.3 目标机仅重启后端

```bash
ssh darebug@10.20.5.61 'bash /data/darebug/aioffice-server/ai-office-web/server/scripts/remote_restart_backend_10_20_5_61.sh'
```

### 3.4 自检

```bash
# 健康检查
curl -s http://10.20.5.61:8020/health

# Swagger
# 浏览器打开 http://10.20.5.61:8020/docs
```

前端（若已 `npm install` 且配置了 `.env.local` 指向 8020）：

```text
http://10.20.5.61:8021
```

侧栏：**生成新科研 Idea**、**画图工具**。

## 4. 与整仓迁移文档的关系

- 全量迁移说明：[PROJECT_MIGRATION_HANDOVER.md](./PROJECT_MIGRATION_HANDOVER.md)
- 10.26.1.25 同步脚本：`scripts/rsync_code_only_to_10_26_1_25.sh`
- 本机 → 5.61：`scripts/deploy_idea_plot_to_10_20_5_61.sh`
