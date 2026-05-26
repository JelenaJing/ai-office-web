# Introduction Remake 相关文件清单

来源文档：`docs/introduction-remake-handover.md`

包含文件：

- `backend/app/agents/introduction_remaker.py`
- `backend/app/services/intro_literature.py`
- `backend/app/services/openalex_client.py`
- `backend/app/services/llm_stream.py`
- `backend/app/services/tier1_journals.py`
- `backend/app/routers/remake.py`
- `backend/app/models.py`
- `backend/app/project_manager.py`
- `backend/app/config.py`
- `backend/app/data/tier1_journals.json`
- `frontend/src/components/Sidebar/FunctionPanel.tsx`
- `frontend/src/components/Sidebar/ResultDisplay.tsx`
- `frontend/src/services/api.ts`
- `docs/introduction-remake-handover.md`

说明：

- 文件按仓库内原始相对路径保留，便于直接定位。
- 其中 `tier1_journals.json` 属于配置/数据文件，但在交接文档中被作为关键依赖明确引用，因此一并纳入。