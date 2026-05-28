import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { FileUploadButton } from "../../components/common/FileUploadButton";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { mockApi, PaperRec } from "../../services/mockApi";
import { fetchPaperRecommendations } from "../../services/literature";
import { useSessionStore } from "../../store/sessionStore";
import { useUiStore } from "../../store/uiStore";
import { deleteLibraryDocument, uploadLiteratureFile, type UploadedDocument } from "../../services/upload";
import { runAction } from "../../hooks/usePlatformActions";
import { paperDoiLink } from "../../lib/paperLinks";

export function StudentMyLibraryPage() {
  const showToast = useUiStore((s) => s.showToast);
  const user = useSessionStore((s) => s.user);
  const [docs, setDocs] = useState<UploadedDocument[]>([]);
  const [recommendations, setRecommendations] = useState<PaperRec[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    mockApi.myLibrary().then((d) => setDocs(d as UploadedDocument[])).catch(() => undefined);
    fetchPaperRecommendations()
      .then((d) => setRecommendations(d.papers))
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
  }, []);

  const onUpload = async (file: File) => {
    const res = await runAction(() =>
      uploadLiteratureFile(file, {
        sourceType: "文献",
        personal: true,
        userId: user?.id,
      })
    );
    if (res) {
      showToast(res.message || "上传成功");
      load();
    }
  };

  const onDelete = async (docId: string) => {
    if (!confirm("确定删除该文献？")) return;
    setDeletingId(docId);
    try {
      await deleteLibraryDocument(docId, user?.id);
      showToast("已删除");
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="我的文献库" description="上传与管理个人文献，支持删除；入库后可用于检索与每日推荐。" />

      <SectionCard title="上传文献">
        <FileUploadButton label="选择文件上传" onFile={onUpload} />
        <p className="mt-3 text-xs text-muted">支持 PDF、Word、TXT，上传后即时保存至个人文献库。</p>
      </SectionCard>

      <SectionCard title="已上传文献">
        {docs.length === 0 ? (
          <p className="text-sm text-muted">暂无记录，请先上传。</p>
        ) : (
          <ul className="divide-y text-sm">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  {d.downloadUrl ? (
                    <a
                      href={d.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {d.title || d.fileName || "未命名文献"}
                    </a>
                  ) : (
                    <span className="font-medium">{d.title || d.fileName || "未命名文献"}</span>
                  )}
                  <p className="mt-0.5 text-xs text-muted">{d.uploadedAt?.slice(0, 10) ?? "—"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(d.id)}
                  disabled={deletingId === d.id}
                  className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title="删除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="今日推荐预览">
        <ul className="space-y-3 text-sm">
          {recommendations.slice(0, 3).map((p) => {
            const doiHref = paperDoiLink(p.doi);
            return (
              <li key={p.id} className="rounded-lg border border-slate-100 p-3">
                <p className="font-medium">{p.title}</p>
                {p.doi && doiHref && (
                  <a
                    href={doiHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block truncate font-mono text-xs text-primary hover:underline"
                  >
                    https://doi.org/{p.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
        <Link to="/research/literature/recommendations" className="mt-3 inline-block text-sm text-primary hover:underline">
          查看全部每日推荐 →
        </Link>
      </SectionCard>
    </div>
  );
}
