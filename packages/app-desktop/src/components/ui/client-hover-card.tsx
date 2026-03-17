import { useRef, useState } from 'react';
import * as HoverCard from '@radix-ui/react-hover-card';
import type { ClienteData } from '../../lib/api';
import { obterCliente } from '../../lib/api';
import { SkeletonText } from './skeleton';

interface ClientHoverCardProps {
  clienteId: string;
  clienteNome: string;
  children: React.ReactNode;
}

function TipoBadge({ tipo }: { tipo: 'PF' | 'PJ' }) {
  return (
    <span
      className={`inline-block px-1.5 py-0.5 text-xs font-semibold rounded ${
        tipo === 'PF'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
      }`}
    >
      {tipo}
    </span>
  );
}

export function ClientHoverCard({ clienteId, children }: ClientHoverCardProps) {
  const cacheRef = useRef<ClienteData | null>(null);
  const [data, setData] = useState<ClienteData | null>(null);
  const [loading, setLoading] = useState(false);

  function handleOpenChange(open: boolean) {
    if (!open) return;
    if (cacheRef.current) {
      setData(cacheRef.current);
      return;
    }
    setLoading(true);
    obterCliente(clienteId)
      .then((result) => {
        cacheRef.current = result;
        setData(result);
      })
      .catch(() => {
        // Silently fail — hover card is enhancement only
      })
      .finally(() => setLoading(false));
  }

  return (
    <HoverCard.Root openDelay={300} closeDelay={100} onOpenChange={handleOpenChange}>
      <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          align="start"
          sideOffset={5}
          className="z-50 w-72 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg rounded-[var(--radius-md)] p-4"
        >
          {loading && (
            <div className="space-y-2">
              <SkeletonText lines={2} />
            </div>
          )}
          {!loading && data && (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm-causa font-semibold text-[var(--color-text)] leading-tight">
                  {data.nome}
                </p>
                <TipoBadge tipo={data.tipo} />
              </div>

              {data.cpfCnpj && (
                <p className="text-xs-causa text-[var(--color-text-muted)]">
                  <span className="font-medium">{data.tipo === 'PF' ? 'CPF' : 'CNPJ'}:</span>{' '}
                  {data.cpfCnpj}
                </p>
              )}

              {data.email && (
                <p className="text-xs-causa text-[var(--color-text-muted)]">
                  <span className="font-medium">E-mail:</span> {data.email}
                </p>
              )}

              {data.telefone && (
                <p className="text-xs-causa text-[var(--color-text-muted)]">
                  <span className="font-medium">Telefone:</span> {data.telefone}
                </p>
              )}

              <div className="pt-1 border-t border-[var(--color-border)]">
                <span
                  className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                    data.statusCliente === 'ativo'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {data.statusCliente}
                </span>
              </div>
            </div>
          )}
          {!loading && !data && (
            <p className="text-xs-causa text-[var(--color-text-muted)]">
              Dados indisponíveis no momento.
            </p>
          )}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
