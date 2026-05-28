import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, Upload } from "lucide-react";
import { mockApi, DatabaseCard } from "../../services/mockApi";
import { PageHeader } from "../../components/common/PageHeader";
import { DatabaseOverviewGrid } from "../../components/databases/DatabaseOverviewGrid";

const PUBLIC_ROUTES: Record<string, string> = {
  papers: "/research/database/papers",
  monomers: "/research/database/monomers",
  polymers: "/research/database/polymers",
  reactions: "/research/database/reactions",
  "battery-materials": "/research/database/battery-materials",
};

const HIDDEN_FOR_STUDENT = new Set(["experiments", "papers"]);

export function StudentDatabasesOverviewPage() {
  const [dbs, setDbs] = useState<DatabaseCard[]>([]);

  useEffect(() => {
    mockApi.databasesOverview().then((r) => setDbs(r.databases)).catch(() => undefined);
  }, []);

  const publicDbs = dbs.filter((d) => !HIDDEN_FOR_STUDENT.has(d.id));

  const myLibraryCard = (
    <div className="rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 p-5">
      <div className="flex items-center gap-2">
        <FolderOpen className="h-5 w-5 text-accent" />
        <h3 className="font-medium text-slate-800">我的文献库</h3>
      </div>
      <p className="mt-2 text-xs text-muted">上传与管理个人文献与笔记，即时入库，无需导师审核。</p>
      <Link
        to="/research/database/my-library"
        className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <Upload className="h-3.5 w-3.5" />
        管理我的文献 →
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="数据库" description="浏览课题组公共数据；个人文献在「我的文献库」中上传与管理。" />
      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-700">个人空间</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{myLibraryCard}</div>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-700">课题组公共库</h2>
        <DatabaseOverviewGrid databases={publicDbs} routes={PUBLIC_ROUTES} actionLabel="查看" />
      </section>
    </div>
  );
}
