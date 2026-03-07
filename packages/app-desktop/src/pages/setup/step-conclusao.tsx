import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import type { SetupData } from './setup-page';

interface Props {
  data: SetupData;
  onBack: () => void;
}

export function StepConclusao({ data, onBack }: Props) {
  const navigate = useNavigate();

  function handleFinish() {
    // TODO: chamar API para persistir configuração + criar usuário admin
    // Por enquanto, redireciona para login
    navigate('/login');
  }

  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-causa-success/10 flex items-center justify-center">
          <CheckCircle size={32} className="text-causa-success" />
        </div>
      </div>

      <h2 className="text-xl-causa text-[var(--color-text)] mb-1">
        Tudo pronto!
      </h2>
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

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Voltar
        </Button>
        <Button onClick={handleFinish} className="flex-1">
          Finalizar configuração
        </Button>
      </div>
    </div>
  );
}
