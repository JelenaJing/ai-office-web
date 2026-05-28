import type { ReactNode } from "react";
import { DatabaseModeProvider } from "../../contexts/DatabaseModeContext";

export function ReadonlyDatabaseShell({ children }: { children: ReactNode }) {
  return <DatabaseModeProvider readonly>{children}</DatabaseModeProvider>;
}
