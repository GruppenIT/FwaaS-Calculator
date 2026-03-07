import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';

interface Props {
  message: string | null;
}

export function ServerErrorPage({ message }: Props) {
  function handleReload() {
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-causa-danger/10 flex items-center justify-center">
            <AlertTriangle size={32} className="text-causa-danger" />
          </div>
        </div>

        <h1 className="text-xl-causa font-bold text-[var(--color-text)] mb-2">
          Serviço indisponível
        </h1>

        <p className="text-sm-causa text-[var(--color-text-muted)] mb-6">
          {message || 'O serviço interno do CAUSA não está respondendo.'}
        </p>

        <div className="text-left bg-causa-surface-alt rounded-[var(--radius-md)] p-4 mb-6">
          <p className="text-sm-causa text-[var(--color-text-muted)] mb-2 font-medium">
            Possíveis causas:
          </p>
          <ul className="text-sm-causa text-[var(--color-text-muted)] list-disc list-inside space-y-1">
            <li>Outra instância do CAUSA já está rodando</li>
            <li>A porta 3456 está sendo usada por outro programa</li>
            <li>Um antivírus pode estar bloqueando o serviço</li>
            <li>Falha ao carregar componentes nativos</li>
          </ul>
        </div>

        <Button onClick={handleReload} className="gap-2">
          <RotateCcw size={16} />
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
