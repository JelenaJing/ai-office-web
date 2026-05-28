import { useNavigate } from "react-router-dom";
import { api, PolymerRecommendation, GeneratedReport } from "../services/api";
import { useUiStore } from "../store/uiStore";
import { pickFile, uploadLiteratureFile, triggerFileDownload, uploadElnAttachment } from "../services/upload";

export async function runAction<T>(fn: () => Promise<T>): Promise<T | undefined> {
  const { setBusy, showToast } = useUiStore.getState();
  setBusy(true);
  try {
    return await fn();
  } catch {
    showToast("请求未能完成，请检查网络连接后重试。", "info");
    return undefined;
  } finally {
    setBusy(false);
  }
}

export function usePlatformActions() {
  const navigate = useNavigate();
  const { showToast, showEvidence, showMessage } = useUiStore();

  const requireRecord = (recordId: string | null, action: (id: string) => void) => {
    if (!recordId) {
      showToast("请先在列表中选择一条实验记录。", "info");
      return;
    }
    action(recordId);
  };

  const uploadLiterature = async () => {
    const file = await pickFile(".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.json,.zip");
    if (!file) return;
    const res = await runAction(() => uploadLiteratureFile(file, { sourceType: "文献" }));
    if (!res) return;
    showMessage(
      "上传完成",
      res.message,
      `文件：${res.fileName}（${(res.sizeBytes / 1024).toFixed(1)} KB）`
    );
  };

  const uploadElnRawData = async (recordId: string, onDone?: () => void) => {
    const file = await pickFile(".csv,.xlsx,.xls,.txt,.json,.zip,.pdf");
    if (!file) return;
    const res = await runAction(() => uploadElnAttachment(recordId, file));
    if (!res) return;
    showToast(res.message);
    onDone?.();
  };

  const createExperiment = async (templateId = "tpl-polymer") => {
    const res = await runAction(() => api.actions.createExperiment({ templateId }));
    if (!res) return;
    showMessage("实验记录已创建", res.message, `编号：${res.recordId}`);
    navigate("/research/tools/eln", { state: { highlightRecordId: res.recordId } });
  };

  const showEvidenceFor = async (contextType: string, contextId: string) => {
    const res = await runAction(() => api.actions.getEvidence(contextType, contextId));
    if (!res) return;
    showEvidence(res.title, res.items);
  };

  const executeSuggestion = async (suggestionId: string) => {
    const res = await runAction(() => api.actions.executeSuggestion(suggestionId));
    if (!res) return;
    showToast(res.message);
    if (res.redirect) {
      navigate(res.redirect, res.recordId ? { state: { highlightRecordId: res.recordId } } : undefined);
    }
  };

  const generateRoutes = async (monomerId: string) => {
    const res = await runAction(() => api.actions.generateRoutes(monomerId));
    if (!res) return;
    showMessage("聚合路线已生成", res.message, res.routes.map((r) => r.description).join("\n"));
  };

  const addToCandidates = async (monomerId: string) => {
    const res = await runAction(() => api.actions.addToCandidates(monomerId));
    if (!res) return;
    showToast(res.message);
  };

  const searchRecommendations = async (
    body: { targets: string[]; extraGoal?: string },
    onResult: (recs: PolymerRecommendation[]) => void
  ) => {
    const res = await runAction(() => api.polymer.searchRecommendations(body));
    if (!res) return;
    onResult(res.recommendations);
    showToast(res.message);
  };

  const createElnFromRecommendation = async (recId: string) => {
    const res = await runAction(() => api.polymer.createEln(recId));
    if (!res) return;
    showMessage("实验记录已生成", "已根据推荐方案预填实验模板，请补全原料批次与工艺参数。", `记录编号：${res.elnId}`);
    navigate("/research/tools/eln", { state: { prefill: res.prefill, highlightRecordId: res.elnId } });
  };

  const elnFillFields = async (recordId: string, onDone?: () => void) => {
    const res = await runAction(() => api.actions.elnFillFields(recordId));
    if (!res) return;
    showToast(res.message);
    if (res.record) {
      onDone?.();
    } else {
      onDone?.();
    }
  };

  const elnGenerateSop = async (recordId: string, onDone?: () => void) => {
    const res = await runAction(() => api.actions.elnGenerateSop(recordId));
    if (!res) return;
    showMessage("SOP 已生成", res.message, res.sopText?.slice(0, 200) || `文档编号：${res.sopId}`);
    onDone?.();
  };

  const elnSubmitReview = async (recordId: string, onDone?: () => void) => {
    const res = await runAction(() => api.actions.elnSubmitReview(recordId));
    if (!res) return;
    showToast(res.message);
    onDone?.();
  };

  const exportReport = async (templateId: string, format = "word") => {
    const res = await runAction(() => api.actions.exportReport(templateId, format));
    if (!res) return;
    showToast(res.message);
    if (res.downloadUrl) triggerFileDownload(res.downloadUrl, res.fileName);
  };

  const generateReportPreview = async (
    templateId: string,
    onResult: (report: GeneratedReport) => void
  ) => {
    const res = await runAction(() => api.outputs.generate(templateId, ["实验记录", "文献", "测试数据"]));
    if (!res) return;
    onResult(res);
    showToast(res.message);
  };

  const generateProjectSummary = async (onResult: (summary: string) => void) => {
    const res = await runAction(() => api.innovation.projectSummary());
    if (!res) return;
    onResult(res.summary);
    showToast(res.message);
  };

  const viewHardCarbonDetail = async (materialId: string) => {
    const res = await runAction(() => api.battery.hardCarbonDetail(materialId));
    if (!res) return;
    showMessage(
      res.name,
      res.suggestedProcess || "",
      `首效 ${res.initialCoulombicEfficiency}% · 容量 ${res.reversibleCapacity} mAh/g · 可信度 ${res.reliability}`
    );
  };

  const hardCarbonExperimentPlan = async (materialId: string) => {
    const res = await runAction(() => api.battery.hardCarbonExperimentPlan(materialId));
    if (!res) return;
    showMessage("实验方案已生成", res.message, `方案编号：${res.planId}，测试项：${res.tests.join("、")}`);
    if (res.redirect) navigate(res.redirect);
  };

  const reviewAnomaly = async (anomalyId: string) => {
    const res = await runAction(() => api.battery.reviewAnomaly(anomalyId));
    if (!res) return;
    showToast(res.message);
  };

  return {
    requireRecord,
    uploadLiterature,
    uploadElnRawData,
    createExperiment,
    showEvidenceFor,
    executeSuggestion,
    generateRoutes,
    addToCandidates,
    searchRecommendations,
    createElnFromRecommendation,
    elnFillFields,
    elnGenerateSop,
    elnSubmitReview,
    exportReport,
    generateReportPreview,
    generateProjectSummary,
    viewHardCarbonDetail,
    hardCarbonExperimentPlan,
    reviewAnomaly,
  };
}
