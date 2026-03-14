import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useUpdateStatus } from '../hooks/use-update-status';

const DISMISS_KEY = 'causa:update-dismissed-version';

/**
 * Banner exibido após login quando há versão nova disponível.
 * O usuário pode dispensar com checkbox "não mostrar novamente"
 * (armazena a versão dispensada; só volta a mostrar para versões novas).
 */
export function UpdateBanner() {
  const { status } = useUpdateStatus();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Só exibir quando há atualização disponível (não durante download/instalação)
  if (status.state !== 'available') return null;

  // Verificar se o usuário já dispensou esta versão
  const dismissedVersion = localStorage.getItem(DISMISS_KEY);
  if (dismissedVersion && dismissedVersion === status.version) return null;

  if (!visible) return null;

  function handleDismiss() {
    if (dontShowAgain && status.version) {
      localStorage.setItem(DISMISS_KEY, status.version);
    }
    setVisible(false);
  }

  function handleUpdate() {
    navigate('/app/configuracoes');
  }

  return (
    <div className="mx-6 mt-4 mb-0 rounded-[var(--radius-md)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
      <div className="flex items-start gap-3">
        <Download size={20} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm-causa font-medium text-[var(--color-text)]">
            Nova versão disponível
            {status.version && (
              <span className="text-[var(--color-primary)] ml-1">v{status.version}</span>
            )}
          </p>
          <p className="text-xs-causa text-[var(--color-text-muted)] mt-0.5">
            Uma atualização está disponível. Acesse as configurações para baixar e instalar.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <Button compact onClick={handleUpdate}>
              <Download size={14} />
              Atualizar
            </Button>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="accent-[var(--color-primary)] w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-xs-causa text-[var(--color-text-muted)]">
                Não mostrar novamente
              </span>
            </label>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-causa p-1 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
