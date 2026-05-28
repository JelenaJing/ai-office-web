import { useEffect, useState } from "react";
import { api, UploadedDocument } from "../services/api";
import { PageHeader } from "../components/common/PageHeader";
import { SectionCard } from "../components/common/SectionCard";
import { FileUploadButton } from "../components/common/FileUploadButton";
import { runAction } from "../hooks/usePlatformActions";
import { useUiStore } from "../store/uiStore";
import { uploadLiteratureFile, triggerFileDownload } from "../services/upload";
import { useDatabaseMode } from "../contexts/DatabaseModeContext";

export function KnowledgePage() {
  const { readonly } = useDatabaseMode();
  const { showToast } = useUiStore();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [sourceType, setSourceType] = useState("文献");
  const [title, setTitle] = useState("");

  const load = () => runAction(() => api.library.documents("literature")).then((d) => d && setDocuments(d));

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (file: File) => {
    const res = await runAction(() => uploadLiteratureFile(file, { sourceType, title: title || undefined }));
    if (res) {
      showToast(res.message);
      setTitle("");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={readonly ? "论文库" : "知识与专利"}
        description={
          readonly
            ? "浏览课题组公共论文与专利索引。"
            : "管理文献、专利与研发资料，支持本地上传、索引与检索，数据存储在课题组服务器。"
        }
      />

      {!readonly && (
      <SectionCard title="上传文献 / 专利">
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm">
            <span className="text-muted">来源类型</span>
            <select className="mt-1 w-full rounded-lg border px-3 py-2" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
              <option value="文献">文献</option>
              <option value="专利">专利</option>
              <option value="内部报告">内部报告</option>
              <option value="标准">标准规范</option>
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-muted">标题（可选，默认取文件名）</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="例如：竹基硬碳负极研究进展"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
        </div>
        <FileUploadButton label="选择文件并上传" variant="primary" onFile={handleUpload} className="!px-4 !py-2 !text-sm" />
        <p className="mt-3 text-xs text-muted">支持 PDF、Word、Excel、TXT、Markdown、ZIP 等格式，单文件不超过 50MB。</p>
      </SectionCard>
      )}

      <SectionCard title={`已入库资料（${documents.length}）`}>
        {documents.length === 0 ? (
          <p className="text-sm text-muted">暂无文献，请上传第一份资料。</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-muted">
              <tr>
                <th className="p-2">标题</th>
                <th className="p-2">文件名</th>
                <th className="p-2">类型</th>
                <th className="p-2">上传时间</th>
                <th className="p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="p-2 font-medium">{d.title || d.fileName}</td>
                  <td className="p-2 text-muted">{d.fileName}</td>
                  <td className="p-2">{d.sourceType}</td>
                  <td className="p-2 text-xs">{d.uploadedAt}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => triggerFileDownload(`/api/library/documents/${d.id}/download`, d.fileName)}
                      className="text-xs text-primary hover:underline"
                    >
                      下载
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
