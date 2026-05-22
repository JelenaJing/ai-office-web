# Document Editor AI Assistant & Download — 验收文档

版本：v1.2  分支：feat/module-boundary-contracts

## 功能概要

### 一、右侧 AI 文稿助手 (AICommandBox)

右侧面板已升级为真正的"AI 文稿助手"，根据文稿状态智能展示建议并提供快捷操作。

### 二、文稿界面直接下载

顶部工具栏和生成完成卡片均可直接下载当前文稿，无需去资源中心。

---

## 验收项

### AI 文稿助手 — 状态感知

- [ ] 空文稿时，右侧显示状态标签"空文稿"，提示"可以生成初稿"
- [ ] 有正文时，显示"已有正文"，提示"可以继续写、优化全文、生成摘要"
- [ ] 有选区时，显示"已选中内容"，提示"可以优化选中内容"

### AI 文稿助手 — 快捷操作

- [ ] "生成正式通知"按钮可点击，正文空时也可用
- [ ] "继续写"按钮，空文稿时 disabled
- [ ] "优化全文"按钮，空文稿时 disabled
- [ ] "改成正式语气"按钮，空文稿时 disabled
- [ ] "提取大纲"按钮，空文稿时 disabled
- [ ] "生成摘要"按钮，空文稿时 disabled
- [ ] 点击任意快捷操作后，进入执行状态并显示结果

### AI 文稿助手 — 输入框

- [ ] placeholder 显示："告诉我你想怎么改这篇文稿，例如：改得更正式、补充背景、生成结尾。"
- [ ] 发送按钮正确触发 AI 执行
- [ ] 不允许空指令发送（显示提示）

### 生成完成卡片

- [ ] 生成初稿完成后，右侧出现绿色操作卡片
- [ ] 卡片标题：**初稿已生成**
- [ ] 卡片文案："你可以继续修改，或直接下载当前文稿。"
- [ ] 卡片包含以下按钮：
  - [ ] 下载 Word
  - [ ] 下载 Markdown
  - [ ] 下载 HTML
  - [ ] 优化全文
  - [ ] 继续修改
- [ ] 停止生成时，卡片显示"已完成：停止生成"

### 顶部工具栏下载

- [ ] 顶部按钮：**下载 Word** — 点击后调用导出 skill，浏览器自动下载 .docx
- [ ] 顶部按钮：**下载 Markdown** — 点击后导出并下载 .md
- [ ] 顶部按钮：**下载 HTML** — 点击后以 Blob 方式下载 .html
- [ ] 顶部按钮：**PDF（暂未开放）** — 点击后显示降级提示，不静默失败
- [ ] 下载按钮导出中显示"正在生成 Word…"等状态
- [ ] 下载成功后状态栏显示"Word 已下载"类提示

### 下载内容正确性

- [ ] Word 内容包含当前编辑器最新正文（非空，非旧版本）
- [ ] Markdown 内容与编辑器正文一致
- [ ] HTML 内容与编辑器正文一致
- [ ] 打字机生成完成后立即下载，内容包含完整初稿

### 不依赖资源中心

- [ ] 不需要点击"资源中心"或"下载最近"才能下载文稿
- [ ] 生成完成后一步即可下载
- [ ] 下载失败显示具体错误，不静默失败

### 草稿持久化

- [ ] 生成/编辑后自动保存到 localStorage
- [ ] 顶部显示"已保存 / 保存中 / 草稿已恢复"
- [ ] 刷新页面后草稿恢复，状态显示"草稿已恢复"

---

## 技术实现

| 功能 | 文件 |
|------|------|
| AI 助手状态感知 | `AICommandBox.tsx` — `assistantState` useMemo |
| 快捷操作 | `AICommandBox.tsx` — `handleQuickAction` |
| 生成完成卡片 | `AICommandBox.tsx` — `ActionCard` / `finishStreamingDraft` |
| `onExportRequest` prop | `AICommandBox.tsx` — 可选别名，降级到 `onExportCurrentDocument` |
| 顶部下载按钮 | `WordLikeDocumentEditor.tsx` — TopBar |
| 导出实现 | `docxWebGeneration.ts` — `exportAndDownloadCurrentDocument` |
| HTML Blob 下载 | `docxWebGeneration.ts` — `triggerBrowserDownload` |
| 草稿持久化 | `WordLikeDocumentEditor.tsx` — localStorage + `SaveBadge` |

---

## 构建状态

- `npm run check:boundaries`: ✅ 0 violations
- `npm run build:web`: ✅
- `cd server && npm run build`: ✅
