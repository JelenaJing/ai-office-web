# 全文 CoRemake（Full-paper CoRemake）交接说明

本文档面向将 **paper-remake-service** 接入本地/离线软件栈的开发者，说明「一键全文 remake」的能力边界、API、数据流与落盘位置。

## 功能概述

用户上传论文并创建项目后，可触发 **全文 CoRemake**：在确保 **全文已清洗**（`cleaned_text.txt` 缓存）的前提下，**并行**运行多条耗时子任务（标题/摘要、Introduction 顶刊重写、理论全文分段分析、实验提取 + 重设计），再 **串行** 生成 Methods 正文、与 Methods 对齐的合成 Results、Theory 论文体例、Conclusion，最后组装为 **单份 Markdown 论文**（**不含图片**）。

- 论文标题行格式：`# [CoRemake] {原标题}`（原标题由模型从清洗后全文抽取，失败时有启发式回退）。
- 章节顺序：`Abstract` → `Introduction` → `Methods` → `Results` → `Theory` → `Conclusion` → `References`。
- **失败降级**：任一子任务失败会写入 `errors[]`，对应章节用独立 LLM 降级生成，保证文档结构完整。

## 与现有模块的关系

| 能力 | 复用代码 |
|------|-----------|
| 全文清洗 | [`PaperProcessor.get_paper_text(..., variant="cleaned")`](../backend/app/services/paper_processor.py) |
| Introduction | [`extract_introduction_from_full_text`](../backend/app/agents/introduction_remaker.py) + [`remake_introduction`](../backend/app/agents/introduction_remaker.py)（**编排层使用清洗后全文**，`auto_extract_intro=False`） |
| 理论全文 | [`run_analyze_theory_fulltext`](../backend/app/services/theory_fulltext_merge.py)（与 `/remake/theory/fulltext` 同源） |
| 实验 | [`experiment_extractor`](../backend/app/agents/experiment_extractor.py) + [`experiment_designer`](../backend/app/agents/experiment_designer.py) |
| 新增强调章节 | [`backend/app/services/full_paper_remake/`](../backend/app/services/full_paper_remake/) 内 `title_abstract`、`methods_prose`、`results_synthetic`、`theory_prose`、`conclusion_writer`、`paper_assembler`、`fallbacks` |

编排入口：[`execute_full_paper_coremake` / `stream_full_paper_remake_sse`](../backend/app/services/full_paper_remake/orchestrator.py)。

## HTTP API

### SSE（推荐，长任务）

- **路径**：`POST /api/v1/remake/full-paper-remake/stream`
- **Content-Type**：`application/json`
- **Accept**：`text/event-stream`
- **事件**（与现有 remake 流式一致）：
  - `event: meta` — `stage: cleaning` → `parallel_start` → `parallel_complete`（含各并行任务状态）；之后多次 `stage: streaming_section` + `section`（如 `title`、`abstract`、`introduction`、`methods`、`results`、`theory`、`conclusion`、`references`），Abstract/Methods/Results/Theory/Conclusion 及 Intro 降级等为 **LLM 真流式** token；标题与成功时的 Introduction、References 为分块推送。
  - `event: delta` — 论文章节正文片段，按顺序拼接即为完整 Markdown（与 `done.markdown` 一致）。
  - `event: meta` — 结束前 `stage: assembly_complete`
  - `event: done` — JSON：`status`, `message`, `markdown`, `errors`, `sections`, `parallel_jobs`
  - `event: error` — 单行错误信息

**请求体**（[`FullPaperRemakeRequest`](../backend/app/models.py)）：

```json
{
  "project_id": "<8位项目ID>",
  "force_reclean": false,
  "max_papers_for_llm": 72,
  "context": null,
  "target_chars": 6000,
  "overlap_chars": 300
}
```

- `force_reclean`: 为 `true` 时强制重新生成 `original/cleaned_text.txt`（LLM 清洗，较慢）。
- `max_papers_for_llm` / `context`：透传 Introduction 文献池与重写；池不足时 Intro 会失败并走降级（无顶刊池的 Introduction + OpenAlex 参考文献回退）。

### JSON（单次返回）

- **路径**：`POST /api/v1/remake/full-paper-remake`
- **响应**（[`FullPaperRemakeResponse`](../backend/app/models.py)）：`markdown`, `errors`, `sections`, `parallel_jobs`, `status`。

前端封装：[`remakeAPI.fullPaperRemake`](../frontend/src/services/api.ts)；流式示例：[`FunctionPanel` 中 `full-paper-remake`](../frontend/src/components/Sidebar/FunctionPanel.tsx)。

## 项目目录落盘

- 完整任务结果（JSON，含 `markdown`、`errors`、并行任务摘要）：通过 [`ProjectManager.save_remake_result(..., "full_paper_remake", ...)`](../backend/app/project_manager.py) 写入  
  `{project_dir}/drafts/full_paper_coremake_YYYYMMDD_HHMMSS.json`
- 子任务仍各自落盘（如 `remakes/introductions/`、`remakes/theory/` 等），行为与单独点击功能一致。

## 并行与依赖说明

- **并行**：标题/摘要管道、Introduction、理论全文、实验链在 `asyncio.gather` 中同时启动（阻塞 LLM 调用经 `asyncio.to_thread` 包装）。
- **屏障**：Results 必须在 Methods 生成之后；Conclusion 在 Results 与 Theory 成段之后。
- **Abstract 与 Introduction**：按产品要求 Abstract 在文档中排在 Introduction 前；Abstract 不等待 Introduction 完成，以保证并行度（可能与后文略有出入，属设计取舍）。

## 本地化 / 离线整合建议

1. **模型与密钥**：全流程依赖 `app.config` 中的 DeepSeek（OpenAI 兼容）配置；离线环境需替换为本地推理服务并保持接口兼容。
2. **OpenAlex**：Introduction 与参考文献降级依赖网络；离线应 mock `search_reference_pool` 或预置文献池。
3. **超时**：流式客户端建议 ≥ 30 分钟超时（与 Introduction / 理论全文量级一致）。
4. **不依赖**：本功能不调用绘图、DeepSyn 可视化；无需 plot-agent。

## 维护扩展点

新增章节或调整顺序：改 [`paper_assembler.assemble_paper_markdown`](../backend/app/services/full_paper_remake/paper_assembler.py) 与 [`orchestrator.execute_full_paper_coremake`](../backend/app/services/full_paper_remake/orchestrator.py) 的组装段即可；保持子模块单文件职责，避免把提示词堆进路由。
