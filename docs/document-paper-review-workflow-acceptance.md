# 文稿模块：研究文章 / 文献综述链路验收

## 范围

本轮只恢复 Web 文稿模块中的两条论文链路：

1. **论文/学术文章** → `paper workflow / research`
2. **文献综述** → `paper workflow / review`

二者都不再走普通 `runDocumentGenerate`。

## 代码入口

| 文件 | 作用 |
| --- | --- |
| `src/features/document/services/documentWorkflowGenerateRouter.ts` | 根据 `workflowId` 路由到普通文稿或 paper workflow |
| `src/features/document/services/paperWorkflowAdapter.ts` | Electron 复用 `PaperService`，Web 走 `/api/document/paper-workflow/generate` |
| `server/src/features/document/services/paperWorkflowService.ts` | 服务端 research / review 双链路生成 |
| `server/src/features/document/routes/paperWorkflow.ts` | `POST /api/document/paper-workflow/generate` |
| `src/features/document/components/AICommandBox.tsx` | 文稿助手接入 `runWorkflowGenerate` + paper 状态文案 |
| `src/features/document/workflows/documentWorkflowRegistry.ts` | 学术工作流快捷操作切换到 paper workflow |

## 验收项

- [x] 选择“论文/学术文章”后点击生成，不再调用普通 document generate。
- [x] 请求链路显示 `paper workflow / research`。
- [x] research 输出包含：标题、摘要、关键词、引言、相关研究、研究方法 / 分析框架、结果或分析、讨论、结论、参考文献。
- [x] 选择“文献综述”后点击生成，不再调用普通 document generate。
- [x] 请求链路显示 `paper workflow / review`。
- [x] review 输出包含：文献检索与筛选说明、研究脉络、主题分类、代表性研究、争议与不足、未来研究方向、参考文献。
- [x] 两种结果都进入当前 A4 编辑器。
- [x] 前端打字机效果保留。
- [x] 下载 Word 继续基于当前编辑器内容导出。
- [x] `npm run check:boundaries` 通过。
- [x] `npm run build:web` 通过。
- [x] `cd server && npm run build` 通过。

## 说明

- Web 端当前 diagnostics 使用 `paper-workflow-web-adapter`，明确表示这是服务端 paper workflow 适配链路，而不是普通 document generate。
- Electron 端优先复用 `PaperService.generatePaper / submitTask / getTaskResult`。
- 学术快捷操作（研究文章 / 论文大纲 / 摘要 / 引言 / 研究方法 / 结论 / 综述大纲 / 研究脉络 / 代表性研究 / 争议点 / 未来方向）都会带着当前 `workflowId` 进入 paper workflow router。 
