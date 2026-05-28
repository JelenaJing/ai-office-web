# Document Studio · AI 改写模块

## Word 上传（.docx）

AI 改写页面上传 `.docx` 时，服务端使用 [Microsoft MarkItDown](https://github.com/microsoft/markitdown) 提取 Markdown/文本，再进入现有深度改写通道。

### 安装 MarkItDown（手动，不随 npm install 执行）

```bash
pip install 'markitdown[docx]'
# 或完整依赖
pip install 'markitdown[all]'
```

### 检查

```bash
cd server && npm run check:markitdown
```

可选环境变量 `MARKITDOWN_BIN`（默认 `markitdown`）。

### API

- `POST /api/document-studio/humanize/extract-file` — multipart `file`，返回 `{ filename, fileType, text, markdown, warnings }`
- `POST /api/document-studio/humanize/jobs` — 支持 `inputMode: text | document | file`
- `POST /api/document-studio/humanize/export-docx` — 将改写结果导出为 `.docx`（非高保真版式）
