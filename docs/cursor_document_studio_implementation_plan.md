# AI Office Web — Document Studio 前后端实现方案（给 Cursor）

> 目标：只实现「文稿生成 / 文稿编辑 / 文稿功能 Skill」这一条主线。  
> 不要复用旧 `DocumentWorkbench` 作为正式主线。  
> 不要把所有能力都交给 OpenCode。  
> 前端统一展示能力，后端按 capability 分发到不同 executor。

---

## 0. 当前最终方案确认

### 产品形态

采用：

```text
递进式创建流程 + TipTap 文稿工作台
```

用户流程：

```text
/document
  ↓
Step 1：选择文稿类型
  ↓
Step 2：填写具体需求 / 上传材料 / 选择知识库
  ↓
Step 3：生成中
  ↓
Step 4：TipTap 展示文稿，可编辑、可选区、可调用 Skill、可导出
```

### 为什么不用单独对话框

单独对话框只能完成“粘贴文本 → 输出结果”，不能支撑：

```text
选中段落降重
选中段落改写
继续写作
段落级 patch
版本保存
导出 Word / PDF
论文多阶段生成
新闻稿结构化生成
```

所以正式文稿页面必须是网页级 `Document Studio`，中间使用 TipTap 作为文稿载体。

---

## 1. 能力分层

### 1.1 生成类 Skill

生成类 Skill 负责从 0 到 1 生成整篇文稿，输出 document artifact。

示例：

```text
general-document-writer    通用文稿
news-writer                新闻稿
report-writer              汇报材料
notice-writer              通知公告
meeting-minutes-writer     会议纪要
academic-paper-writer      论文初稿
academic-research-skills   学术研究 / 论文 pipeline
```

### 1.2 功能类 Skill / Capability

功能类能力负责对已有文稿做选区、段落或全文操作，输出 patch 或 comments。

示例：

```text
改写          direct-llm
续写          direct-llm
重写          direct-llm
润色          direct-llm
翻译          direct-llm
摘要          direct-llm
AI降重        direct-llm 或 opencode + humanizer
学术审阅      opencode 或 pipeline
导出 Word     node
导出 PDF      node / playwright
```

### 1.3 OpenCode 不是唯一执行器

最终执行器类型：

```ts
type CapabilityRunner =
  | 'direct-llm'
  | 'opencode'
  | 'node'
  | 'pipeline'
  | 'legacy'
```

分工规则：

| 能力 | runner | 原因 |
|---|---|---|
| 改写、续写、润色、重写、翻译、摘要 | direct-llm | 快、轻量、适合实时编辑器选区 |
| humanizer 高级降重 | opencode | 复用外部 `blader/humanizer` SKILL.md |
| 新闻稿 / 汇报材料 / 通知公告生成 | opencode | 结构化文稿生成，输出 artifact |
| 论文 pipeline | opencode / pipeline | 多阶段任务 |
| 导出 Word / Markdown / HTML / PDF | node | 本地转换，不需要模型 |
| 旧 `web.document.generate/edit` | legacy | 保留但不作为正式入口 |

---

## 2. 必须纳入的外部 Skill

### 2.1 humanizer

仓库：

```text
https://github.com/blader/humanizer
```

定位：

```text
AI降重 / 自然化表达 / 去模板化表达
```

接入方式：

```text
短文本、选区 < 1500 字：优先 direct-llm，保证速度
全文、长文本、用户选择“高级降重 / humanizer skill”：走 opencode + humanizer
```

正式 UI 文案：

```text
AI降重
减少重复表达、优化句式、降低模板化痕迹，保留原意。
```

不要写：

```text
绕过检测
保证查重通过
保证 AI 检测不出来
```

### 2.2 academic-research-skills

仓库：

```text
https://github.com/imbad0202/academic-research-skills
```

定位：

```text
论文 / 学术研究多阶段 pipeline：
research → write → review → revise → finalize
```

第一版不要强行做满。先注册为：

```text
document-pipeline
status = pending / experimental
```

后续再接：

```text
研究问题生成
大纲生成
文献综述
论文初稿
学术审阅
修改建议
最终稿
```

---

