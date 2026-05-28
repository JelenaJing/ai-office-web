import { createContext, useContext, type ReactNode } from "react";

interface DatabaseModeValue {
  readonly: boolean;
}

const DatabaseModeContext = createContext<DatabaseModeValue>({ readonly: false });

export function DatabaseModeProvider({
  readonly,
  children,
}: {
  readonly: boolean;
  children: ReactNode;
}) {
  return <DatabaseModeContext.Provider value={{ readonly }}>{children}</DatabaseModeContext.Provider>;
}

export function useDatabaseMode() {
  return useContext(DatabaseModeContext);
}
