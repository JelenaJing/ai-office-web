import { useNavigate } from "react-router-dom";
import { LogOut, Bell } from "lucide-react";
import { useSessionStore } from "../../store/sessionStore";

export function RoleTopBar() {
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
      <span className="text-sm font-medium text-slate-800">{user.name}</span>
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-lg p-2 text-muted hover:bg-slate-100" title="通知">
          <Bell className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          退出
        </button>
      </div>
    </header>
  );
}
