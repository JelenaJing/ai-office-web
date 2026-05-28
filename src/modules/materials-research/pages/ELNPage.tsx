import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Trash2, ExternalLink } from "lucide-react";
import { api, ExperimentRecord, ElnCheckResult, ElnTemplate, ElnTemplateField, ElnAttachment } from "../services/api";
import { mockApi } from "../services/mockApi";

const FALLBACK_TEMPLATES: ElnTemplate[] = [
  {
    id: "general",
    name: "通用实验记录",
    fields: [
      { id: "objective", label: "实验目的", section: "process", type: "text", required: true },
      { id: "procedure", label: "实验步骤", section: "process", type: "text", required: true },
      { id: "result", label: "结果与数据", section: "results", type: "text", required: false },
    ],
  },
];
import { PageHeader } from "../components/common/PageHeader";
import { SectionCard } from "../components/common/SectionCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { FileUploadButton } from "../components/common/FileUploadButton";
import { uploadElnAttachment } from "../services/upload";
import { runAction } from "../hooks/usePlatformActions";
import { useUiStore } from "../store/uiStore";

function splitFields(fields: ElnTemplateField[]) {
  const process = fields.filter((f) => f.section !== "results");
  const results = fields.filter((f) => f.section === "results");
  return { process, results };
}