## 3. 前端设计

### 3.1 新页面

新增正式文稿页面：

```text
src/features/document-studio/pages/DocumentStudioPage.tsx
```

路由建议：

```text
/document
```

或先接到现有「文稿编辑 / 工作台」入口，避免改动太大。

### 3.2 页面流程

#### Step 1：选择文稿类型

卡片：

```text
通用文稿
新闻稿
汇报材料
通知公告
会议纪要
工作总结
调研报告
方案文档
论文
```

普通用户只看到中文类型，不显示 skillId。

内部映射：

```ts
{
  id: 'news',
  label: '新闻稿',
  generateCapabilityId: 'generate-news',
  generateSkillId: 'news-writer'
}
```

#### Step 2：填写需求

根据 `documentType` 动态显示表单。

新闻稿示例字段：

```text
主题
活动时间
活动地点
参与人员
核心事件
希望突出什么
字数
语气
上传材料
其他要求
```

论文示例字段：

```text
研究主题
学科方向
研究问题
论文类型
字数
引用格式
已有材料
生成范围：大纲 / 摘要 / 引言 / 文献综述 / 完整初稿
```

#### Step 3：生成中

普通用户只看到阶段，不展示技术日志：

```text
正在分析文稿类型
正在整理材料
正在调用写作能力
正在生成初稿
正在整理编辑结构
即将完成
```

开发者日志可以折叠显示。

#### Step 4：TipTap 文稿工作台

默认布局：

```text
顶部：标题 / 保存版本 / 导出
左侧：大纲与材料，可折叠
中间：TipTap 文稿编辑器
右侧：AI 能力面板，可折叠
```

默认状态：

```text
左侧收起
右侧打开
中间最大
```

### 3.3 组件结构

新增：

```text
src/features/document-studio/
  pages/
    DocumentStudioPage.tsx

  components/
    DocumentTypeSelector.tsx
    DocumentRequestForm.tsx
    DocumentGenerationProgress.tsx
    TiptapDocumentEditor.tsx
    ContextSkillPanel.tsx
    PatchPreviewModal.tsx
    DocumentExportPanel.tsx
    DocumentOutlinePanel.tsx

  hooks/
    useDocumentStudio.ts
    useDocumentCapabilities.ts
    useDocumentGenerationJob.ts
    useDocumentSelection.ts
    useDocumentPatchPreview.ts

  services/
    documentStudioApi.ts
    documentCapabilities.ts
```

### 3.4 TipTap 要求

TipTap 作为正式文稿载体。

主要节点必须带稳定 `blockId`：

```json
{
  "type": "paragraph",
  "attrs": {
    "blockId": "block-004",
    "role": "body"
  },
  "content": [
    { "type": "text", "text": "正文内容..." }
  ]
}
```

需要支持：

```text
heading
paragraph
blockquote
bulletList
orderedList
listItem
table
tableRow
tableCell
```

第一版表格可以只显示，不做复杂表格编辑。

### 3.5 右侧 ContextSkillPanel

根据上下文显示能力。

没有选区时：

```text
全文润色
生成摘要
检查逻辑
导出 Word
导出 Markdown
导出 HTML
```

有选区时：

```text
改写
续写
重写
润色
AI降重
翻译
缩写
扩写
改正式
```

论文文稿额外显示：

```text
生成大纲
学术审阅
检查引文
文献综述
```

新闻稿额外显示：

```text
优化标题
改导语
补背景
压缩成短讯
```

---

## 4. 前端 Capability 映射

新增：

```text
src/features/document-studio/services/documentCapabilities.ts
```

类型：

```ts
export type CapabilityRunner =
  | 'direct-llm'
  | 'opencode'
  | 'node'
  | 'pipeline'
  | 'legacy'

export type CapabilityScope =
  | 'selection'
  | 'block'
  | 'document'
  | 'pipeline'

export type CapabilityOutputMode =
  | 'patch'
  | 'new_artifact'
  | 'comments'
  | 'export'

export interface DocumentCapability {
  id: string
  label: string
  description: string
  runner: CapabilityRunner
  skillId?: string
  actionType:
    | 'generate_document'
    | 'transform_selection'
    | 'transform_block'
    | 'transform_document'
    | 'continue_writing'
    | 'review_document'
    | 'export_document'
  scope: CapabilityScope
  outputMode: CapabilityOutputMode
  documentTypes: string[]
  enabled: boolean
  status?: 'connected' | 'pending' | 'legacy-hidden'
}
```

