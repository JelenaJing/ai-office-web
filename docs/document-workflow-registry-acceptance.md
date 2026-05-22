# 文稿工作流注册表验收文档

## 功能描述

Web 文稿模块新增文稿类型注册表，支持 10 种文稿类型。每种类型有独立的快捷操作、大纲结构和 AI 生成提示，最终都进入同一个 A4 编辑器。

## 实现文件

| 文件 | 说明 |
|------|------|
| `src/features/document/workflows/documentWorkflowRegistry.ts` | 工作流注册表：10 种类型定义 + 快捷操作配置 |
| `src/features/document/components/WordLikeDocumentEditor.tsx` | 新增"文稿类型"下拉选择器 |
| `src/features/document/components/AICommandBox.tsx` | 快捷操作按钮随文稿类型切换 |
| `src/features/document/services/documentEditSkills.ts` | `DocumentGenerateInput` 新增 `workflowId / workflowLabel / workflowFields / outlineSections / documentKind` |
| `server/src/features/document/services/documentGenerationTypes.ts` | `DocumentTypePreset` 新增 `outlineSections / documentKind` |
| `server/src/features/document/services/writingPromptRecipes.ts` | `buildDocumentTypePresetHint` 支持 `outlineSections / documentKind / label` |

## 支持的文稿类型

| ID | 中文名 | 分类 | 快捷操作数 |
|----|--------|------|-----------|
| `general` | 普通文稿 | 通用 | 6 |
| `formal_notice` | 正式通知 | 公文 | 4 |
| `work_summary` | 工作总结 | 报告 | 4 |
| `request_application` | 请示/申请 | 公文 | 4 |
| `research_report` | 调研报告 | 报告 | 4 |
| `meeting_minutes` | 会议纪要 | 公文 | 4 |
| `news_article` | 新闻稿/公众号稿 | 通用 | 4 |
| `academic_paper` | 论文/学术文章 | 学术 | 5 |
| `literature_review` | 文献综述 | 学术 | 4 |
| `formal_template` | 正式模板 | 模板 | 4 |

## 验收项

### UI 入口

- [x] 顶部工具栏显示"文稿类型"下拉，含分组（通用 / 公文 / 报告 / 学术 / 模板）
- [x] 默认选中"普通文稿"
- [x] "文稿类型"选择器和"模板"选择器并列，互不干扰
- [x] 切换文稿类型不清空编辑器内容

### 快捷操作切换

- [x] 选择"论文/学术文章"后，右侧快捷操作变为：生成论文初稿 / 生成摘要 / 扩写引言 / 生成文献综述 / 生成结论
- [x] 选择"正式通知"后，快捷操作变为：生成正式通知 / 补充背景说明 / 生成落款 / 优化全文
- [x] 选择"工作总结"后，快捷操作变为：生成工作总结 / 提取主要成绩 / 补充问题与建议 / 优化全文
- [x] 选择"会议纪要"后，快捷操作变为：生成会议纪要 / 整理决议事项 / 提取行动事项 / 优化格式
- [x] 选择"文献综述"后，快捷操作变为：生成综述初稿 / 整理研究脉络 / 提取争议焦点 / 生成参考文献占位
- [x] 选择"正式模板"时右侧显示"（完整模板 Shell 接入中）"提示，不伪装成普通文稿

### 生成内容结构

- [x] 选择"论文/学术文章"生成后，内容包含：摘要、关键词、引言、文献综述、研究方法、讨论、结论、参考文献占位
- [x] 选择"工作总结"生成后，内容包含：主要工作、取得成果、存在问题、下一步建议
- [x] 选择"文献综述"生成后，内容包含：研究脉络、争议焦点、参考文献占位
- [x] 选择"正式通知"生成后，内容是通知结构（而非工作总结结构）

### 通用功能保持不变

- [x] 所有类型生成后都进入同一个 A4 编辑器
- [x] 生成后打字机效果正常
- [x] 导出 Word / Markdown / HTML 仍然可用
- [x] 不需要去资源中心下载
- [x] 知识库上下文提示正常显示

### 构建

- [x] `npm run check:boundaries` 0 violations
- [x] `npm run build:web` 通过
- [x] `cd server && npm run build` 通过

## 已知限制

- **正式模板 Shell**：`formal_template` 类型目前生成标准格式正文，完整的模板 Shell（套用预设页面布局、表头、签章区）需后续接入 `FormalTemplatePanel`，当前右侧助手已显示"完整模板 Shell 接入中"提示。
- **参考文献**：`academic_paper` / `literature_review` 的参考文献为占位格式，不做真实文献检索。
- **工作流字段表单**：`requiredFields` 定义了工作流所需字段（如通知主题、总结周期），当前版本通过对话式指令输入，结构化表单 UI 为后续迭代。
