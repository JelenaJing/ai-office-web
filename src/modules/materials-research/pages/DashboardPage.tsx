import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, DashboardFull } from "../services/api";
import { MetricCard } from "../components/common/MetricCard";
import { SectionCard } from "../components/common/SectionCard";
import { ReproducibilityTrendChart } from "../components/charts/ReproducibilityTrendChart";
import { AssetCompositionChart } from "../components/charts/AssetCompositionChart";
import { Atom, Battery, ArrowRight, Gem, Package } from "lucide-react";
import { FileUploadButton } from "../components/common/FileUploadButton";
import { usePlatformActions, runAction } from "../hooks/usePlatformActions";
import { uploadLiteratureFile } from "../services/upload";
import { useUiStore } from "../store/uiStore";
import { useActiveTenant } from "../store/tenantStore";
import { useTenantStore } from "../store/tenantStore";

export function DashboardPage() {
  const tenant = useActiveTenant();
  const tenantId = useTenantStore((s) => s.tenantId);
  const { createExperiment, showEvidenceFor, executeSuggestion } = usePlatformActions();
  const showMessage = useUiStore((s) => s.showMessage);

  const handleUpload = async (file: File) => {
    const res = await runAction(() => uploadLiteratureFile(file, { sourceType: "文献" }));
    if (res) showMessage("上传完成", res.message, res.fileName);
  };
  const [data, setData] = useState<DashboardFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.dashboard
      .full()
      .then(setData)
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) return <p className="text-muted">加载中…</p>;
  if (!data) return <p className="text-danger">加载失败，请确认后端服务已启动。</p>;

  const showPolymerBattery = tenant.domains.includes("polymer") || tenant.domains.includes("battery");
  const showSic = tenant.domains.includes("sic");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary to-accent p-8 text-white shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{tenant.branding.heroTitle}</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/90">{tenant.branding.heroSubtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FileUploadButton label="上传文献 / 专利" variant="ghost" onFile={handleUpload} className="!px-4 !py-2 !text-sm" />
            <button type="button" onClick={() => createExperiment()} className="rounded-lg bg-white px-4 py-2 text-sm text-primary hover:bg-white/90">
              创建实验记录
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {data.metricCards.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} change={m.change} />
        ))}
      </div>

      {showPolymerBattery && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="呋喃基高分子研发" subtitle="从单体结构、聚合路线、反应条件到热性能、力学性能和电化学关联性能，构建高分子研发闭环。">
            <ul className="space-y-2 text-sm text-slate-700">
              {["单体知识库", "聚合路线库", "配方推荐", "性能预测", "实验可复现性检查"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Atom className="h-4 w-4 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/polymer/monomers" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              进入高分子研发 <ArrowRight className="h-4 w-4" />
            </Link>
          </SectionCard>
          <SectionCard title="电池材料研发" subtitle="围绕硬碳负极、磷酸铁锂正极与软包性能优化，建立电池材料数据标准化与推荐分析能力。">
            <ul className="space-y-2 text-sm text-slate-700">
              {["硬碳原料库", "正极数据可信度", "扣电 / 软包关联", "原料—工艺—结构—性能图谱"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/battery/hard-carbon" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              进入电池材料研发 <ArrowRight className="h-4 w-4" />
            </Link>
          </SectionCard>
        </div>
      )}

      {showSic && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="SiC 籽晶粘贴与压合" subtitle="喷胶、软压、硬压参数记录与工艺窗口推荐。">
            <ul className="space-y-2 text-sm text-slate-700">
              {["喷胶工艺记录", "压合实验矩阵", "参数敏感性分析", "下一轮推荐"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Gem className="h-4 w-4 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/optimization" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              进入工艺优化 <ArrowRight className="h-4 w-4" />
            </Link>
          </SectionCard>
          <SectionCard title="来料与批次追溯" subtitle="胶水、籽晶、石墨纸批次与缺陷图像全链路追溯。">
            <ul className="space-y-2 text-sm text-slate-700">
              {["来料质检", "批次台账", "样品谱系", "待隔离批次"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/batches" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              进入批次追溯 <ArrowRight className="h-4 w-4" />
            </Link>
          </SectionCard>
        </div>
      )}

      <SectionCard title="今日智能建议" subtitle="基于本地化知识库与实验数据的研发建议，均附证据链与风险提示。">
        <ul className="divide-y divide-slate-100">
          {data.suggestions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0">
              <div>
                <p className="font-medium text-slate-800">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.description}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => showEvidenceFor("suggestion", s.id)} className="rounded-lg border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50">
                  查看证据
                </button>
                <button type="button" onClick={() => executeSuggestion(s.id)} className="rounded-lg bg-primary px-3 py-1 text-xs text-white hover:bg-primary/90">
                  {s.action}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={showSic ? "工艺数据闭环趋势" : "实验可复现性趋势"}>
          <ReproducibilityTrendChart data={data.reproducibilityTrend} />
        </SectionCard>
        <SectionCard title="研发数据资产构成">
          <AssetCompositionChart data={data.assetComposition} />
        </SectionCard>
      </div>

      <SectionCard title="近期项目输出">
        <ul className="space-y-3">
          {data.recentOutputs.map((o) => (
            <li key={o.title} className="flex justify-between rounded-lg border border-slate-100 px-4 py-3 text-sm">
              <span className="font-medium">{o.title}</span>
              <span className="text-muted">
                {o.type} · {o.date}
              </span>
            </li>
          ))}
        </ul>
        <Link to="/outputs" className="mt-4 inline-block text-sm text-primary hover:underline">
          查看全部输出 →
        </Link>
      </SectionCard>
    </div>
  );
}
