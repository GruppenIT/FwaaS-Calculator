import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

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
 *
 * Usa polling a cada 3s como fallback, pois o listener IPC via contextBridge
 * pode não funcionar corretamente em todas as versões do Electron.
 */
export function UpdateProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
  const statusRef = useRef(status);

  const refreshStatus = useCallback(() => {
    window.causaElectron?.getUpdateStatus()
      .then((s) => {
        if (s && s.state) {
          // Só atualiza se o estado realmente mudou
          if (s.state !== statusRef.current.state || s.version !== statusRef.current.version || s.percent !== statusRef.current.percent) {
            console.log('[UpdateProvider] Status via poll:', s.state, s.version ?? '');
            statusRef.current = s;
            setStatus(s);
          }
        }
      })
      .catch((err) => {
        console.error('[UpdateProvider] getUpdateStatus error:', err);
      });
  }, []);

  useEffect(() => {
    console.log('[UpdateProvider] Montando. causaElectron disponível:', !!window.causaElectron);

    // Poll inicial
    refreshStatus();

    // Listener IPC (pode não funcionar via contextBridge em alguns cenários)
    const unsub = window.causaElectron?.onUpdateStatus((s) => {
      console.log('[UpdateProvider] Status via listener:', (s as UpdateStatus)?.state);
      if (s && (s as UpdateStatus).state) {
        statusRef.current = s as UpdateStatus;
        setStatus(s as UpdateStatus);
      }
    });

    // Polling periódico como fallback robusto
    const interval = setInterval(refreshStatus, 3000);

    return () => {
      unsub?.();
      clearInterval(interval);
    };
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
