export interface ExportPdfInput {
  workspacePath: string
}

export type ExportPdfResult =
  | { success: true; artifact: never }
  | { success: false; error: string }

/**
 * Web PDF 导出第一版：无 PDF 渲染服务时返回明确错误。
 */
export async function runExportPdfSkill(_input: ExportPdfInput): Promise<ExportPdfResult> {
  return {
    success: false,
    error: 'PDF 导出服务未配置，请先下载 Word。',
  }
}
