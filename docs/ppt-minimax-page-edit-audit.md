# PPT MiniMax 页面级修改审计

## 1. 当前 PPT 后端 API 清单

| API | 作用 | 当前状态 |
| --- | --- | --- |
| `POST /api/ppt/decks/start` | 创建异步 PPT 任务，走 `builtin` 或 `minimax_pptx_generator` | 已返回 `taskId`，任务完成后带 `deck / artifact / exportUrl / previewImages` |
| `GET /api/ppt/decks/tasks/:taskId` | 查询任务进度与结果 | 已对 `completed` 结果做结构校验，异常会转 `failed` |
| `POST /api/ppt/decks/tasks/:taskId/cancel` | 取消运行中的 PPT 任务 | 保留内存态 `deckTaskStore` 兼容实现 |
| `GET /api/ppt/decks/:deckId` | 读取当前 `WebDeckDocument` | 返回当前 deck 内容 |
| `POST /api/ppt/decks/:deckId/retemplate` | 零 token 切换模板并重新渲染 | 已重新导出 PPTX、刷新 `artifact / exportUrl / previewImages` |
| `POST /api/ppt/decks/:deckId/slides/:slideId/edit` | 单页 AI 修改 | 默认跟随 `runtimeMeta.engine`，前端默认强制 `engine=minimax_pptx_generator` 且 `allowFallback=false` |
| `POST /api/ppt/decks/:deckId/export` | 导出当前 deck 最新 PPTX | 会更新 `artifact / exportUrl / previewImages` |
| `GET /api/ppt/decks/:deckId/download` | 下载当前 deck 最新导出结果 | 优先走 runtime meta 中最新 `exportUrl` |

## 2. 当前前端 PPT 组件清单

| 组件 | 角色 |
| --- | --- |
| `PptWorkbenchPanel` | Web PPT 主工作台入口，组合工具栏、缩略图、画布和 AI 面板 |
| `PptEditorShell` | 三栏编辑壳层，管理当前页、AI 面板开合与 props 分发 |
| `PptAiEditPanel` | 页面级 AI 修改输入区，展示当前页与修改引擎 |
| `PptCanvasPreview` | 中间 16:9 大画布，优先显示 `previewImageUrl / imagePath` |
| `PptSlideNavigator` | 左侧缩略图导航，优先显示真实预览图 |
| `PptTopToolbar` | 顶部工具栏，展示生成引擎、当前页、当前模板、页面修改引擎、下载/模板切换 |
| `ResultPreviewPanel` | Web PPT 结果编排层，负责生成、轮询、模板切换、单页修改、下载和状态同步 |

## 3. 当前 MiniMax PPTX Generator 使用路径

### 生成 PPT

- `server/src/features/ppt/routes.ts` 中 `resolvePptEngine()` 默认返回 `minimax_pptx_generator`。
- 仅当 `PPT_ENGINE=builtin` 时才强制走内置引擎。
- `runMinimaxPptxGenerator()` 会生成真实 PPTX artifact，并补齐 `previewImages`。
- 当 `PPT_ACCEPTANCE_MODE=1` 时，仍然走 MiniMax 路径，但不依赖外部 LLM，固定生成 5 页稳定 deck。

### 单页编辑

- `POST /api/ppt/decks/:deckId/slides/:slideId/edit` 默认使用当前 `deck runtimeMeta.engine`。
- 前端 Web 路径默认显式发送：
  - `engine: "minimax_pptx_generator"`
  - `allowFallback: false`
- 如果最终走 MiniMax：
  - 必须调用 `editSlideWithMinimaxPptxGenerator()`；
  - 返回 `skillId: "minimax.pptx-generator"`；
  - 返回 `changedSlideIds / unchangedSlideIds`；
  - 若非目标页发生变化，会报错：`页面级修改越界：非目标页发生变化。`
- 只有请求体显式 `allowFallback=true` 时，MiniMax 失败才允许退回 builtin。

### 导出

- `POST /api/ppt/decks/:deckId/export` 根据当前 engine 导出。
- 若当前 engine 为 `minimax_pptx_generator`，导出仍走 MiniMax PPTX Generator 路径。
- 导出完成会更新最新 `artifact / exportUrl / previewImages`。

### fallback 条件

- **生成阶段**：仍受 `PPT_ENGINE_FALLBACK` 控制；默认可从 MiniMax 回退到 builtin。
- **单页编辑阶段**：不再静默 fallback；只有 `allowFallback=true` 才允许回退 builtin。

## 4. 当前缺口 / 审计结论

### 修复前的关键缺口

1. 单页编辑没有强制 MiniMax 契约，失败时可能被模糊处理。
2. 缺少“只允许目标 slideId 变化”的边界校验。
3. 页面级编辑结果没有稳定返回 `skillId / changedSlideIds / unchangedSlideIds`。
4. 前端未明确展示“当前页修改引擎”。
5. 下载入口未确保始终命中最新 artifact。
6. 缺少浏览器可复现的 MiniMax 验收模式。

### 本轮已补齐的闭环

1. 单页编辑默认以 MiniMax 为主，并显式禁止静默 fallback。
2. `editSlideWithMinimaxPptxGenerator()` 会在导出前校验仅目标页可变。
3. 编辑成功后会刷新 `artifact / exportUrl / previewImages`，下载指向最新版本。
4. 右侧 AI 面板与顶部工具栏已显示当前页和页面级修改引擎。
5. 新增 `PPT_ACCEPTANCE_MODE=1`，可稳定生成 5 页 deck，并用确定性规则修改单页。

### 仍需用浏览器验收确认的点

1. 第 3 页修改后，前端显示和接口返回的 `changedSlideIds` 必须只包含目标页。
2. 点击下载时必须命中最新 `artifact / exportUrl`。
3. `PPT_ACCEPTANCE_MODE=1` 下的真实页面交互、截图和下载链路需要 Playwright 跑通确认。