示例：

```ts
export const DOCUMENT_CAPABILITIES: DocumentCapability[] = [
  {
    id: 'generate-general-document',
    label: '通用文稿生成',
    description: '根据需求生成通用文稿初稿',
    runner: 'opencode',
    skillId: 'general-document-writer',
    actionType: 'generate_document',
    scope: 'document',
    outputMode: 'new_artifact',
    documentTypes: ['general'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'generate-news',
    label: '新闻稿生成',
    description: '根据活动信息和材料生成正式新闻稿',
    runner: 'opencode',
    skillId: 'news-writer',
    actionType: 'generate_document',
    scope: 'document',
    outputMode: 'new_artifact',
    documentTypes: ['news'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'rewrite-selection',
    label: '改写',
    description: '保持原意，重新组织选中文本表达',
    runner: 'direct-llm',
    actionType: 'transform_selection',
    scope: 'selection',
    outputMode: 'patch',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'continue-writing',
    label: '续写',
    description: '根据上下文继续写作',
    runner: 'direct-llm',
    actionType: 'continue_writing',
    scope: 'block',
    outputMode: 'patch',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'humanize-selection',
    label: 'AI降重',
    description: '减少重复表达、优化句式、降低模板化痕迹，保留原意',
    runner: 'direct-llm',
    skillId: 'humanizer',
    actionType: 'transform_selection',
    scope: 'selection',
    outputMode: 'patch',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'humanize-document-advanced',
    label: '高级AI降重',
    description: '使用 humanizer skill 对长文或全文进行自然化改写',
    runner: 'opencode',
    skillId: 'humanizer',
    actionType: 'transform_document',
    scope: 'document',
    outputMode: 'patch',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'academic-paper-pipeline',
    label: '论文写作',
    description: '多阶段学术写作流程',
    runner: 'pipeline',
    skillId: 'academic-research-skills',
    actionType: 'generate_document',
    scope: 'pipeline',
    outputMode: 'new_artifact',
    documentTypes: ['paper'],
    enabled: false,
    status: 'pending',
  },
  {
    id: 'export-markdown',
    label: '导出 Markdown',
    description: '导出 Markdown 文件',
    runner: 'node',
    actionType: 'export_document',
    scope: 'document',
    outputMode: 'export',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'paper'],
    enabled: true,
    status: 'connected',
  },
  {
    id: 'export-html',
    label: '导出 HTML',
    description: '导出 HTML 文件',
    runner: 'node',
    actionType: 'export_document',
    scope: 'document',
    outputMode: 'export',
    documentTypes: ['general', 'news', 'report', 'notice', 'minutes', 'paper'],
    enabled: true,
    status: 'connected',
  }
]
```

---

## 5. 后端设计

### 5.1 新模块

新增：

```text
server/src/modules/document-studio/
  documentTypes.ts
  documentCapabilities.ts
  documentStudio.routes.ts
  documentJob.service.ts
  documentArtifact.service.ts
  documentPatch.service.ts
  documentExport.service.ts

server/src/modules/capabilities/
  capability.types.ts
  capability.registry.ts
  capability.runtime.ts
  executors/
    directLlm.executor.ts
    opencode.executor.ts
    node.executor.ts
    pipeline.executor.ts

server/src/modules/opencode/
  skillMaterializer.ts
  opencodeJobRunner.ts
```

如果项目已有同名或相近模块，复用现有结构，不要重复造轮子。

### 5.2 API

#### 文稿类型

```http
GET /api/document-types
```

返回：

