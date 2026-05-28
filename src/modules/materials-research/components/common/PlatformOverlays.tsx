import { X } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import { ConfidenceBadge } from "./ConfidenceBadge";

export function PlatformOverlays() {
  const { busy, toast, evidenceModal, messageModal, closeModals, clearToast } = useUiStore();

  return (
    <>
      {busy && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/20">
          <div className="rounded-xl bg-white px-6 py-4 text-sm text-slate-700 shadow-lg">
            处理中…
          </div>
        </div>
      )}
      {toast && (
        <div
          className={`fixed bottom-6 left-6 z-[100] max-w-sm rounded-xl px-4 py-3 text-sm text-white shadow-lg ${
            toast.type === "success" ? "bg-success" : "bg-primary"
          }`}
          onClick={clearToast}
        >
          {toast.message}
        </div>
      )}

      {evidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModals}>
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-primary">{evidenceModal.title}</h3>
              <button type="button" onClick={closeModals} aria-label="关闭">
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>
            <ul className="space-y-4">
              {evidenceModal.items.map((item, i) => (
                <li key={i} className="rounded-lg border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-muted">{item.source}</span>
                    <ConfidenceBadge score={item.reliability} />
                  </div>
                  <p className="mt-2 font-medium text-slate-800">{item.title}</p>
                  <p className="text-xs text-muted">{item.year}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.excerpt}</p>
                  {item.fields?.length > 0 && (
                    <p className="mt-2 text-xs text-accent">提取字段：{item.fields.join("、")}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {messageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModals}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-primary">{messageModal.title}</h3>
            <p className="mt-3 text-sm text-slate-700">{messageModal.message}</p>
            {messageModal.detail && (
              <p className="mt-2 text-xs text-muted">{messageModal.detail}</p>
            )}
            <button
              type="button"
              onClick={closeModals}
              className="mt-6 w-full rounded-lg bg-primary py-2 text-sm text-white hover:bg-primary/90"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </>
  );
}
