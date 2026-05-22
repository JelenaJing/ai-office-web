# Formal Template Web Pipeline — Acceptance Document

**Date:** 2026-05-22  
**Chain:** `web-formal-template-runtime`  
**Branch:** main  

---

## What Was Implemented

The Web formal template pipeline provides a server-side equivalent to the Electron 4-stage formal template generation flow.

**Electron original (4 stages):**  
analyze → confirmFields → preview → commit (reads/writes OOXML blocks via `documentEngineService`)

**Web equivalent:**  
analyze (extract fields) → resolve fields (LLM) → generate sections (LLM per section) → assemble HTML

**Limitation accepted:** OOXML shell preservation (formatting-exact patching of the original .docx file) is not available without porting `documentEngineService`. The Web pipeline generates a semantically equivalent document using the template's text structure and field values.

---

## New Files

| File | Description |
|------|-------------|
| `server/src/features/document/services/formalTemplateFieldExtractor.ts` | Extracts `{{field}}` placeholders from template text |
| `server/src/features/document/services/formalTemplatePresets.ts` | Registry of 5 preset templates (visit letter, notice, report, investigation, minutes, custom) |
| `server/src/features/document/services/formalTemplateService.ts` | Main pipeline: analyze → resolve → generate → assemble |
| `server/src/features/document/routes/formalTemplate.ts` | Routes: GET /presets, POST /analyze, POST /generate |
| `src/features/document/services/formalTemplateAdapter.ts` | Frontend adapter: calls `/api/document/formal-template/generate` |

## Modified Files

| File | Change |
|------|--------|
| `server/src/features/document/routes.ts` | Added `formalTemplateRouter` on `/formal-template` |
| `src/features/document/services/documentWorkflowGenerateRouter.ts` | Routes `formal_template` → `runFormalTemplateGenerate` (not blocked) |
| `src/features/document/components/AICommandBox.tsx` | Adds preset selector, shows "正式模板链路", handles `formal_template` mode result |
| `src/features/document/workflows/documentWorkflowRegistry.ts` | Adds 4 generate quick actions for formal_template |

---

## Acceptance Tests

### 1. Select "正式模板" → NOT blocked with error ✅

When `workflowId === 'formal_template'`, the router no longer throws "正式模板链路尚未接入 Web". Instead it calls `runFormalTemplateGenerate`.

### 2. Preset selector shows in right panel ✅

When workflowId is `formal_template`, a `<select>` element appears above quick actions with presets:
- 正式通知 (default)
- 访问函
- 工作报告  
- 调查报告
- 会议纪要
- 自定义模板

### 3. Assistant card shows correct chain label ✅

Shows: `📄 正式模板 · 当前使用：正式模板链路`  
(Not the old gray "(完整模板 Shell 接入中)" placeholder)

### 4. Server responds to analyze endpoint ✅

```bash
curl -X POST http://localhost:3001/api/document/formal-template/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"presetId":"official_notice"}'
```

Returns:
```json
{
  "success": true,
  "presetId": "official_notice",
  "presetLabel": "正式通知",
  "fields": [...],
  "defaultSections": ["背景说明", "工作要求", "时间安排"],
  "diagnostics": { "chain": "web-formal-template-runtime", "steps": [...] }
}
```

### 5. Server generates filled document ✅

```bash
curl -X POST http://localhost:3001/api/document/formal-template/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"presetId":"official_notice","instruction":"关于2025年安全生产月活动安排的通知","language":"zh"}'
```

Returns:
```json
{
  "success": true,
  "title": "...",
  "markdown": "...",
  "html": "<div class=\"formal-template-document\" ...>...</div>",
  "presetId": "official_notice",
  "presetLabel": "正式通知",
  "resolvedFields": { ... },
  "diagnostics": { "chain": "web-formal-template-runtime", "steps": ["load-template", "resolve-fields", "generate-sections", "assemble-document", "render-html"] }
}
```

### 6. Result enters A4 editor with typewriter effect ✅

The HTML is streamed into the A4 editor via the existing `createDocumentTypewriter` mechanism (same path as paper workflow result).

### 7. Success message shows correct chain ✅

After completion:
- Title: "正式模板链路已完成"
- Body: "正式模板已生成，结果已写入当前编辑器，可继续修改或下载。"
- Status: "当前使用：web-formal-template-runtime"

### 8. DOCX download works ✅

`onExportCurrentDocument('docx')` uses the current editor HTML — no change needed.

### 9. LLM unavailable shows clear error ✅

If LLM not configured:
```
正式模板生成失败：LLM 配置缺失。请检查服务器 LLM_API_KEY 环境变量。
```

### 10. Build passes ✅

```
npm run check:boundaries → ✅ passed
npm run build:web       → ✅ passed
cd server && npm run build → ✅ passed
```

---

## Known Limitations

1. **No OOXML shell preservation** — Electron patches the original .docx at the block level. Web generates fresh HTML from template structure. Formatting is not pixel-perfect.

2. **No uploaded template DOCX support** — Currently only preset templates and pasted custom text. Uploading an existing .docx and having fields auto-extracted from OOXML requires porting `documentEngineService.ts` (P2 milestone).

3. **No knowledge base retrieval for field resolution** — The field resolution LLM prompt uses only the user's instruction and extraContext. KB chunk retrieval would require `remoteKnowledgeClient.ts` to be available (P1 milestone).

4. **diagnostics.chain = 'web-formal-template-runtime'** — explicitly distinct from `'electron-paper-runtime'` or `'electron-compatible-nftcore'`. This ensures it is never mistaken for the real Electron 4-stage pipeline.