```json
{
  "success": true,
  "documentTypes": [
    {
      "id": "news",
      "label": "新闻稿",
      "description": "适合活动报道、会议报道、发布会报道",
      "generateCapabilityId": "generate-news",
      "fields": [
        { "name": "topic", "label": "主题", "type": "text", "required": true },
        { "name": "eventTime", "label": "时间", "type": "text" },
        { "name": "location", "label": "地点", "type": "text" },
        { "name": "participants", "label": "参与人员", "type": "textarea" },
        { "name": "highlights", "label": "重点突出", "type": "textarea" }
      ]
    }
  ]
}
```

#### 创建文稿任务

```http
POST /api/documents/jobs
```

请求：

```json
{
  "documentType": "news",
  "capabilityId": "generate-news",
  "fields": {
    "topic": "CUHK-Shenzhen AI Office 发布会",
    "eventTime": "2026年5月",
    "location": "香港中文大学（深圳）",
    "highlights": "AI 办公、教学科研支持、组织协同"
  },
  "materials": [],
  "language": "zh-CN",
  "tone": "formal"
}
```

返回：

```json
{
  "success": true,
  "jobId": "job_xxx"
}
```

#### 查询任务

使用统一 Job API：

```http
GET /api/jobs/:jobId
```

返回：

```json
{
  "success": true,
  "status": "succeeded",
  "artifactId": "artifact_xxx",
  "documentId": "doc_xxx"
}
```

#### 获取文稿

```http
GET /api/documents/:documentId
```

返回：

```json
{
  "success": true,
  "documentId": "doc_xxx",
  "artifactId": "artifact_xxx",
  "documentType": "news",
  "title": "标题",
  "editorJson": {},
  "contentModel": {}
}
```

#### 运行文稿能力

```http
POST /api/documents/:documentId/capabilities/:capabilityId/run
```

请求：

```json
{
  "scope": "selection",
  "selection": {
    "from": 120,
    "to": 260,
    "text": "选中的文本",
    "blockIds": ["block-004"]
  },
  "instruction": "改得更正式"
}
```

返回统一 patch：

```json
{
  "success": true,
  "resultType": "patch",
  "patch": {
    "type": "replace_selection",
    "text": "修改后的文本",
    "summary": ["调整表达", "保留原意"]
  }
}
```

#### 应用 patch

```http
POST /api/documents/:documentId/patch
```

请求：

```json
{
  "patch": {
    "type": "replace_selection",
    "text": "修改后的文本",
    "selection": {
      "from": 120,
      "to": 260,
      "blockIds": ["block-004"]
    }
  }
}
```

#### 导出

```http
POST /api/documents/:documentId/export
```

请求：

```json
{
  "format": "markdown"
}
```

支持第一版：

```text
markdown
html
```

后续：

```text
docx
pdf
```

---

## 6. Document Artifact 输出结构

每篇文稿生成后保存为 artifact：

```text
artifacts/<artifactId>/
  metadata.json
  document.json
  editor.json
  document.md
  index.html
  versions/
    v1.editor.json
    v2.editor.json
  exports/
    document.md
    document.html
```

### document.json

后端语义结构：

```json
{
  "id": "doc_xxx",
  "type": "news",
  "title": "标题",
  "blocks": [
    {
      "id": "block-001",
      "type": "heading",
      "level": 1,
      "text": "标题"
    },
    {
      "id": "block-002",
      "type": "paragraph",
      "role": "lead",
      "text": "导语..."
    }
  ]
}
```

### editor.json

TipTap 可加载的 ProseMirror JSON。

### document.md

Markdown 版本，用于导出和 diff。

### index.html

预览版本。

---

## 7. Skill 交给 OpenCode 的方式

### 7.1 Skill 管理权

Skill 管理权在 AI Office。

正式 Skill 根目录：

```text
/data/darebug/aios-skills
```

不要生产依赖 OpenCode 全局目录：

```text
~/.config/opencode/skills
```

OpenCode 全局目录只用于本机调试。

### 7.2 Runtime Materializer

每个 OpenCode job 创建独立目录：

```text
runtime/opencode-jobs/<jobId>/
  .opencode/
    skills/
      news-writer/
        SKILL.md
      humanizer/
        SKILL.md
    opencode.json

  input/
    document-request.json
    selection.json
    document-context.json
    materials/

  output/
    document.json
    editor.json
    document.md
    index.html
    patch.json
    result.json

  logs/
    stdout.log
    stderr.log
```

