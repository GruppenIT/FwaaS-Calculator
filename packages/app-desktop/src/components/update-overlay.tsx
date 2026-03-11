import { useState, useEffect, useCallback } from 'react';
import { Download, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { CausaLogo } from './ui/causa-logo';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Overlay fullscreen que aparece automaticamente quando há uma atualização.
 * Mostra progresso do download e, ao concluir, botão para reiniciar.
 */
export function UpdateOverlay() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });

  const refreshStatus = useCallback(() => {
    window.causaElectron?.getUpdateStatus().then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    refreshStatus();
    const unsub = window.causaElectron?.onUpdateStatus((s) => setStatus(s));
    return () => { unsub?.(); };
  }, [refreshStatus]);

  // Só mostra o overlay quando está baixando, baixado, reiniciando, ou erro durante update
  const showOverlay =
    status.state === 'downloading' ||
    status.state === 'downloaded' ||
    status.state === 'restarting';

  if (!showOverlay) return null;

  function handleRestart() {
    window.causaElectron?.restartAndUpdate();
  }

  function handleRetry() {
    window.causaElectron?.checkForUpdate();
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--color-bg)] flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <CausaLogo size={48} />
        </div>

        {/* Downloading */}
        {status.state === 'downloading' && (
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

        {/* Downloaded — pronto para reiniciar */}
        {status.state === 'downloaded' && (
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
