import type { PaperRec } from "../services/mockApi";

/** 论文链接：仅使用真实 DOI。 */
export function paperDoiLink(doi?: string): string | null {
  if (!doi?.trim()) return null;
  const d = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  return `https://doi.org/${d}`;
}

export function paperLink(p: Pick<PaperRec, "doi">): string | null {
  return paperDoiLink(p.doi);
}
