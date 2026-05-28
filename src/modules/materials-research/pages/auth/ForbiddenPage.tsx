import { Link } from "react-router-dom";
import { useSessionStore } from "../../store/sessionStore";
import { getDefaultRoute } from "../../lib/auth";

export function ForbiddenPage() {
  const user = useSessionStore((s) => s.user);
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl font-bold text-primary">无权访问</h1>
      <p className="mt-2 text-sm text-muted">当前账号无法访问该页面。</p>
      {user && (
        <Link to={getDefaultRoute(user)} className="mt-6 inline-block text-sm text-primary hover:underline">
          返回我的首页
        </Link>
      )}
    </div>
  );
}
