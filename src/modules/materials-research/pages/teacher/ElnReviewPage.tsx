import { useEffect, useState } from "react";
import { mockApi, ElnReviewItem } from "../../services/mockApi";
import { PageHeader } from "../../components/common/PageHeader";
import { useUiStore } from "../../store/uiStore";
import { directionLabel } from "../../lib/auth";

export function ElnReviewPage() {
  const [items, setItems] = useState<ElnReviewItem[]>([]);
  const showToast = useUiStore((s) => s.showToast);

  const load = () =>
    mockApi
      .elnReview()
      .then((rows) => setItems(Array.isArray(rows) ? rows : []))
      .catch(() => setItems([]));

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    const res = await mockApi.approveReview(id);
    showToast(res.message);
    load();
  };

  const ret = async (id: string) => {
    const res = await mockApi.returnReview(id, "请补充关键字段与原始数据附件");
    showToast(res.message);
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="实验记录审核" description="审核学生提交的 ELN，通过后归档至实验记录库。" />
      <div className="space-y-4">
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-muted">
            当前没有待审核的实验记录。
          </p>
        )}
        {items.map((r) => {
          const hints = r.riskHints ?? [];
          const score = r.completenessScore ?? 0;
          return (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-slate-800">{r.title}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {r.studentName} · {directionLabel(r.direction)} · 完整度 {Math.round(score * 100)}%
                  </p>
                  {hints.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-xs text-amber-800">
                      {hints.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => ret(r.id)} className="rounded-lg border px-3 py-1 text-xs">
                    退回
                  </button>
                  <button
                    type="button"
                    onClick={() => approve(r.id)}
                    className="rounded-lg bg-primary px-3 py-1 text-xs text-white"
                  >
                    通过
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
