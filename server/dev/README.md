# server/dev — Research 测试工具

## 端口规划（与主站隔离）

| 用途 | 端口 | 说明 |
|------|------|------|
| 主站 Express | **3001** | `npm run dev` 默认 |
| 主站 Web Vite | **5173** | `ai-office-web` 根目录 |
| Paper Remake API | **8020** | `uvicorn` 默认 |
| Legacy paper UI | **8021** | `server/frontend` |
| **测试 BFF** | **13001** | `PORT=13001 npm run dev` |
| **测试 FastAPI** | **18020** | `uvicorn ... --port 18020` |
| **research-lab** | **25175** | 简易三入口调试页 |
| **research-frontend-test** | **25176** | 科研工作台测试版 UI |

配置模板：

- 端口：[`research-test.ports.env.example`](./research-test.ports.env.example) → `research-test.ports.env`
- **LLM / OpenAlex（仅测试栈）**：[`research-test.env.example`](./research-test.env.example) → `research-test.env`

```bash
cp dev/research-test.env.example dev/research-test.env
# 编辑 LLM_PROVIDER、QWEN_API_KEY（或 LLM_API_KEY）、OPENALEX_EMAIL
bash dev/sync-research-test-env.sh   # 可选：写入 backend/.env 供非脚本启动时使用
```

启动脚本会自动 `source` 上述文件，**无需改**正式版 `server/.env.example` / `backend/.env.example`。

**LLM / 图片（测试栈说明）**

| 能力 | 配置位置 | 说明 |
|------|----------|------|
| Idea / Plot(LLM) | `dev/research-test.env` | 与主站 `server/.env.local` 规则相同，注入 FastAPI :18020 |
| BFF 鉴权等 | `server/.env.local` | 测试时 `PORT=13001` 由启动脚本设置 |
| 模板作图 | — | matplotlib，**不需要** `IMAGE_*` / `DRAW_GATEWAY_*` |
| Feed 排序 | — | 纯规则，无 LLM |

## Conda 环境（FastAPI 后端，首次必做）

使用独立环境 **`aios-research-backend`**（Python 3.11），不要用系统 `base` 直接跑服务：

```bash
cd ai-office-web/server
npm run setup:research-conda
# 或: bash dev/setup-research-conda.sh
```

LLM 密钥请写在 `dev/research-test.env`（见上）。自定义 conda 环境名：

```bash
RESEARCH_CONDA_ENV=my-env bash dev/setup-research-conda.sh
```

## 一键启动测试栈（推荐一条命令）

```bash
# 当前目录应为仓库内的 ai-office-web/server（不要重复 cd ai-office-web/server）
npm run dev:research-test-stack
```

等价于脚本 [`start-research-test-stack.sh`](./start-research-test-stack.sh)，会依次拉起：

1. FastAPI **18020**
2. Express BFF **13001**（`PAPER_REMAKE_BASE_URL=http://127.0.0.1:18020`）
3. 测试 UI **25176**

浏览器打开 http://127.0.0.1:25176 。按 **Ctrl+C** 一次即可停止全部进程。

日志目录（须在 `ai-office-web/server` 下查看）：

```bash
tail -20 dev/.logs/ui.log
```

若端口仍被占用或脚本无法退出：

```bash
npm run stop:research-test-stack
```

可选环境变量（与 [`research-test.ports.env.example`](./research-test.ports.env.example) 一致）：

```bash
RESEARCH_TEST_FASTAPI_PORT=18020 RESEARCH_TEST_BFF_PORT=13001 RESEARCH_TEST_UI_PORT=25176 npm run dev:research-test-stack
```

## 分终端启动（调试用）

```bash
# 1) FastAPI @ 18020
cd ai-office-web/server/backend && uvicorn app.main:app --host 0.0.0.0 --port 18020

# 2) BFF @ 13001
cd ai-office-web/server && PORT=13001 PAPER_REMAKE_BASE_URL=http://127.0.0.1:18020 npm run dev

# 3) UI @ 25176
npm run dev:research-frontend-test

# 或简易 lab @ 25175
npm run dev:research-lab
```

检查端口占用：

```bash
ss -tln | grep -E ':(3001|5173|8020|8021|13001|18020|25175|25176) '
```

**四项测试（PDF Idea / 模板作图 / X Feed 排序 / Science Relay 期刊推荐）**：见 [`docs/RESEARCH_TEST_GUIDE.md`](../docs/RESEARCH_TEST_GUIDE.md)

同步远端 Science Relay 数据：`npm run sync:sciencerelay-data`（需 SSH 到 `ywt@10.26.1.25`）
