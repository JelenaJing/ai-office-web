import { useEffect, useState } from "react";
import { api, OutputTemplate, GeneratedReport } from "../services/api";
import { PageHeader } from "../components/common/PageHeader";
import { SectionCard } from "../components/common/SectionCard";
import { usePlatformActions } from "../hooks/usePlatformActions";
import { runAction } from "../hooks/usePlatformActions";

const sectionLabels: Record<string, string> = {
  background: "研究背景",
  dataFoundation: "已有数据基础",
  coreProblems: "核心问题",
  recommendations: "推荐实验方案",
  risks: "风险与不确定性",
  nextSteps: "下一步计划",
  projectDirections: "可申请项目方向",
};

export function OutputsPage() {
  const { exportReport, generateReportPreview } = usePlatformActions();
  const [templates, setTemplates] = useState<OutputTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runAction(() => api.outputs.templates()).then((t) => t && setTemplates(t));
  }, []);

  const generate = async (id: string) => {
    setSelectedId(id);
    setLoading(true);
    await generateReportPreview(id, setReport);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="项目与成果输出"
        description="沉淀的数据可直接服务组会、项目申报、专利交底和学生培养档案。"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <SectionCard key={t.id} title={t.title}>
            <p className="text-sm text-muted">{t.description}</p>
            <p className="mt-2 text-xs text-slate-600">输入：{t.inputs.join("、")}</p>
            <p className="text-xs text-slate-600">输出：{t.outputs.join("、")}</p>
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
          title="生成预览"
          action={
            <button
              type="button"
              onClick={() => exportReport(report.templateId, "word")}
              className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50"
            >
              导出 Word / PDF
            </button>
          }
        >
          <div className="space-y-6">
            {Object.entries(report.content).map(([key, value]) => (
              <div key={key}>
                <h3 className="font-medium text-primary">{sectionLabels[key] || key}</h3>
                <p className="mt-2 text-sm text-slate-700">{Array.isArray(value) ? value.join("；") : value}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
