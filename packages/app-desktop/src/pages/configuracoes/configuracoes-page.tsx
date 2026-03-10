import { useState, useEffect, useCallback } from 'react';
import { Settings, Save, Moon, Sun, RefreshCw, Download, RotateCcw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { useTheme } from '../../hooks/use-theme';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UpdateSection() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' });
  const appVersion = __APP_VERSION__;

  const refreshStatus = useCallback(() => {
    window.causaElectron?.getUpdateStatus().then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    refreshStatus();
    const unsub = window.causaElectron?.onUpdateStatus((s) => setStatus(s));
    return () => { unsub?.(); };
  }, [refreshStatus]);

  function handleCheck() {
    window.causaElectron?.checkForUpdate();
  }

  function handleDownload() {
    window.causaElectron?.downloadUpdate();
  }

  function handleInstall() {
    window.causaElectron?.installUpdate();
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
      <h3 className="text-base-causa font-semibold text-[var(--color-text)] mb-1">
        Atualizações
      </h3>
      <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
        Versão atual: <span className="font-medium text-[var(--color-text)]">v{appVersion}</span>
      </p>

      {/* Estado: idle ou checking */}
      {(status.state === 'idle' || status.state === 'checking') && (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleCheck}
            disabled={status.state === 'checking'}
          >
            {status.state === 'checking' ? (
              <Loader2 size={16} className="animate-spin mr-1.5" />
            ) : (
              <RefreshCw size={16} className="mr-1.5" />
            )}
            {status.state === 'checking' ? 'Verificando...' : 'Verificar atualizações'}
          </Button>
        </div>
      )}

      {/* Estado: sem atualização */}
      {status.state === 'not-available' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm-causa text-causa-success">
            <CheckCircle2 size={18} />
            <span>Você está na versão mais recente.</span>
          </div>
          <button
            type="button"
            onClick={handleCheck}
            className="text-sm-causa text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer underline"
          >
            Verificar novamente
          </button>
        </div>
      )}

      {/* Estado: atualização disponível */}
      {status.state === 'available' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/20">
            <Download size={18} className="text-[var(--color-primary)] shrink-0" />
            <div className="flex-1">
              <p className="text-sm-causa font-medium text-[var(--color-text)]">
                Nova versão disponível: <span className="text-[var(--color-primary)]">v{status.version}</span>
              </p>
              <p className="text-xs-causa text-[var(--color-text-muted)] mt-0.5">
                O banco de dados será atualizado automaticamente ao reiniciar.
              </p>
            </div>
          </div>
          <Button onClick={handleDownload}>
            <Download size={16} className="mr-1.5" />
            Baixar atualização
          </Button>
        </div>
      )}

      {/* Estado: downloading */}
      {status.state === 'downloading' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 size={18} className="animate-spin text-[var(--color-primary)]" />
            <div className="flex-1">
              <p className="text-sm-causa text-[var(--color-text)]">
                Baixando atualização...
              </p>
              {status.total != null && status.transferred != null && (
                <p className="text-xs-causa text-[var(--color-text-muted)]">
                  {formatBytes(status.transferred)} de {formatBytes(status.total)}
                  {status.bytesPerSecond != null && ` — ${formatBytes(status.bytesPerSecond)}/s`}
                </p>
              )}
            </div>
          </div>
          {/* Barra de progresso */}
          <div className="h-2 rounded-full bg-causa-surface-alt overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, status.percent ?? 0)}%` }}
            />
          </div>
        </div>
      )}

      {/* Estado: downloaded */}
      {status.state === 'downloaded' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-causa-success/8 border border-causa-success/20">
            <CheckCircle2 size={18} className="text-causa-success shrink-0" />
            <div>
              <p className="text-sm-causa font-medium text-[var(--color-text)]">
                Atualização v{status.version} pronta para instalar
              </p>
              <p className="text-xs-causa text-[var(--color-text-muted)] mt-0.5">
                O CAUSA será reiniciado para aplicar a atualização. As migrações de banco de dados serão executadas automaticamente.
              </p>
            </div>
          </div>
          <Button onClick={handleInstall}>
            <RotateCcw size={16} className="mr-1.5" />
            Reiniciar e atualizar
          </Button>
        </div>
      )}

      {/* Estado: erro */}
      {status.state === 'error' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-causa-danger/8 border border-causa-danger/20">
            <AlertCircle size={18} className="text-causa-danger shrink-0" />
            <div>
              <p className="text-sm-causa font-medium text-causa-danger">
                Erro ao verificar atualizações
              </p>
              {status.error && (
                <p className="text-xs-causa text-[var(--color-text-muted)] mt-0.5 break-all">
                  {status.error}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" onClick={handleCheck}>
            <RefreshCw size={16} className="mr-1.5" />
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}

export function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();
  const { can } = usePermission();
  const { toast } = useToast();
  const canManageLicenca = can('licenca:gerenciar');
  const [topologia, setTopologia] = useState<'solo' | 'escritorio'>('solo');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getConfiguracoes()
      .then((config) => {
        setTopologia(config.topologia);
      })
      .catch((err) =>
        toast(err instanceof Error ? err.message : 'Erro ao carregar configurações.', 'error'),
      )
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.atualizarConfiguracoes({ topologia });
      toast('Configurações salvas com sucesso.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Configurações" description="Preferências do sistema" />
        <div className="flex flex-col gap-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6"
            >
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3.5 w-48 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Preferências do sistema" />

      <div className="flex flex-col gap-6">
        {/* Atualizações */}
        <UpdateSection />

        {/* Tema */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
          <h3 className="text-base-causa font-semibold text-[var(--color-text)] mb-1">Aparência</h3>
          <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
            Escolha o tema visual do sistema.
          </p>
          <div className="flex gap-3">
            {[
              { value: 'light' as const, label: 'Claro', icon: Sun },
              { value: 'dark' as const, label: 'Escuro', icon: Moon },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm-causa font-medium transition-causa cursor-pointer border ${
                  theme === value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-causa-surface-alt'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Topologia — somente admin */}
        {canManageLicenca && (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
            <h3 className="text-base-causa font-semibold text-[var(--color-text)] mb-1">
              Topologia
            </h3>
            <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
              Modo de operação do sistema.
            </p>
            <div className="flex gap-3">
              {[
                {
                  value: 'solo' as const,
                  label: 'Solo',
                  desc: 'Advogado individual com banco local',
                },
                {
                  value: 'escritorio' as const,
                  label: 'Escritório',
                  desc: 'Múltiplos usuários com servidor compartilhado',
                },
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTopologia(value)}
                  className={`flex-1 text-left px-4 py-3 rounded-[var(--radius-md)] transition-causa cursor-pointer border ${
                    topologia === value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-causa-surface-alt'
                  }`}
                >
                  <div
                    className={`text-sm-causa font-medium mb-0.5 ${topologia === value ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}
                  >
                    {label}
                  </div>
                  <div className="text-xs-causa text-[var(--color-text-muted)]">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Certificado A1 */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
          <h3 className="text-base-causa font-semibold text-[var(--color-text)] mb-1">
            Certificado Digital A1
          </h3>
          <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
            Certificado para autenticação nos portais judiciais (PJe, e-SAJ).
          </p>
          <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-causa-surface-alt border border-[var(--color-border)]">
            <Settings size={18} className="text-[var(--color-text-muted)]" />
            <p className="text-sm-causa text-[var(--color-text-muted)]">
              Configuração de certificado estará disponível com os conectores PJe/e-SAJ.
            </p>
          </div>
        </div>

        {/* Banco de dados */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
          <h3 className="text-base-causa font-semibold text-[var(--color-text)] mb-1">
            Banco de dados
          </h3>
          <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
            Informações sobre o armazenamento.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-4 py-2 rounded-[var(--radius-md)] bg-causa-surface-alt">
              <span className="text-sm-causa text-[var(--color-text-muted)]">Motor</span>
              <span className="text-sm-causa text-[var(--color-text)] font-medium">
                SQLite (local)
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-2 rounded-[var(--radius-md)] bg-causa-surface-alt">
              <span className="text-sm-causa text-[var(--color-text-muted)]">Topologia</span>
              <span className="text-sm-causa text-[var(--color-text)] font-medium capitalize">
                {topologia}
              </span>
            </div>
          </div>
        </div>

        {/* Ações — somente admin */}
        {canManageLicenca && (
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
