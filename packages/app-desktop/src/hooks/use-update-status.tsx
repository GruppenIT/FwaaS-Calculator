import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface UpdateContextValue {
  status: UpdateStatus;
  refreshStatus: () => void;
}

const UpdateContext = createContext<UpdateContextValue>({
  status: { state: 'idle' },
  refreshStatus: () => {},
});

/**
 * Provider que mantém o status de atualização sincronizado com o main process.
 * Deve ficar sempre montado (no App) para não perder broadcasts do IPC.
 */
export function UpdateProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });

  const refreshStatus = useCallback(() => {
    window.causaElectron?.getUpdateStatus()
      .then((s) => { if (s) setStatus(s); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshStatus();
    const unsub = window.causaElectron?.onUpdateStatus((s) => setStatus(s));
    return () => { unsub?.(); };
  }, [refreshStatus]);

  return (
    <UpdateContext.Provider value={{ status, refreshStatus }}>
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdateStatus() {
  return useContext(UpdateContext);
}
