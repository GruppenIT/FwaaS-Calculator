import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { CausaLogo } from './ui/causa-logo';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Overlay que aparece quando há uma atualização disponível.
 * Mostra opções ao usuário, progresso do download e botão para reiniciar.
 */
export function UpdateOverlay() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
  const [dismissed, setDismissed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshStatus = useCallback(() => {
    window.causaElectron?.getUpdateStatus().then((s) => {
      if (s) setStatus(s);
    }).catch((err) => {
      console.warn('[UpdateOverlay] Erro ao obter status:', err);
    });
  }, []);

  useEffect(() => {
    // Buscar status atual ao montar
    refreshStatus();

    // Escutar mudanças de status em tempo real
    const unsub = window.causaElectron?.onUpdateStatus((s) => {
      setStatus(s);
      if (s.state === 'available') {
        setDismissed(false);
      }
    });

    // Polling como fallback: se o evento IPC foi perdido (race condition no startup),
    // o polling garante que o overlay apareça quando o status mudar.
    pollRef.current = setInterval(refreshStatus, 3000);

    return () => {
      unsub?.();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshStatus]);

  // Parar polling quando o overlay estiver visível (não precisa mais)
  useEffect(() => {
    if (status.state === 'available' || status.state === 'downloading' || status.state === 'downloaded') {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [status.state]);

  function handleChoice(choice: UpdateUserChoice) {
    if (choice === 'ignore') {
      setDismissed(true);
    }
    window.causaElectron?.respondToUpdate(choice);
  }

  function handleRestart() {
    window.causaElectron?.restartAndUpdate();
  }

  function handleRetry() {
    window.causaElectron?.checkForUpdate();
  }

  // Determinar se o overlay deve ser visível
  const showOverlay =
    (status.state === 'available' && !dismissed) ||
    (status.state === 'downloading' && !status.background) ||
    (status.state === 'downloaded' && !status.background) ||
    status.state === 'restarting';

  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--color-bg)] flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <CausaLogo size={48} />
        </div>

        {/* Available — pergunta ao usuário */}
        {status.state === 'available' && !dismissed && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Download size={20} className="text-[var(--color-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  Nova versão disponível
                </h2>
              </div>
              {status.version && (
                <p className="text-sm-causa text-[var(--color-text-muted)] mb-1">
                  Versão <span className="font-medium text-[var(--color-primary)]">v{status.version}</span>
                </p>
              )}
              {status.releaseNotes && (
                <p className="text-xs-causa text-[var(--color-text-muted)] mt-2 max-h-24 overflow-y-auto text-left whitespace-pre-line rounded-[var(--radius-md)] bg-causa-surface-alt p-3 border border-[var(--color-border)]">
                  {status.releaseNotes}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => handleChoice('install-now')}
                className="w-full justify-center"
              >
                <Download size={16} className="mr-2" />
                Baixar e instalar agora
              </Button>

              <Button
                variant="ghost"
                onClick={() => handleChoice('install-later')}
                className="w-full justify-center"
              >
                <RefreshCw size={16} className="mr-2" />
                Baixar em segundo plano e instalar depois
              </Button>

              <button
                type="button"
                onClick={() => handleChoice('ignore')}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-sm-causa text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer transition-colors"
              >
                Ignorar esta atualização
              </button>
            </div>
          </div>
        )}

        {/* Downloading (foreground) */}
        {status.state === 'downloading' && !status.background && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Download size={20} className="text-[var(--color-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  Atualizando CAUSA
                </h2>
              </div>
              <p className="text-sm-causa text-[var(--color-text-muted)]">
                Baixando nova versão... Não feche o programa.
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-3 rounded-full bg-causa-surface-alt overflow-hidden border border-[var(--color-border)]">
                <div
                  className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, status.percent ?? 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs-causa text-[var(--color-text-muted)]">
                <span>
                  {status.transferred != null && status.total != null
                    ? `${formatBytes(status.transferred)} de ${formatBytes(status.total)}`
                    : 'Preparando...'}
                </span>
                <span>
                  {status.percent != null ? `${status.percent.toFixed(0)}%` : ''}
                  {status.bytesPerSecond != null ? ` — ${formatBytes(status.bytesPerSecond)}/s` : ''}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Downloaded (foreground) — pronto para reiniciar */}
        {status.state === 'downloaded' && !status.background && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 size={20} className="text-causa-success" />
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  Atualização concluída!
                </h2>
              </div>
              {status.version && (
                <p className="text-sm-causa text-[var(--color-text-muted)] mb-1">
                  Nova versão: <span className="font-medium text-[var(--color-primary)]">v{status.version}</span>
                </p>
              )}
              <p className="text-sm-causa text-[var(--color-text-muted)]">
                O programa será reiniciado para aplicar a atualização.
                As migrações de banco de dados serão aplicadas automaticamente.
              </p>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleRestart} className="px-8">
                OK — Reiniciar agora
              </Button>
            </div>
          </div>
        )}

        {/* Restarting */}
        {status.state === 'restarting' && (
          <div className="text-center space-y-4">
            <Loader2 size={32} className="animate-spin text-[var(--color-primary)] mx-auto" />
            <p className="text-sm-causa text-[var(--color-text-muted)]">
              Reiniciando...
            </p>
          </div>
        )}

        {/* Error */}
        {status.state === 'error' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle size={20} className="text-causa-danger" />
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  Erro na atualização
                </h2>
              </div>
              {status.error && (
                <p className="text-sm-causa text-[var(--color-text-muted)] break-all">
                  {status.error}
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" onClick={handleRetry}>
                <RefreshCw size={16} className="mr-1.5" />
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
