# Electron to Web Paper Workflow Parity — Acceptance Criteria

## Implementation Summary

The Web server now runs the NFTCORE pipeline (`electron-compatible-nftcore`) for full paper generation.

---

## Acceptance Checklist

### Research Paper (academic_paper)

- [ ] Selecting "论文/学术文章" calls `POST /api/document/paper-workflow/start` with `paperType: "research"`
- [ ] **Does NOT call** `runDocumentGenerate`
- [ ] Diagnostics `chain` = `"electron-compatible-nftcore"`
- [ ] Right-side panel displays "当前使用：研究文章链路"
- [ ] Generation progress updates shown step-by-step
- [ ] Output contains: 标题, 摘要, 关键词, 引言, 相关研究, 研究方法/分析框架, 结果或分析, 讨论, 结论, 参考文献
- [ ] Completed result enters A4 editor
- [ ] Typewriter effect preserved
- [ ] Download Word uses current editor content

### Literature Review (literature_review)

- [ ] Selecting "文献综述" calls `POST /api/document/paper-workflow/start` with `paperType: "review"`
- [ ] **Does NOT call** `runDocumentGenerate`
- [ ] Diagnostics `chain` = `"electron-compatible-nftcore"`
- [ ] Right-side panel displays "当前使用：综述文章链路"
- [ ] Generation progress updates shown step-by-step
- [ ] Output contains: 文献检索与筛选说明, 研究脉络, 主题分类, 代表性研究, 争议与不足, 未来研究方向, 结论, 参考文献
- [ ] Completed result enters A4 editor
- [ ] Typewriter effect preserved
- [ ] Download Word uses current editor content

### Formal Template (formal_template)

- [ ] Selecting "正式模板" does NOT call `runDocumentGenerate`
- [ ] Error message shown: "正式模板链路尚未接入 Web，当前不能作为普通文稿生成。"

### Other Document Types

- [ ] 普通文稿, 正式通知, 工作总结, 调研报告, etc. still use `runDocumentGenerate`

---

## Build Verification

```
npm run check:boundaries  ✅
npm run build:web         ✅
cd server && npm run build ✅
```

---

## NFTCORE Pipeline Steps Verified

1. ✅ OpenAlex reference search (via `openAlexClient.ts` port)
2. ✅ Dynamic structure planning (LLM JSON via `paperStructurePlanner.ts` port)
3. ✅ Structure thinking pass
4. ✅ Title + abstract (NFTCORE prompt templates)
5. ✅ Keywords generation
6. ✅ Per-section: thinking → body with inline citations
7. ✅ Conclusion generation
8. ✅ Reference list formatting

## Known Differences from Electron Runtime

| Feature | Electron | Web | Notes |
|---------|----------|-----|-------|
| Reference incremental pass | ✅ | ❌ | Future P1 |
| Image generation | ✅ optional | ❌ | Not needed for Web |
| Knowledge tree check | ✅ optional | ❌ | Future P2 |
| Journal category filter | ✅ bundled DB | ❌ skipped | Minor quality impact |
| OOXML snapshot | ✅ | ❌ | Not applicable to Web |