### 7.3 最小 Skill 暴露

只 materialize 本次任务需要的 skill。

新闻稿生成：

```text
只装配 news-writer
```

AI降重：

```text
只装配 humanizer
```

论文 pipeline：

```text
只装配 academic-research-skills
```

### 7.4 opencode.json 权限

每个 jobDir 生成：

```json
{
  "permission": {
    "skill": {
      "news-writer": "allow",
      "*": "deny"
    }
  }
}
```

humanizer job：

```json
{
  "permission": {
    "skill": {
      "humanizer": "allow",
      "*": "deny"
    }
  }
}
```

### 7.5 调用方式

新文稿 Skill 使用 project-local `.opencode/skills` 模式：

```bash
opencode run --pure --dir <jobDir> -- "<task prompt>"
```

保留现有 PPT 的 `-f` 附件模式，不要破坏 PPT。

---

## 8. Skill metadata.json 示例

### 8.1 humanizer

```json
{
  "id": "humanizer",
  "name": "AI降重",
  "description": "减少重复表达、优化句式、降低模板化痕迹，保留原意",
  "category": "document-transform",
  "runner": "opencode",
  "entryFile": "SKILL.md",
  "version": "1.0.0",
  "scope": ["selection", "block", "document"],
  "supportedDocumentTypes": ["general", "news", "report", "notice", "minutes", "paper"],
  "outputMode": "patch",
  "timeoutMs": 180000,
  "materialize": {
    "mode": "copy",
    "include": ["SKILL.md"]
  },
  "opencode": {
    "skillName": "humanizer",
    "permissions": {
      "skill": {
        "humanizer": "allow",
        "*": "deny"
      }
    }
  },
  "source": {
    "type": "github",
    "url": "https://github.com/blader/humanizer"
  }
}
```

### 8.2 academic-research-skills

```json
{
  "id": "academic-research-skills",
  "name": "论文写作",
  "description": "用于论文选题、大纲、初稿、审阅和修改的多阶段学术写作流程",
  "category": "document-pipeline",
  "runner": "opencode",
  "entryFile": "SKILL.md",
  "version": "1.0.0",
  "scope": ["pipeline"],
  "supportedDocumentTypes": ["paper"],
  "outputMode": "document_artifact",
  "timeoutMs": 900000,
  "enabled": false,
  "status": "pending",
  "materialize": {
    "mode": "copy",
    "include": [
      "SKILL.md",
      "skills/**",
      "prompts/**",
      "examples/**"
    ],
    "exclude": [
      ".git/**",
      "node_modules/**",
      "test/**"
    ]
  },
  "opencode": {
    "skillName": "academic-research-skills",
    "permissions": {
      "skill": {
        "academic-research-skills": "allow",
        "*": "deny"
      }
    }
  },
  "source": {
    "type": "github",
    "url": "https://github.com/imbad0202/academic-research-skills"
  }
}
```

### 8.3 news-writer

第一版可以自己新增：

```json
{
  "id": "news-writer",
  "name": "新闻稿生成",
  "description": "根据活动信息和材料生成正式新闻稿",
  "category": "document-generation",
  "runner": "opencode",
  "entryFile": "SKILL.md",
  "version": "1.0.0",
  "scope": ["document"],
  "supportedDocumentTypes": ["news"],
  "outputMode": "document_artifact",
  "timeoutMs": 300000,
  "materialize": {
    "mode": "copy",
    "include": [
      "SKILL.md",
      "templates/**"
    ]
  },
  "opencode": {
    "skillName": "news-writer",
    "permissions": {
      "skill": {
        "news-writer": "allow",
        "*": "deny"
      }
    }
  }
}
```

### 8.4 general-document-writer

第一版可以自己新增：

