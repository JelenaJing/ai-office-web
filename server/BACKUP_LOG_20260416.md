# 备份记录 - 2026-04-16

## 备份文件

| 原文件 | 备份文件 | 修改内容 |
|--------|----------|----------|
| `backend/app/agents/introduction_remaker.py` | `.bak_20260416` | 语义引用映射 |
| `backend/app/agents/introduction_remaker.py` | `.bak_20260416_fig` | + Timeline 生图 |
| `backend/app/agents/domain_generator.py` | `.bak_20260416` | 参考用 |
| `chat-frontend/src/App.tsx` | `.bak_20260416_fig` | + 图片展示 |

---

## 修改一：语义引用映射（稳定引用位置）

### `backend/app/agents/introduction_remaker.py`

**新增函数：**
- `_extract_semantic_citation_map()` — 用 LLM 从首次生成的 intro 中提取「引用 ↔ 论点」语义映射
- `_build_citation_constraint_block()` — 将语义映射构建为 prompt 约束文本

**修改函数：**
- `_rewrite_intro_llm()` — 新增 `citation_constraint` 参数
- `_rewrite_intro_resolve_remade()` — 透传 `citation_constraint`
- `stream_introduction_remake_sse()` / `remake_introduction()` — 缓存逻辑：
  - 首次 remake：正常检索 pool → 生成 → 提取语义映射 → 保存 `intro_citation_cache.json`
  - 后续 remake：复用缓存的 pool + 语义映射约束

### 缓存文件：`{project_dir}/intro_citation_cache.json`

---

## 修改二：Timeline 发展历程图

### `backend/app/agents/introduction_remaker.py`

**新增函数：**
- `_generate_timeline_prompt_and_caption()` — 根据 remade intro + references 生成：
  - 图片提示词（timeline 发展历程，白底学术风格）
  - Figure caption（overall_description + detail_description，可含引用编号）
- `_generate_timeline_figure()` — 调用 DrawGatewayClient 生成图片并保存

**修改函数：**
- `stream_introduction_remake_sse()` — 在 intro 正文和参考文献生成完后，新增 timeline 图片生成阶段：
  - SSE meta 事件：`stage: "timeline_figure"` → `stage: "timeline_figure_draw"`
  - 生成结果存入 `core["timeline_figure"]` 并包含在 `done` payload 中
  - 图片保存到 `{project_dir}/data/plots/intro_timeline_*.png`

### `chat-frontend/src/App.tsx`

- `handleIntroRemake` onDone — 展示 timeline 图片 + caption
- `handleRemake` onDone — 同上

### `chat-frontend/src/index.css`

- `.message-content img` — 添加图片样式（圆角、边框、阴影）

### SSE done payload 新增字段：
```json
{
  "timeline_figure": {
    "image_prompt": "...",
    "overall_description": "Timeline of research developments in ...",
    "detail_description": "Chronological overview of key milestones ...",
    "image_file_url": "/api/v1/paper/{pid}/files/data/plots/intro_timeline_*.png",
    "draw_task_id": "..."
  }
}
```

### 图片生成提示词特性（参考 CORE-CUHKSZ/textfigure）：
- Timeline progression / chronological development
- Milestone works / segmented format
- 白色背景、学术风格、无文字/数字/符号
- 通过 nano-banana-pro 模型生成，16:9 比例

### 如需重置：
- 删除 `intro_citation_cache.json` → 重新检索文献池 + 重新分析语义映射
- Timeline 图每次 remake 都会重新生成
