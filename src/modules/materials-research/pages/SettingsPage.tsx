import { useEffect, useState } from "react";
import { api, PlatformSettings, UploadedDocument } from "../services/api";
import { PageHeader } from "../components/common/PageHeader";
import { SectionCard } from "../components/common/SectionCard";
import { FileUploadButton } from "../components/common/FileUploadButton";
import { useAppStore } from "../store/appStore";
import { useUiStore } from "../store/uiStore";
import { runAction } from "../hooks/usePlatformActions";
import { uploadLiteratureFile, triggerFileDownload } from "../services/upload";

export function SettingsPage() {
  const applySettings = useAppStore((s) => s.applySettings);
  const { showToast } = useUiStore();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [storage, setStorage] = useState<{ totalSizeMB: number; documentCount: number; totalFiles: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    const [s, docs, st] = await Promise.all([
      runAction(() => api.settings.get()),
      runAction(() => api.library.documents()),
      runAction(() => api.data.storageStats()),
    ]);
    if (s) {
      setSettings(s);
      applySettings(s);
    }
    if (docs) setDocuments(docs);
    if (st) setStorage(st);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const res = await runAction(() => api.settings.update(settings));
    if (res) {
      applySettings(res.settings);
      setSettings(res.settings);
      showToast(res.message);
    }
    setSaving(false);
  };

  const sync = async () => {
    setSyncing(true);
    const res = await runAction(() => api.data.sync());
    if (res) {
      showToast(res.message);
      await load();
    }
    setSyncing(false);
  };

  const handleUpload = async (file: File) => {
    const res = await runAction(() => uploadLiteratureFile(file, { sourceType: "文献" }));
    if (res) {
      showToast(res.message);
      await load();
    }
  };

  const removeDoc = async (id: string) => {
    const res = await runAction(() => api.library.deleteDocument(id));
    if (res) {
      showToast(res.message);
      await load();
    }
  };

  if (!settings) return <p className="text-muted">加载中…</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="系统设置"
        description="管理项目信息、知识库同步、数据存储与用户偏好。所有配置保存在本地服务器。"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="项目与课题组">
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="text-muted">项目名称</span>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={settings.projectName}
                onChange={(e) => setSettings({ ...settings, projectName: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">所属单位</span>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={settings.organization}
                onChange={(e) => setSettings({ ...settings, organization: e.target.value })}
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="用户与权限">
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="text-muted">当前用户</span>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={settings.currentUser}
                onChange={(e) => setSettings({ ...settings, currentUser: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">角色</span>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={settings.userRole}
                onChange={(e) => setSettings({ ...settings, userRole: e.target.value })}
              >
                <option value="PI">PI / 课题组负责人</option>
                <option value="admin">课题组管理员</option>
                <option value="student">学生</option>
                <option value="guest">访客</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted">联系邮箱</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="知识库与同步">
          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoSync}
                onChange={(e) => setSettings({ ...settings, autoSync: e.target.checked })}
              />
              启用定时自动同步本地知识库
            </label>
            <label className="block">
              <span className="text-muted">同步间隔（小时）</span>
              <input
                type="number"
                min={1}
                max={168}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={settings.syncIntervalHours}
                onChange={(e) => setSettings({ ...settings, syncIntervalHours: Number(e.target.value) })}
              />
            </label>
            <p className="text-xs text-muted">上次同步：{settings.lastSyncAt || "—"}</p>
            <button
              type="button"
              onClick={sync}
              disabled={syncing}
              className="rounded-lg border border-primary px-4 py-2 text-sm text-primary hover:bg-primary/5 disabled:opacity-50"
            >
              {syncing ? "同步中…" : "立即同步知识库"}
            </button>
          </div>
        </SectionCard>

        <SectionCard title="实验与通知">
          <div className="space-y-4 text-sm">
            <label className="block">
              <span className="text-muted">默认 ELN 模板</span>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={settings.defaultElnTemplate}
                onChange={(e) => setSettings({ ...settings, defaultElnTemplate: e.target.value })}
              >
                {[
                  "呋喃基聚合实验模板",
                  "聚合物性能测试模板",
                  "硬碳前驱体制备模板",
                  "扣式电池组装模板",
                  "软包电池测试模板",
                  "磷酸铁锂数据录入模板",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.notifyOnReview}
                onChange={(e) => setSettings({ ...settings, notifyOnReview: e.target.checked })}
              />
              实验记录提交复核时通知
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.notifyOnAnomaly}
                onChange={(e) => setSettings({ ...settings, notifyOnAnomaly: e.target.checked })}
              />
              电池数据异常时通知
            </label>
            <label className="block">
              <span className="text-muted">数据保留天数</span>
              <input
                type="number"
                min={30}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={settings.dataRetentionDays}
                onChange={(e) => setSettings({ ...settings, dataRetentionDays: Number(e.target.value) })}
              />
            </label>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="数据存储"
        subtitle={storage ? `已用 ${storage.totalSizeMB} MB · ${storage.documentCount} 个已索引文档 · 共 ${storage.totalFiles} 个文件` : ""}
        action={<FileUploadButton label="上传文献/数据" variant="outline" onFile={handleUpload} />}
      >
        {documents.length === 0 ? (
          <p className="text-sm text-muted">暂无上传文件。可通过上方按钮或顶栏「上传文献」导入 PDF、Word、Excel 等文件。</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-muted">
              <tr>
                <th className="p-2">文件名</th>
                <th className="p-2">类型</th>
                <th className="p-2">大小</th>
                <th className="p-2">上传时间</th>
                <th className="p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="p-2 font-medium">{d.fileName}</td>
                  <td className="p-2">{d.sourceType || d.category}</td>
                  <td className="p-2">{(d.sizeBytes / 1024).toFixed(1)} KB</td>
                  <td className="p-2 text-xs text-muted">{d.uploadedAt}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => triggerFileDownload(`/api/library/documents/${d.id}/download`, d.fileName)}
                      className="mr-2 text-xs text-primary hover:underline"
                    >
                      下载
                    </button>
                    <button type="button" onClick={() => removeDoc(d.id)} className="text-xs text-danger hover:underline">
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={load} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
          重新加载
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-primary px-6 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存设置"}
        </button>
      </div>
    </div>
  );
}
