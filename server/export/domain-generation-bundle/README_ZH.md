# 域生成接口 — 离线打包说明

本目录为 **`POST /api/v1/remake/domain`**（含流式 `stream`）相关代码的额外副本，便于拷贝到其它设备或仓库。

## 目录结构

| 路径 | 说明 |
|------|------|
| `MANIFEST.txt` | 与主仓库文件的对应关系清单 |
| `requirements-minimal.txt` | 仅运行域生成链路所需的 pip 依赖 |
| `docs/domain_generation_handover.md` | API 与配置说明（与主仓库同步副本） |
| `mirror/app/` | 从主仓库复制的模块 + **可选**合并用路由 |
| `standalone_minimal/` | **独立最小服务**：仅需本目录 + `.env` + draw-gateway |

## 方式 A：整文件夹拷走独立运行（推荐）

1. 将 `export/domain-generation-bundle/standalone_minimal` 整个复制到目标机。
2. 按其中 `README.md` 创建虚拟环境、`pip install -r requirements.txt`、配置 `.env`。
3. 启动 `grsai-draw-gateway`，再 `uvicorn app.main:app --host 0.0.0.0 --port 8020`。

数据默认写在 `standalone_minimal/data/projects/`。

## 方式 B：合并进现有 paper-remake-service

1. 用 `mirror/app/` 下文件覆盖或对比合并到 `backend/app/` 对应路径：
   - `agents/domain_generator.py`
   - `services/draw_gateway_client.py`
   - `services/llm_stream.py`
   - `project_manager.py`（若你本地有改动，请用 diff 合并，勿盲目覆盖）
2. `models.py`、`remake.py` 已在主仓库包含域生成字段与路由时，**无需**再使用 `mirror/app/routers/remake_domain_only.py`。
3. 若目标项目**没有** `paper.py` 里的文件接口，可拷贝并注册：
   - `mirror/app/routers/paper_files_for_domain.py`
   - `app.include_router(...)`（见文件头注释）

## 与主仓库的同步

打包为生成时的快照；主仓库演进后如需更新 bundle，可在仓库内重新执行复制步骤或让维护者更新 `export/domain-generation-bundle/`。