export function ELNPage() {
  const location = useLocation();
  const prefill = (location.state as { prefill?: Record<string, unknown> })?.prefill;
  const highlightId = (location.state as { highlightRecordId?: string })?.highlightRecordId;
  const showToast = useUiStore((s) => s.showToast);
  const [records, setRecords] = useState<ExperimentRecord[]>([]);
  const [templates, setTemplates] = useState<ElnTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [check, setCheck] = useState<ElnCheckResult | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<ElnAttachment[]>([]);
  const [saving, setSaving] = useState(false);

  const refreshRecords = useCallback(async () => {
    try {
      setRecords(await api.eln.records());
    } catch {
      const rows = await mockApi.myElnRecords();
      setRecords(rows as ExperimentRecord[]);
    }
  }, []);

  const refreshCheck = (id: string) => api.eln.check(id).then(setCheck);

  const refreshAttachments = (id: string) => api.eln.attachments(id).then(setAttachments).catch(() => setAttachments([]));

  useEffect(() => {
    void refreshRecords();
    api.eln
      .templatesFull()
      .then(setTemplates)
      .catch(() => setTemplates(FALLBACK_TEMPLATES));
  }, [refreshRecords]);

  useEffect(() => {
    if (highlightId) {
      setSelectedId(highlightId);
      setPendingTemplateId(null);
    }
  }, [highlightId]);

  useEffect(() => {
    if (selectedId) {
      refreshCheck(selectedId);
      refreshAttachments(selectedId);
    } else {
      setCheck(null);
      setAttachments([]);
    }
  }, [selectedId]);

  const selected = records.find((r) => r.id === selectedId);
  const activeTemplate = templates.find(
    (t) => t.id === (selected?.templateId || pendingTemplateId)
  );
  const { process: processFields, results: resultFields } = useMemo(
    () => splitFields(activeTemplate?.fields || []),
    [activeTemplate]
  );

  const isComposing = Boolean(pendingTemplateId && !selectedId);
  const showEditor = Boolean(activeTemplate && (selectedId || pendingTemplateId));
  const editable = isComposing || selected?.status === "draft" || selected?.status === "returned";
  const canDelete = selected && (selected.status === "draft" || selected.status === "returned");
  const canSubmit =
    selected && editable && !isComposing && (selected.missingFields?.length ?? 0) === 0;

  useEffect(() => {
    if (selected?.fieldValues) {
      const v: Record<string, string> = {};
      for (const [k, val] of Object.entries(selected.fieldValues)) {
        v[k] = val == null ? "" : String(val);
      }
      setDraftValues(v);
    }
  }, [selected?.id, selected?.fieldValues]);

  const afterElnAction = () => {
    refreshRecords().then(() => {
      if (selectedId) {
        refreshCheck(selectedId);
        refreshAttachments(selectedId);
      }
    });
  };

  const pickTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    setPendingTemplateId(templateId);
    setSelectedId(null);
    const init: Record<string, string> = { title: "" };
    for (const f of tpl.fields) init[f.key] = "";
    if (prefill) {
      for (const [k, v] of Object.entries(prefill)) {
        init[k] = Array.isArray(v) ? v.join(", ") : String(v ?? "");
      }
    }
    setDraftValues(init);
    setCheck(null);
    setAttachments([]);
  };

  const cancelCompose = () => {
    setPendingTemplateId(null);
    setDraftValues({});
  };

  const saveRecord = async () => {
    if (!activeTemplate || !editable) return;
    setSaving(true);
    try {
      const title = draftValues.title?.trim() || `实验记录 — ${activeTemplate.name}`;
      const { title: _t, ...fields } = draftValues;

      if (isComposing && pendingTemplateId) {
        const res = await api.eln.create({
          templateId: pendingTemplateId,
          title,
          fieldValues: fields,
          prefill: prefill || {},
        });
        setPendingTemplateId(null);
        setSelectedId(res.recordId);
        showToast("实验记录已保存并加入列表");
        await refreshRecords();
        refreshCheck(res.recordId);
        refreshAttachments(res.recordId);
      } else if (selectedId) {
        await api.eln.update(selectedId, { fieldValues: fields, title });
        showToast("已保存");
        afterElnAction();
      }
    } catch {
      showToast("保存失败", "info");
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async () => {
    if (!selectedId || !canDelete) return;
    if (!window.confirm("确定删除该实验记录？")) return;
    try {
      await api.eln.delete(selectedId);
      showToast("已删除");
      setSelectedId(null);
      setPendingTemplateId(null);
      await refreshRecords();
    } catch {
      showToast("无法删除该记录", "info");
    }
  };

  const submitRecord = async () => {
    if (!selectedId || isComposing) return;
    await saveRecord();
    await runAction(() => api.actions.elnSubmitReview(selectedId)).then((res) => {
      if (res) {
        showToast(res.message);
        afterElnAction();
      }
    });
  };

  const renderField = (f: ElnTemplateField) => (
    <label key={f.key} className={`text-sm ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
      <span className="text-muted">
        {f.label}
        {f.required && <span className="text-warning"> *</span>}
      </span>
      {f.type === "textarea" ? (
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-slate-50"
          rows={3}
          disabled={!editable}
          value={draftValues[f.key] ?? ""}
          onChange={(e) => setDraftValues((d) => ({ ...d, [f.key]: e.target.value }))}
        />
      ) : (
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-slate-50"
          disabled={!editable}
          value={draftValues[f.key] ?? ""}
          onChange={(e) => setDraftValues((d) => ({ ...d, [f.key]: e.target.value }))}
        />
      )}
    </label>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="实验记录 ELN"
        description="选择模板填写内容，保存后才会出现在列表中；保存后可上传原始数据并提交审核。"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="实验记录列表">
            {records.length === 0 ? (
              <p className="text-sm text-muted">暂无已保存记录，请从下方选择模板开始填写。</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-muted">
                  <tr>
                    <th className="p-2">编号</th>
                    <th className="p-2">课题</th>
                    <th className="p-2">样品</th>
                    <th className="p-2">负责人</th>
                    <th className="p-2">状态</th>
                    <th className="p-2">可复现性</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr
                      key={r.id}
                      className={`cursor-pointer border-b hover:bg-slate-50 ${selectedId === r.id ? "bg-primary/5" : ""}`}
                      onClick={() => {
                        setSelectedId(r.id);
                        setPendingTemplateId(null);
                      }}
                    >
                      <td className="p-2 font-medium">{r.title}</td>
                      <td className="p-2">{r.domain === "polymer" ? "高分子" : "电池"}</td>
                      <td className="p-2">{r.sampleId}</td>
                      <td className="p-2">{r.owner}</td>
                      <td className="p-2">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="p-2">{r.reproducibilityScore}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          <SectionCard title="实验模板（选择后填写，保存入库）">
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTemplate(t.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs hover:border-primary hover:bg-primary/5 ${
                    pendingTemplateId === t.id ? "border-primary bg-primary/10" : "border-slate-200"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
            {isComposing && (
              <p className="mt-3 text-xs text-accent">正在编辑新记录（未保存），填写后点击「保存」才会出现在上方列表。</p>
            )}
          </SectionCard>

          {showEditor && (
            <>
              <SectionCard
                title={isComposing ? "新建实验（未保存）" : "实验过程"}
                action={
                  editable ? (
                    <div className="flex gap-2">
                      {isComposing && (
                        <button type="button" onClick={cancelCompose} className="rounded-lg border px-3 py-1.5 text-xs">
                          取消
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={saving}
                        onClick={saveRecord}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white disabled:opacity-60"
                      >
                        {saving ? "保存中…" : "保存"}
                      </button>
                    </div>
                  ) : null
                }
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm md:col-span-2">
                    <span className="text-muted">实验标题</span>
                    <input
                      className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-slate-50"
                      disabled={!editable}
                      value={draftValues.title ?? selected?.title ?? ""}
                      onChange={(e) => setDraftValues((d) => ({ ...d, title: e.target.value }))}
                    />
                  </label>
                  {processFields.map(renderField)}
                </div>
              </SectionCard>

              <SectionCard title="实验结果登记">
                <div className="grid gap-3 md:grid-cols-2">{resultFields.map(renderField)}</div>
              </SectionCard>
            </>
          )}
        </div>

        <div className="space-y-4">
          {selected && check && !isComposing ? (
            <>
              <SectionCard title="可复现性评分">
                <p className="text-4xl font-bold text-primary">
                  {check.reproducibilityScore}
                  <span className="text-lg text-muted">/100</span>
                </p>
                <p className="mt-2 text-sm text-muted">数据完整度：{check.completeness}%</p>
                <p className="text-sm text-muted">关键字段缺失：{check.missingFields.length} 项</p>
              </SectionCard>
              <SectionCard title="操作">
                <ul className="mb-3 space-y-1 text-sm text-slate-700">
                  {check.alerts.map((a, i) => (
                    <li key={i}>• {a}</li>
                  ))}
                  {check.alerts.length === 0 && check.missingFields.length === 0 && <li>必填项已完整</li>}
                </ul>

                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-slate-600">原始数据文件</p>
                  {attachments.length === 0 ? (
                    <p className="text-xs text-muted">暂无上传文件</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {attachments.map((a) => (
                        <li key={a.id} className="flex items-center justify-between rounded-lg border px-2 py-1.5">
                          <span className="truncate pr-2">{a.fileName}</span>
                          <a
                            href={a.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {editable && (
                    <>
                      <FileUploadButton
                        label="上传原始数据文件"
                        variant="outline"
                        accept=".csv,.xlsx,.xls,.txt,.json,.zip,.pdf"
                        className="!w-full !justify-center"
                        onFile={async (file) => {
                          if (!selectedId) return;
                          const res = await runAction(() => uploadElnAttachment(selectedId, file));
                          if (res) {
                            showToast(res.message);
                            afterElnAction();
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={!canSubmit}
                        onClick={submitRecord}
                        className="rounded-lg bg-primary px-3 py-2 text-xs text-white disabled:opacity-50"
                        title={!canSubmit ? "请先保存并补全必填项" : ""}
                      >
                        提交审核
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={deleteRecord}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除记录
                        </button>
                      )}
                    </>
                  )}
                  {selected.status === "review" && (
                    <p className="text-xs text-muted">已提交审核，等待导师确认。</p>
                  )}
                  {selected.status === "approved" && (
                    <p className="text-xs text-muted">导师已确认，记录不可修改或删除。</p>
                  )}
                </div>
              </SectionCard>
            </>
          ) : isComposing ? (
            <SectionCard title="操作提示">
              <p className="text-sm text-muted">填写左侧表单后点击「保存」，记录才会出现在列表中。</p>
            </SectionCard>
          ) : (
            <SectionCard title="操作提示">
              <p className="text-sm text-muted">从列表选择已有记录，或点击模板开始新建。</p>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
