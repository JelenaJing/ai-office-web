# Knowledge Service (Web P1-1 草案)

> 状态：设计文档 only — **第一版不实现向量库 / embedding / 复杂检索**。

## 目标

为 Web 版提供「上传资料 → 列表 → 删除 → 作为 Skill 生成上下文」的最小知识库能力，与 Electron 本地知识库并行存在，不删除桌面旧逻辑。

## 原则

1. 所有 Web 前端操作走 `platformApi`（后续扩展 `platformApi.knowledge.*`）。
2. 服务端 API 走 `/api/knowledge/*`。
3. 生成类 Skill 引用知识库条目时，仅传递**用户已上传**的文本/文件摘要，不编造内容。
4. 第一版不做 embedding、不做语义检索、不做向量库。

## 数据模型（草案）

```
KnowledgeSource {
  id: string
  userId: string
  workspaceId: string
  name: string
  mimeType: string
  size: number
  storagePath: string   // server 内部路径，不对前端暴露
  createdAt: string
  status: 'ready' | 'failed'
}
```

存储位置建议：`server/data/workspaces/{userId}/{workspaceId}/knowledge/sources/{id}/`（**不提交 git**）。

## API 草案

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/knowledge/sources` | 列出当前用户默认工作区下的知识库资料 |
| POST | `/api/knowledge/sources/upload` | multipart 上传文件（txt/md/docx/pdf 等，第一版可限制类型） |
| DELETE | `/api/knowledge/sources/:id` | 删除资料（校验 userId + workspace 归属） |
| POST | `/api/knowledge/search` | **第一版**：按文件名/关键词简单过滤，返回匹配条目元数据；不做向量搜索 |

### GET `/api/knowledge/sources`

响应：

```json
{
  "sources": [
    {
      "id": "uuid",
      "name": "产品说明.md",
      "mimeType": "text/markdown",
      "size": 1234,
      "createdAt": "2026-05-21T12:00:00.000Z"
    }
  ]
}
```

### POST `/api/knowledge/sources/upload`

- `multipart/form-data`，字段 `file`
- 鉴权：`Authorization: Bearer`
- 归属：当前用户默认 workspace（与 files API 一致）

### DELETE `/api/knowledge/sources/:id`

- 校验 source 属于当前 user/workspace
- 删除磁盘文件 + 索引记录

### POST `/api/knowledge/search`

第一版请求：

```json
{
  "query": "销售",
  "limit": 10
}
```

第一版响应（简单包含匹配 / 文件名匹配）：

```json
{
  "sources": [ /* KnowledgeSource 摘要列表 */ ]
}
```

后续版本可替换为 embedding 检索，但接口形状可保持不变。

## platformApi 扩展（计划）

```typescript
knowledge: {
  list(): Promise<KnowledgeSource[]>
  upload(file: File): Promise<KnowledgeSource>
  delete(id: string): Promise<void>
  search(query: string): Promise<KnowledgeSource[]>
}
```

Web 实现：全部 `fetch('/api/knowledge/*')` + Bearer token。

Electron 实现：继续 `window.electronAPI` 本地知识库，或 `notSupported` 引导桌面流程。

## 与 Skill 集成

- `POST /api/skills/:id/run` 的 `input.params` 可增加 `knowledgeSourceIds: string[]`
- Skill 执行前由 server 读取已选 source 的文本内容（docx/pdf 第一版可只支持纯文本/md）
- 生成结果写入 **Artifact**（与 docx.create 一致）

## Web Feature Gate

- `featureGate.knowledge` → `enabled: false`（迁移完成前）
- 资源中心「知识库资料」Tab 显示「Web 版即将开放」

## 非目标（本阶段）

- Milvus / pgvector / embedding 流水线
- 全文 OCR 复杂管道
- 跨用户共享知识库
- 公网 CDN 直链
