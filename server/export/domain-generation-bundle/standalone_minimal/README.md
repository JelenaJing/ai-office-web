# 域生成接口 — 独立最小运行包

从 `paper-remake-service` 拆出，仅包含 `POST /api/v1/remake/domain`（含 `stream`）及拉取生成图所需的 `GET /api/v1/paper/.../files`。

## 运行

```bash
cd standalone_minimal
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 填写 DEEPSEEK_API_KEY 等
uvicorn app.main:app --host 0.0.0.0 --port 8020
```

需在本机或 `DRAW_GATEWAY_BASE_URL` 可访问处运行 **grsai-draw-gateway**。

## 接口

- `POST /api/v1/remake/domain` — 见上级 `docs/domain_generation_handover.md`
- `GET /api/v1/paper/{project_id}/files/...` — 元数据与下载

数据目录默认：`standalone_minimal/data/projects/`。
