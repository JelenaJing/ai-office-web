export interface DocumentWorkbenchAcceptanceItem {
  id: string
  label: string
  expected: string
}

export const DOCUMENT_WORKBENCH_ACCEPTANCE_CHECKLIST: DocumentWorkbenchAcceptanceItem[] = [
  {
    id: 'generate-zh-document',
    label: '新建中文文稿',
    expected: '选择模板和知识库后，输入中文需求并点击“生成文稿”，成功进入同一个 DocumentWorkbench。',
  },
  {
    id: 'edit-a4-canvas',
    label: 'A4 编辑区直接输入文字',
    expected: '中间白色 A4 页面支持直接编辑，手动输入后顶部出现“未保存修改”。',
  },
  {
    id: 'selection-edit',
    label: '选中文本后只改选区',
    expected: '选中文本后调用 /api/documents/:documentId/edit-selection，只替换选区并高亮本次改动。',
  },
  {
    id: 'section-edit',
    label: '未选中文字时修改当前章节',
    expected: '未选中文字时调用 /api/documents/:documentId/sections/:sectionId/edit，只更新当前章节。',
  },
  {
    id: 'manual-save',
    label: '手动编辑后保存',
    expected: '点击“保存”成功更新最新文稿与 DOCX，失败时出现明确错误提示。',
  },
  {
    id: 'refresh-restore',
    label: '刷新页面后内容恢复',
    expected: '刷新后恢复最近编辑的文稿内容、目录选择和章节上下文，不丢失本地编辑状态。',
  },
  {
    id: 'download-latest-docx',
    label: '下载 DOCX 使用最新内容',
    expected: 'dirty 状态下点击“下载 DOCX”会先保存最新 html/documentDraft，再下载最新 artifact。',
  },
  {
    id: 'visible-kb-template-panels',
    label: '知识库与模板面板可见',
    expected: '左侧知识库选择、模板选择按钮始终可见，且继续参与生成链路。',
  },
]
