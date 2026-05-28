import { Outlet } from "react-router-dom";
import clsx from "clsx";
import { RoleSidebar } from "../components/layout/RoleSidebar";
import { RoleTopBar } from "../components/layout/RoleTopBar";
import { GlobalAssistant } from "../components/assistant/GlobalAssistant";
import { useAssistantStore } from "../store/assistantStore";

export function RoleAppShell() {
  const open = useAssistantStore((s) => s.open);

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 z-10 flex h-full w-60 flex-col border-r border-slate-200 bg-primary text-white">
        <div className="border-b border-white/10 p-5">
          <h1 className="text-sm font-bold leading-tight">材料智能研发工作台</h1>
        </div>
        <RoleSidebar />
      </aside>
      <div
        className={clsx(
          "ml-60 flex min-h-screen flex-1 flex-col transition-[margin-right] duration-200",
          open && "mr-[33vw]"
        )}
      >
        <RoleTopBar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <GlobalAssistant />
    </div>
  );
}
