import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../lib/auth-context';
import * as api from '../../lib/api';
import type { SetupData } from './setup-page';

interface Props {
  data: SetupData;
  onBack: () => void;
}

export function StepConclusao({ data, onBack }: Props) {
  const navigate = useNavigate();
  const { setConfigured } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFinish() {
    if (!data.topologia || !data.admin) return;

    setLoading(true);
    setError('');

    try {
      await api.setupSystem({
        topologia: data.topologia,
        ...(data.postgresUrl ? { postgresUrl: data.postgresUrl } : {}),
        admin: {
          nome: data.admin.nome,
          email: data.admin.email,
          senha: data.admin.senha,
          ...(data.admin.oabNumero ? { oabNumero: data.admin.oabNumero } : {}),
          ...(data.admin.oabSeccional ? { oabSeccional: data.admin.oabSeccional } : {}),
        },
      });
      setConfigured();
      navigate('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao configurar sistema.';
      console.error('[CAUSA Setup]', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-causa-success/10 flex items-center justify-center">
          <CheckCircle size={32} className="text-causa-success" />
        </div>
      </div>

      <h2 className="text-xl-causa text-[var(--color-text)] mb-1">Tudo pronto!</h2>
      <p className="text-sm-causa text-[var(--color-text-muted)] mb-6">
        Confira os dados antes de finalizar.
      </p>

      <div className="text-left bg-causa-surface-alt rounded-[var(--radius-md)] p-4 mb-6">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-sm-causa text-[var(--color-text-muted)]">Topologia</span>
            <span className="text-sm-causa font-medium text-[var(--color-text)]">
              {data.topologia === 'solo' ? 'CAUSA Solo' : 'CAUSA Escritório'}
            </span>
          </div>
          {data.topologia === 'escritorio' && data.postgresUrl && (
            <div className="flex justify-between">
              <span className="text-sm-causa text-[var(--color-text-muted)]">Banco de dados</span>
              <span className="text-sm-causa font-medium text-[var(--color-text)]">PostgreSQL</span>
            </div>
          )}
          {data.topologia === 'solo' && (
            <div className="flex justify-between">
              <span className="text-sm-causa text-[var(--color-text-muted)]">Banco de dados</span>
              <span className="text-sm-causa font-medium text-[var(--color-text)]">
                SQLite (local)
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm-causa text-[var(--color-text-muted)]">Administrador</span>
            <span className="text-sm-causa font-medium text-[var(--color-text)]">
              {data.admin?.nome}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm-causa text-[var(--color-text-muted)]">Email</span>
            <span className="text-sm-causa font-medium text-[var(--color-text)]">
              {data.admin?.email}
            </span>
          </div>
          {data.admin?.oabNumero && (
            <div className="flex justify-between">
              <span className="text-sm-causa text-[var(--color-text-muted)]">OAB</span>
              <span className="text-sm-causa font-medium text-[var(--color-text)]">
                {data.admin.oabNumero}/{data.admin.oabSeccional}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm-causa text-causa-danger bg-causa-danger/8 rounded-[var(--radius-md)] px-3 py-2 border border-causa-danger/20 mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} disabled={loading} className="flex-1">
          Voltar
        </Button>
        <Button onClick={handleFinish} disabled={loading} className="flex-1">
          {loading ? 'Configurando...' : 'Finalizar configuração'}
        </Button>
      </div>
    </div>
  );
}
