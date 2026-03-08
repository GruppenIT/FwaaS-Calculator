import { useState, useEffect } from 'react';
import { Settings, Save, Moon, Sun } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { useTheme } from '../../hooks/use-theme';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';

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
