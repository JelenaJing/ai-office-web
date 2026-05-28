const API_BASE = "/api";

export interface UploadedDocument {
  id: string;
  fileName: string;
  category: string;
  sourceType?: string;
  title?: string;
  sizeBytes: number;
  uploadedAt: string;
  downloadUrl?: string;
  ownerUserId?: string;
}

export interface UploadResult {
  success: boolean;
  message: string;
  documentId: string;
  fileName: string;
  sizeBytes: number;
  downloadUrl?: string;
  extractedEntities?: number;
}

function authHeaders(userId?: string): HeadersInit {
  const h: Record<string, string> = {};
  if (userId) h["X-Demo-User"] = userId;
  return h;
}

export async function uploadLiteratureFile(
  file: File,
  meta: { sourceType?: string; title?: string; personal?: boolean; userId?: string } = {}
): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("sourceType", meta.sourceType || "文献");
  if (meta.title) form.append("title", meta.title);
  if (meta.personal) form.append("scope", "personal");

  const res = await fetch(`${API_BASE}/library/upload`, {
    method: "POST",
    body: form,
    headers: authHeaders(meta.userId),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `上传失败 (${res.status})`);
  }
  return res.json();
}

export async function deleteLibraryDocument(docId: string, userId?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/library/documents/${docId}`, {
    method: "DELETE",
    headers: authHeaders(userId),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `删除失败 (${res.status})`);
  }
}

export async function uploadElnAttachment(recordId: string, file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/eln/records/${recordId}/attachments`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `上传失败 (${res.status})`);
  }
  return res.json();
}

export function triggerFileDownload(url: string, fileName?: string) {
  const a = document.createElement("a");
  a.href = url;
  if (fileName) a.download = fileName;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}
