import { FileUploadButton } from "../../components/common/FileUploadButton";
import { PageHeader } from "../../components/common/PageHeader";
import { mockApi } from "../../services/mockApi";
import { useUiStore } from "../../store/uiStore";

export function LiteratureUploadPage() {
  const showToast = useUiStore((s) => s.showToast);

  const onFile = async () => {
    const res = await mockApi.uploadLiterature();
    showToast(res.message);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="文献上传" description="上传个人文献，审核后可纳入推荐与公共论文库。" />
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <FileUploadButton label="选择文件上传" onFile={onFile} />
        <p className="mt-4 text-sm text-muted">支持 PDF、Word、TXT；上传后将进入待审核状态。</p>
      </div>
    </div>
  );
}