```json
{
  "id": "general-document-writer",
  "name": "通用文稿生成",
  "description": "根据用户需求生成通用文稿初稿",
  "category": "document-generation",
  "runner": "opencode",
  "entryFile": "SKILL.md",
  "version": "1.0.0",
  "scope": ["document"],
  "supportedDocumentTypes": ["general"],
  "outputMode": "document_artifact",
  "timeoutMs": 300000,
  "materialize": {
    "mode": "copy",
    "include": [
      "SKILL.md"
    ]
  },
  "opencode": {
    "skillName": "general-document-writer",
    "permissions": {
      "skill": {
        "general-document-writer": "allow",
        "*": "deny"
      }
    }
  }
}
```

---

## 9. OpenCode task prompt 模板

### 9.1 生成文稿

```text
你是 AI Office 的文稿生成执行器。

请使用 OpenCode skill：{skillName}。

输入文件：
- input/document-request.json
- input/materials/

输出要求：
必须生成：
- output/document.json
- output/editor.json
- output/document.md
- output/index.html
- output/result.json

约束：
1. 严格保留输入中的事实、时间、地点、人名和机构名。
2. 不编造不存在的数据、政策、采访或引用。
3. 输出语言按 input/document-request.json 指定。
4. editor.json 必须是 TipTap 可加载的 ProseMirror JSON。
5. document.json 中每个 block 必须有稳定 blockId。
6. result.json 必须包含 artifactTitle、documentType、warnings。
```

### 9.2 humanizer 高级 AI 降重

```text
你是 AI Office 的文稿局部修改执行器。

请使用 OpenCode skill：humanizer。

输入文件：
- input/selection.json
- input/document-context.json

输出要求：
必须生成：
- output/patch.json

patch.json 格式：
{
  "type": "replace_selection",
  "text": "...",
  "summary": ["..."],
  "warnings": []
}

约束：
1. 只处理 selection.text。
2. 保留原文事实、数字、人名、机构名。
3. 不新增不存在的信息。
4. 不改变文稿整体立场。
5. 不输出完整文稿，只输出 patch。
```

---

## 10. 旧能力如何接入

这些旧能力不要删：

```text
改写
续写
重写
润色
```

但它们不要再作为旧 UI 或旧 skill id 暴露。

做法：

```text
旧能力 → 新 capability wrapper → direct-llm executor → DocumentPatch
```

也就是说：

```text
capabilityId = rewrite-selection
  ↓
CapabilityRuntime
  ↓
DirectLlmExecutor
  ↓
复用原有 prompt / 模型调用
  ↓
返回 patch
```

旧 `web.document.generate`、`web.document.edit`：

```text
保留后端 legacy handler
不作为 Document Studio 正式入口
不出现在前端 Skill 中心
不出现在 Document Studio 能力列表
```

---

## 11. 实施顺序

### Phase 1：前端骨架

1. 新增 `DocumentStudioPage`
2. 新增 Step 1 文稿类型选择
3. 新增 Step 2 动态表单
4. 新增 Step 3 生成状态
5. 新增 Step 4 TipTap 编辑器空载体
6. 加入右侧 `ContextSkillPanel`
7. 接入 `/document` 路由或现有文稿入口

验收：

```text
/document 可打开
可以选择新闻稿 / 通用文稿
可以进入需求填写
TipTap 页面可以展示空文稿
npm run build 通过
```

### Phase 2：direct-llm 能力

1. 接 `rewrite-selection`
2. 接 `continue-writing`
3. 接 `polish-selection`
4. 返回 patch
5. 前端 PatchPreviewModal 可以接受 / 取消

验收：

```text
选中文本后可以改写
改写结果以 patch 形式预览
接受后写回 TipTap
```

### Phase 3：OpenCode 文稿生成

1. 新增 `general-document-writer`
2. 新增 `news-writer`
3. 新增 `SkillMaterializer`
4. 新文稿 Skill 使用 `.opencode/skills` 模式
5. 生成 `document.json / editor.json / document.md / index.html`

验收：

```text
选择新闻稿后可以生成文稿
生成后 TipTap 加载 editor.json
Artifact 中保存 document.json / editor.json / document.md / index.html
```

### Phase 4：humanizer

1. 短文本 AI降重走 direct-llm
2. 高级 AI降重走 OpenCode + humanizer
3. 长文 / 全文默认走 OpenCode
4. 输出 patch

验收：

