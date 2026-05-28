/** Paper upload — FastAPI :18020 only (no BFF auth). */

export interface ProjectInfo {
  project_id: string
  project_dir: string
  paper_filename: string
  created_at: string
  updated_at: string
  status: string
}

export async function uploadPaperPdf(file: File): Promise<ProjectInfo> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/paper-api/api/v1/paper/upload', {
    method: 'POST',
    body: form,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(text || res.statusText)
  }
  return JSON.parse(text) as ProjectInfo
}
