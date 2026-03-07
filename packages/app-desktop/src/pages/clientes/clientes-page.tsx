import { useState } from 'react';
import { Plus, Users, Search } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { ClienteModal } from './cliente-modal';

export interface ClienteRow {
  id: string;
  tipo: 'PF' | 'PJ';
  nome: string;
  cpfCnpj: string | null;
  email: string | null;
  telefone: string | null;
  processosAtivos: number;
  createdAt: string;
}

// TODO: dados reais
const MOCK_CLIENTES: ClienteRow[] = [];

export function ClientesPage() {
  const [showModal, setShowModal] = useState(false);
  const [clientes] = useState<ClienteRow[]>(MOCK_CLIENTES);
  const [busca, setBusca] = useState('');

  const filtered = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.cpfCnpj?.includes(busca) ||
      c.email?.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Pessoas físicas e jurídicas do escritório"
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Novo cliente
          </Button>
        }
      />

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF/CNPJ ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa placeholder:text-[var(--color-text-muted)]/60"
        />
      </div>

      {/* Tabela */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-causa-surface-alt">
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Nome / Razão Social</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Tipo</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">CPF/CNPJ</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Contato</th>
              <th className="text-left px-4 py-3 text-sm-causa font-semibold text-[var(--color-text-muted)]">Processos</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <Users size={32} className="mx-auto text-[var(--color-text-muted)]/30 mb-2" strokeWidth={1} />
                  <p className="text-sm-causa text-[var(--color-text-muted)]">
                    {busca ? 'Nenhum cliente encontrado.' : 'Cadastre seu primeiro cliente para começar.'}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa cursor-pointer">
                  <td className="px-4 py-3 text-base-causa text-[var(--color-text)] font-medium">{c.nome}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] bg-causa-surface-alt text-xs-causa font-medium text-[var(--color-text-muted)]">
                      {c.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">{c.cpfCnpj ?? '—'}</td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)]">{c.email ?? c.telefone ?? '—'}</td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text)]">{c.processosAtivos}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && <ClienteModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
