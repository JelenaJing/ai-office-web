import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { getRoleNav } from "../../config/roleNavigation";
import { useSessionStore } from "../../store/sessionStore";

export function RoleSidebar() {
  const user = useSessionStore((s) => s.user);
  if (!user) return null;
  const groups = getRoleNav(user);

  return (
    <nav className="flex-1 overflow-y-auto p-3">
      {groups.map((group) => (
        <div key={group.label || "main"} className="mb-4">
          {group.label && (
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-white/50">{group.label}</p>
          )}
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.endsWith("/dashboard") || item.to.endsWith("/databases")}
              className={({ isActive }) =>
                clsx(
                  "mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
