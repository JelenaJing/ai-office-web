# Web 已开放功能完整性检查清单

> 范围：当前 Web **已开放或半开放** 的能力；不新增 Excel / PPT / Email / 知识库上传等大功能。  
> 分支：`feat/web-modular-service-migration`  
> 更新：Web 功能完整性收口轮次

---

## 总表

| 页面/模块 | 当前 Web 状态 | 用户可点击项 | 处理结果 | 是否完整 |
|---|---|---|---|---|
| **LoginPage** | 已接 `platformApi.auth` + AC 代理 | 登录、注册 | 可用；401 显示服务端 message | ✅ |
| **WorkWorkspace** | 场景入口列表 | 文稿编辑、邮件、日程、数据分析、PPT、我的文件、上传 | 文稿/文件/数据分析可用；其余 `comingSoon` | ✅ |
| **WorkspaceViewportHost** | 按 mode 切换视口 | 各 generation 模式对应面板 | Web 文稿 `WebWritingPanel`；数据分析 `WebExcelAnalysisPanel`；其余 ComingSoon | ✅ |
| **WebExcelAnalysisPanel** | `web.xlsx.analyze` | 选文件、分析、下载 | fileId + platformApi.excel.analyze → artifact | ✅ |
| **WebWritingPanel** | `web.docx.create` | 生成、下载、再生成 | 空 prompt 禁用；生成中禁用；成功/错误/无 exports 明确 | ✅ |
| **ResourceWorkspace** | 三 Tab | 我的文件 / 生成记录 / 知识库 | 文件 Tab 可用；生成记录完整状态机；知识库只读 | ✅ |
| **MyFilesView** | `platformApi.files` | 上传、下载、删除 | 沿用既有 platformApi 实现 | ✅ |
| **ArtifactsTab**（ResourceWorkspace 内） | `platformApi.artifacts` | 下载、删除（若有） | 加载/空/错/下载失败；无 exports 无无效按钮 | ✅ |
| **RemoteKnowledgePanel** | 远程 KB 只读 | 部门切换、浏览文档、上传（禁用） | 上传禁用+文案；区分登录/连接/暂无部门 | ✅ |
| **SkillManagementView** | Web 默认「生成文稿」Tab | 管理 / 生成文稿 / 商店 | 管理、商店 ComingSoon；生成文稿可用；无 Skill Store IPC | ✅ |
| **WebFeatureComingSoon** | 未迁移功能占位 | 无操作（纯展示） | 显示功能名、迁移状态、桌面版说明 | ✅ |
| **App calendar 入口** | `primarySection === 'calendar'` | 导航进入日历 | Web 显示 `WebFeatureComingSoon`（calendar gate） | ✅ |
| **DocumentFilePanel** | Web 不渲染 | — | `App.tsx` 仅 Electron 显示侧栏树 | ✅ |
| **WorkspaceContext** | Web token 工作区 | — | 无 `getWorkspaceTree` / `listWorkspaces`；`fileTree=[]` | ✅ |

---

## 明确禁用 / 即将开放（本轮不实现）

| 能力 | Web 表现 |
|---|---|
| 知识库上传 | 按钮禁用，「上传功能暂未开放」 |
| PPT / Email | WorkWorkspace `comingSoon` + Viewport `WebFeatureComingSoon` |
| Calendar | App 内 ComingSoon |
| 日报 / 图片 / Skill Store / Formal Template / EditorPanel | feature gate `enabled: false` 或 Viewport ComingSoon |
| 本地文件树 / `.aidoc.json` | 不展示、不调用 IPC |

---

## 浏览器验收（每轮发布前）

1. 登录 → 工作场景 → 文稿生成 → 下载 DOCX  
2. 资源中心：我的文件、生成记录（含空/错态）、知识库只读  
3. 知识库上传按钮禁用且说明清晰  
4. PPT / Excel / Email / Calendar 进入 ComingSoon，无旧 Electron 面板  
5. DevTools：无 `getWorkspaceTree`  
6. Electron 桌面版行为不变  

---

*与 `docs/web-module-migration-map.md` 的 **Web Conversion Decision** 表互补：本文档只描述**当前已开放**表面的完整性，不规划新模块迁移。*
