# MiniMax DOCX Skill（本地接入说明）

- 来源：`https://github.com/MiniMax-AI/skills/tree/main/skills/minimax-docx`
- 本地 vendoring 路径：`server/src/features/document/skills/minimax-docx/`
- 当前保留内容：
  - `SKILL.md`
  - `scripts/`
  - `references/`

## 接入方式

本仓库没有直接执行 upstream skill 中的 .NET CLI，而是：

1. 将官方 `SKILL.md` 与关键 `references/` 作为本地 document engine 的规则与提示上下文；
2. 在 `server/src/features/document/services/minimaxDocxRunner.ts` 中读取这些文件；
3. 通过统一的 `DocumentDraft -> DOCX artifact` 流程生成、编辑并导出文稿；
4. 以 `skillId = minimax.docx`、`engine = minimax_docx` 注册到本地服务。

这样可以保证：

- Web 端真实走统一的文稿 skill 链路；
- 生成结果可预览、可章节级 AI 修改、可下载 DOCX；
- fallback 行为由 `DOCUMENT_ENGINE` / `DOCUMENT_ENGINE_FALLBACK` 控制。
