import { useEffect, useState } from "react";
import { api, GeneratedReport, OutputTemplate } from "../../services/api";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { runAction } from "../../hooks/usePlatformActions";
import { useUiStore } from "../../store/uiStore";
import { triggerFileDownload } from "../../services/upload";

const sectionLabels: Record<string, string> = {
  background: "研究背景",
  dataFoundation: "已有数据基础",
  coreProblems: "核心问题",
  recommendations: "推荐实验方案",
  risks: "风险与不确定性",
  nextSteps: "下一步计划",
  projectDirections: "可申请项目方向",
};

export function TeacherReportsPage() {
  const [templates, setTemplates] = useState<OutputTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const showToast = useUiStore((s) => s.showToast);

  useEffect(() => {
    runAction(() => api.outputs.templates()).then((t) => t && setTemplates(t));
  }, []);

  const generate = async (id: string) => {
    setSelectedId(id);
    setLoading(true);
    const res = await runAction(() => api.outputs.generate(id));
    if (res) {
      setReport({ templateId: res.templateId, sections: res.sections ?? [], content: res.content });
      showToast(res.message);
    }
    setLoading(false);
  };

  const exportDoc = async () => {
    if (!report) return;
    const res = await runAction(() => api.actions.exportReport(report.templateId, "word"));
    if (res?.downloadUrl) {
      triggerFileDownload(res.downloadUrl);
      showToast(res.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="报告生成"
        description="根据课题组实时数据生成组会汇报、项目申报、数据质量与学生培养档案，支持预览与导出。"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <SectionCard key={t.id} title={t.title}>
            <p className="text-sm text-muted">{t.description}</p>
            <p className="mt-2 text-xs text-slate-600">类别：{t.category}</p>
            <p className="text-xs text-slate-600">输入：{t.inputs.join("、")}</p>
            <button
              type="button"
              onClick={() => generate(t.id)}
              disabled={loading && selectedId === t.id}
              className="mt-4 rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {loading && selectedId === t.id ? "生成中…" : "生成预览"}
            </button>
          </SectionCard>
        ))}
      </div>

      {report && (
        <SectionCard
          title="报告预览"
          action={
            <button
              type="button"
              onClick={exportDoc}
              className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50"
            >
              导出 Word
            </button>
          }
        >
          <div className="space-y-6">
            {Object.entries(report.content).map(([key, value]) => (
              <div key={key}>
                <h3 className="font-medium text-primary">{sectionLabels[key] || key}</h3>
                <div className="mt-2 text-sm text-slate-700">
                  {Array.isArray(value) ? (
                    <ul className="list-inside list-disc space-y-1">
                      {value.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
