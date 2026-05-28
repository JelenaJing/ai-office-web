import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../../store/sessionStore";
import { getDefaultRoute } from "../../lib/auth";

const DEMO_ACCOUNTS = [
  { username: "teacher_demo", label: "老师账号", desc: "课题组管理、数据库、实验审核" },
  { username: "student_polymer_demo", label: "聚合物方向学生", desc: "配方推荐、性能预测、ELN" },
  { username: "student_battery_demo", label: "电池方向学生", desc: "电池性能预测、材料推荐、ELN" },
  { username: "print_rd_demo", label: "3D打印材料研发", desc: "知识库检索、原料库、实验记录、性能关联" },
];

export function LoginPage() {
  const login = useSessionStore((s) => s.login);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (username: string) => {
    setLoading(username);
    setError("");
    try {
      await login(username);
      const user = useSessionStore.getState().user;
      if (user) navigate(getDefaultRoute(user));
    } catch {
      setError("登录失败，请确认后端服务已启动。");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-primary to-accent p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-primary">材料智能研发工作台</h1>
        <p className="mt-2 text-sm text-muted">材料研发材料研发版 · 演示登录</p>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}
        <div className="mt-8 space-y-3">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.username}
              type="button"
              disabled={!!loading}
              onClick={() => handleLogin(a.username)}
              className="w-full rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
            >
              <p className="font-medium text-slate-800">{a.label}</p>
              <p className="mt-1 text-xs text-muted">{a.desc}</p>
              {loading === a.username && <p className="mt-1 text-xs text-accent">登录中…</p>}
            </button>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted">正式环境将接入学校统一身份认证；当前为 Mock 演示账号。</p>
      </div>
    </div>
  );
}
