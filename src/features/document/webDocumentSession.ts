/** Web 文稿：内存标签，不依赖 createBlankDocument / 本地 .aidoc.json */

export async function openWebBlankDocumentTab(
  openTab: (filePath: string | null, fileName: string, content: string) => Promise<void>,
  workspacePath: string,
  preferredName?: string,
): Promise<string> {
  const normalizedName =
    String(preferredName || '').trim().replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '_')
    || '未命名文档'
  const virtualPath = `web-document://${encodeURIComponent(workspacePath)}/${normalizedName}.md`
  await openTab(virtualPath, `${normalizedName}.md`, '<p></p>')
  return virtualPath
}
