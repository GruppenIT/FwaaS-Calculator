import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

interface UpdateContextValue {
  status: UpdateStatus;
  refreshStatus: () => void;
}

const UpdateContext = createContext<UpdateContextValue>({
  status: { state: 'idle' },
  refreshStatus: () => {},
});

function log(level: string, msg: string) {
  window.causaElectron?.logToMain(level, msg);
}

/**
 * Provider que mantém o status de atualização sincronizado com o main process.
 * Deve ficar sempre montado (no App) para não perder broadcasts do IPC.
 *
 * Usa polling a cada 3s como fallback robusto.
 */
export function UpdateProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
  const statusRef = useRef(status);

  const refreshStatus = useCallback(() => {
    window.causaElectron
      ?.getUpdateStatus()
      .then((s) => {
        if (s && s.state) {
          if (
            s.state !== statusRef.current.state ||
            s.version !== statusRef.current.version ||
            s.percent !== statusRef.current.percent
          ) {
            log('INFO', `Status via poll: ${s.state} ${s.version ?? ''}`);
            statusRef.current = s;
            setStatus(s);
          }
        }
      })
      .catch((err) => {
        log('ERROR', `getUpdateStatus error: ${err}`);
      });
  }, []);

  useEffect(() => {
    log('INFO', `UpdateProvider montando. causaElectron: ${!!window.causaElectron}`);

    // Poll inicial
    refreshStatus();

    // Listener IPC
    const unsub = window.causaElectron?.onUpdateStatus((s) => {
      const us = s as UpdateStatus;
      log('INFO', `Status via listener: ${us?.state} ${us?.version ?? ''}`);
      if (us?.state) {
        statusRef.current = us;
        setStatus(us);
      }
    });

    log('INFO', `Listener registrado: ${typeof unsub === 'function'}`);

    // Polling periódico como fallback robusto
    const interval = setInterval(refreshStatus, 3000);

    return () => {
      unsub?.();
      clearInterval(interval);
    };
  }, [refreshStatus]);

  return (
    <UpdateContext.Provider value={{ status, refreshStatus }}>{children}</UpdateContext.Provider>
  );
}

export function useUpdateStatus() {
  return useContext(UpdateContext);
}
