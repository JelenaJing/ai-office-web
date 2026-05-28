import { useEffect, useState } from "react";
import { api, BatteryFull } from "../services/api";
import { PageHeader } from "../components/common/PageHeader";
import { SectionCard } from "../components/common/SectionCard";
import { MetricCard } from "../components/common/MetricCard";
import { BatteryCycleLineChart } from "../components/charts/BatteryCycleLineChart";
import { ReliabilityDistributionChart } from "../components/charts/ReliabilityDistributionChart";
import { CoinToPouchScatterChart } from "../components/charts/CoinToPouchScatterChart";
import { usePlatformActions } from "../hooks/usePlatformActions";
import { runAction } from "../hooks/usePlatformActions";

export function BatteryTestingPage() {
  const { reviewAnomaly, showEvidenceFor } = usePlatformActions();
  const [data, setData] = useState<BatteryFull | null>(null);

  useEffect(() => {
    runAction(() => api.battery.testingFull()).then((d) => d && setData(d));
  }, []);

  if (!data) return <p className="text-muted">加载中…</p>;

  const o = data.overview;

  return (
    <div className="space-y-6">
      <PageHeader
        title="电池数据分析"
        description="识别测试条件差异、异常数据和可信度等级，判断数据是否适合进入模型训练。"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="测试记录数" value={o.totalRecords.toLocaleString()} />
        <MetricCard label="有效记录数" value={o.validRecords.toLocaleString()} />
        <MetricCard label="缺失关键条件" value={o.missingConditions.toLocaleString()} />
        <MetricCard label="异常记录" value={String(o.anomalyRecords)} />
        <MetricCard label="平均可信度" value={`${o.averageReliability}/100`} />
        <MetricCard label="可用于模型训练" value={o.modelReadyCount.toLocaleString()} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="循环容量曲线">
          <BatteryCycleLineChart curves={data.cycleCurves} />
        </SectionCard>
        <SectionCard title="可信度分布">
          <ReliabilityDistributionChart data={data.reliabilityDistribution.map((d) => ({ label: d.label, count: d.count }))} />
        </SectionCard>
      </div>

      <SectionCard title="扣电 / 软包关联分析">
        <CoinToPouchScatterChart data={data.coinPouch} />
      </SectionCard>

      <SectionCard title="异常数据列表">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-muted">
            <tr>
              <th className="p-2">数据编号</th>
              <th className="p-2">样品</th>
              <th className="p-2">异常类型</th>
              <th className="p-2">说明</th>
              <th className="p-2">建议处理</th>
              <th className="p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.anomalies.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-2 font-mono text-xs">{a.id}</td>
                <td className="p-2">{a.sampleId}</td>
                <td className="p-2 text-danger">{a.anomalyType}</td>
                <td className="p-2">{a.description}</td>
                <td className="p-2 text-accent">{a.suggestion}</td>
                <td className="p-2">
                  <button type="button" onClick={() => reviewAnomaly(a.id)} className="mr-2 rounded border px-2 py-0.5 text-xs hover:bg-slate-50">
                    提交复核
                  </button>
                  <button type="button" onClick={() => showEvidenceFor("anomaly", a.id)} className="text-xs text-primary hover:underline">
                    查看证据
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