```text
选区 AI降重可用
全文高级 AI降重可用
不会出现“绕过检测”等 UI 文案
```

### Phase 5：导出

第一版：

```text
Markdown
HTML
```

后续：

```text
DOCX
PDF
```

### Phase 6：academic-research-skills

先注册，后接入。

第一阶段显示：

```text
论文写作：待接入 Skill
```

后续实现 pipeline：

```text
研究问题
大纲
文献综述
初稿
审阅
修改
最终稿
```

---

## 12. 绝对不要做的事

1. 不要让前端直接调用 OpenCode。
2. 不要让前端直接读取 SKILL.md。
3. 不要让所有能力都走 OpenCode。
4. 不要把 `humanizer` 当成“保证检测不出来”的功能。
5. 不要把旧 `web.document.generate/edit` 作为正式 Document Studio 主线。
6. 不要一开始做完整 Word。
7. 不要每个文稿类型新建一个页面。
8. 不要删除现有 PPT OpenCode 链路。
9. 不要修改 `/data/darebug/aioffice-server/ai-office-public-review`。
10. 不要把 API key 写进前端。

---

## 13. Cursor 总提示词

你现在需要在 `/data/darebug/aioffice-server/ai-office-web` 中实现 AI Office Web 的正式文稿功能基础架构：Document Studio。

核心决策：
1. 文稿页面采用递进式创建流程 + TipTap 文稿工作台。
2. 用户先选择文稿类型，再填写需求，再生成，再进入 TipTap 编辑器修改。
3. 前端统一展示能力；后端按 capability 分发到 direct-llm、opencode、node、pipeline。
4. 不是所有能力都走 OpenCode。改写、续写、重写、润色、翻译、摘要优先走 direct-llm。
5. OpenCode 只用于外部 SKILL.md、复杂生成、多阶段任务、长文高级降重。
6. 必须纳入 humanizer 和 academic-research-skills 两个外部 skill：
   - humanizer: https://github.com/blader/humanizer
   - academic-research-skills: https://github.com/imbad0202/academic-research-skills
7. humanizer 第一版支持：
   - 短文本 AI降重 direct-llm
   - 高级 AI降重 opencode + humanizer
8. academic-research-skills 第一版只注册为 pending / experimental，不强行实现完整 pipeline。
9. 第一版实现 general-document-writer 和 news-writer 两个生成类 skill。
10. 保留旧 web.document.generate / web.document.edit 后端能力，但标记 legacy，不作为正式前端入口。

具体实现：
1. 新增 `src/features/document-studio` 前端目录和组件。
2. 新增 `/document` 页面或接入现有文稿入口。
3. 新增 `DocumentCapability` 映射表。
4. 新增 `server/src/modules/document-studio` 后端模块。
5. 新增 `server/src/modules/capabilities` 多执行器 runtime。
6. 新增 `SkillMaterializer`，将 OpenCode skill 从 `/data/darebug/aios-skills` materialize 到 `runtime/opencode-jobs/<jobId>/.opencode/skills/<skillName>/`。
7. 新增文稿 artifact 输出结构：metadata.json、document.json、editor.json、document.md、index.html、versions、exports。
8. TipTap 必须加载 `editor.json`，并保留 blockId。
9. 所有功能类能力输出统一 `DocumentPatch`。
10. Patch 必须先预览，用户确认后才写回 TipTap。
11. 第一版导出支持 Markdown / HTML。
12. 不要修改现有 OpenCode HTML PPT 生成链路。
13. npm run build 和 cd server && npm run build 必须通过。

验收：
1. `/document` 或现有文稿入口能打开 Document Studio。
2. 用户可以选择“通用文稿”和“新闻稿”。
3. 用户可以填写需求并创建生成任务。
4. 生成成功后 TipTap 能加载文稿。
5. 用户选中文本后能执行“改写”。
6. 用户选中文本后能执行“AI降重”。
7. 结果以 patch 预览形式展示，用户确认后替换。
8. Skill 中心不展示旧 `web.document.generate`、`web.document.edit`。
9. `humanizer` 和 `academic-research-skills` 的 metadata 示例或注册占位存在。
10. 旧 PPT 功能不受影响。
