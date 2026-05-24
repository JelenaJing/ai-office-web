# HTML 文稿引擎 — 设计说明与能力边界

> 最近更新：2026-05-24  
> 对应模块：`src/features/document/`  
> 核心组件：`DocumentWorkbench`, `DocumentCommandEngine`, `DocumentArtifact`

---

## 一、模块定位

HTML 文稿引擎不是 Word 替代品，也不是普通的富文本编辑器。它的定位是：

**HTML + DocumentArtifact + AI block patch 驱动的文稿工作台**

核心设计理念：
- 文档数据源是结构化的 `DocumentArtifact`，而不是一整段 HTML 字符串。
- 每个段落、标题、列表项、表格都有稳定的 `blockId`，AI 修改只针对特定 block，不替换全文。
- 用户通过自然语言指令驱动编辑，后端/前端执行 patch，而不是重新生成整篇文档。

---

## 二、已支持能力

### 2.1 编辑器 UI

| 能力 | 状态 |
|---|---|
| A4 白纸 HTML 编辑区，灰色背景 + 页边距 + 阴影 | ✅ 可用 |
| 标题、正文、列表、表格、引用基础样式 | ✅ 可用 |
| 左侧目录 / 模板 / 知识库面板 | ✅ 可用 |
| 右侧 AI 修改面板，显示上一次操作状态 | ✅ 可用 |
| 顶部工具栏：引擎标签、模板、知识库数量、保存状态 | ✅ 可用 |
| 底部 AI 指令输入框 | ✅ 可用 |

### 2.2 DocumentArtifact 结构

```ts
DocumentArtifact = {
  id, type: 'document', title,
  html,                          // A4 页面 HTML（展示用）
  canonicalData: {
    blocks: DocumentCanonicalBlock[],  // 每个 block 有稳定 id
    sections, outline, references, citations
  },
  references, citations,
  exportPaths: { docx?, pdf? }
}
```

每个 `DocumentCanonicalBlock` 包含：
- 稳定 `id`（即 `blockId`）
- `type`: `title | heading | paragraph | list-item | table | image | divider | quote`
- `html`：当前渲染 HTML（含高光等格式标记）
- `citationIds`：关联的引用 ID 列表

### 2.3 对话式 AI 指令

通过底部指令框输入自然语言，`DocumentCommandEngine` 解析并执行：

| 指令示例 | 操作类型 | 是否调用 AI |
|---|---|---|
| 帮我给第一段高光 | 格式 (format) | ❌ 不调用 |
| 把第二段翻译成英文 | 语义 (semantic) | ✅ 调用 `edit-text` |
| 把第二段改得更正式 | 语义 (semantic) | ✅ 调用 `edit-text` |
| 给政策依据部分加引用 | 引用 (add_citation) | ❌ 规则插入 |
| 撤销上一次操作 | 快照撤销 | ❌ 不调用 |

所有语义操作通过 `blockId` 定位目标 block，返回 patch，**不替换全文 HTML**。

### 2.4 保存与恢复

- 自动 debounce 保存到 `localStorage`：`document-workbench:${workspacePath}`
- 同时保存 `aios_document_editor_draft` 作为跨路径备用
- 恢复时优先使用 `blocks` 数量较多的存储项
- 重新进入工作台后 `html`、`canonicalData.blocks`、`citations`、`references` 完整恢复
- `blockId` 跨会话稳定，不重新生成

### 2.5 PDF 导出

- 点击"导出 PDF"打开新窗口，包含 A4 样式打印页
- 使用浏览器原生打印 / `window.print()`
- PDF 保留标题、正文、高光、引用编号

### 2.6 DOCX 导出

分两条路径：

| 路径 | 条件 | 质量 |
|---|---|---|
| 服务端导出（`exportDocumentArtifact`） | 有 `documentId` | 高（OOXML pipeline） |
| 浏览器本地导出（`downloadDocxFromArtifact`） | 有内容即可 | 基础（html-docx-js） |

