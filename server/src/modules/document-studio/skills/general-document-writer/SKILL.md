# general-document-writer

根据 `input/document-request.json` 中的字段生成通用文稿。

输出到 `output/`：
- document.json（含 blockId）
- editor.json（TipTap ProseMirror JSON）
- document.md
- index.html
- result.json

保留输入中的事实，不编造数据。