客户端 DOCX 支持的 block 类型：
`title`, `heading`, `paragraph`, `list-item`, `table`, `image`（占位符）, `divider`, `citation inline`（`<sup>`）, `references`

---

## 三、不支持 / 暂不承诺的能力

| 能力 | 说明 |
|---|---|
| Word 无损双向编辑 | 不做。DOCX 导入转 HTML 是单向转换，格式会丢失。 |
| 复杂页眉页脚 | 服务端 OOXML pipeline 支持，客户端导出不支持。 |
| 修订模式 / Track Changes | 不支持。 |
| 多人实时协同 | 不支持。 |
| 图片嵌入 DOCX | 客户端导出只输出占位文字；服务端导出支持。 |
| 复杂表格合并单元格 | 客户端导出不支持；服务端部分支持。 |

---

## 四、入口统一

所有文稿入口（新建文稿、模板生成、邮件转文稿、知识库生成）都进入同一个 `DocumentWorkbench`：

```
src/features/document/components/DocumentWorkbench.tsx   ← 核心工作台
src/features/document/components/WebDocumentWorkbench.tsx ← Web 薄壳
src/modules/document/components/WebDocumentWorkbench.tsx  ← 模块出口
src/components/WorkspaceViewportHost.tsx                   ← 路由到此
```

旧入口兼容层：
- `src/features/document/components/WebWritingPanel.tsx` → 直接 re-export `DocumentWorkbench`

---

## 五、运行验收命令

```bash
# 构建前端
npm run build:web

# 构建服务端
cd server && npm run build && cd ..

# E2E 回归（Playwright）
npm run test:e2e:document

# DOCX HTML 生成 smoke test（24 assertions）
npm run smoke:document-artifact-docx-export

# DOCX Blob 内容 smoke test（13 assertions）
npm run smoke:document-artifact-docx-blob
```

---

## 六、技术债说明

### html-docx-js (public/html-docx.js)

- **来源**：`node_modules/html-docx-js/dist/html-docx.js` 的逐字拷贝
- **许可证**：MIT，Copyright (c) 2014 Evidence Prime, Artur Nowak
- **为什么在 public/**：该 UMD bundle 包含 legacy `with` 语句，Vite 5 / Rollup 的 Rust AST 解析器无法处理，直接 import 会导致构建失败。绕过方式是在运行时通过 `<script src="/html-docx.js">` 注入，绕过打包流程。
- **迁移建议**：后续将 DOCX 生成移到服务端 `/api/documents/export-docx`，复用现有 OOXML pipeline，彻底移除此文件。详见 `src/features/document/services/documentArtifactToDocx.ts` 顶部注释。

---

## 七、相关文件

```
src/features/document/
├── components/
│   ├── DocumentWorkbench.tsx         # 核心工作台（状态、命令路由、导出）
│   ├── DocumentEditorCanvas.tsx      # A4 HTML 编辑区
│   ├── DocumentTopToolbar.tsx        # 顶部工具栏
│   ├── DocumentOutlinePanel.tsx      # 左侧目录
│   ├── DocumentTemplatePanel.tsx     # 左侧模板
│   ├── DocumentKnowledgePanel.tsx    # 左侧知识库
│   ├── DocumentAiEditPanel.tsx       # 右侧 AI 面板
│   └── WebDocumentWorkbench.tsx      # Web 薄壳
├── services/
│   ├── documentWorkbenchApi.ts       # 类型定义 + API 调用
│   ├── documentDraftTransforms.ts    # HTML ↔ canonicalData 互转
│   ├── documentCommandEngine.ts      # 指令解析 + target 解析
│   ├── documentPatchApplier.ts       # patch 应用 + 格式 undo
│   └── documentArtifactToDocx.ts    # 客户端 DOCX 导出
tests/e2e/
└── document-command-workflow.spec.ts # E2E 回归测试
build/
├── run-document-artifact-docx-export-smoke.ts  # HTML 生成 smoke
└── run-document-artifact-docx-blob-smoke.ts    # Blob 内容 smoke
public/
└── html-docx.js                       # html-docx-js UMD（见技术债说明）
```
