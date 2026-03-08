import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { ClienteModal } from './cliente-modal';
import type { ClienteEditData } from './cliente-modal';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';

interface ClienteDetail {
  id: string;
  tipo: 'PF' | 'PJ';
  nome: string;
  cpfCnpj: string | null;
  email: string | null;
  telefone: string | null;
  createdAt: string;
}

interface ProcessoRow {
  id: string;
  numeroCnj: string;
  area: string;
  status: 'ativo' | 'arquivado' | 'encerrado';
  tribunalSigla: string;
}

const STATUS_STYLES: Record<string, string> = {
  ativo: 'bg-causa-success/10 text-causa-success',
  arquivado: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
  encerrado: 'bg-causa-warning/10 text-causa-warning',
};

export function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { can } = usePermission();

  const [cliente, setCliente] = useState<ClienteDetail | null>(null);
  const [processos, setProcessos] = useState<ProcessoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<ClienteEditData | null | undefined>(undefined);

  const carregar = useCallback(async () => {
    if (!id) return;
    try {
      const c = await api.obterCliente(id);
      setCliente(c);
      // Search processos by client name via API (server-side filtering)
      const matchedProcessos = await api.listarProcessos(c.nome);
      // Double-check: the API search is fuzzy, so filter to exact name match
      const filtered = matchedProcessos.filter((p) => p.clienteNome === c.nome);
      setProcessos(filtered);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar cliente.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function handleEdit() {
    if (!cliente) return;
    setEditData({
      id: cliente.id,
      tipo: cliente.tipo,
      nome: cliente.nome,
      cpfCnpj: cliente.cpfCnpj,
      email: cliente.email,
      telefone: cliente.telefone,
    });
  }

  function handleSaved() {
    setEditData(undefined);
    toast('Cliente atualizado.', 'success');
    carregar();
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-causa-surface-alt rounded w-1/3"></div>
        <div className="h-40 bg-causa-surface-alt rounded"></div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)]">
        Cliente não encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/app/clientes')}
          className="p-1.5 rounded-[var(--radius-sm)] hover:bg-causa-surface-alt transition-causa cursor-pointer text-[var(--color-text-muted)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl-causa text-[var(--color-text)] font-semibold">{cliente.nome}</h1>
          <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] bg-causa-surface-alt text-xs-causa font-medium text-[var(--color-text-muted)] mt-1">
            {cliente.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
          </span>
        </div>
        {can('clientes:editar') && (
          <Button variant="secondary" onClick={handleEdit}>
            <Pencil size={14} />
            Editar
          </Button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard label="CPF/CNPJ">{cliente.cpfCnpj ?? '—'}</InfoCard>
        <InfoCard label="Email">{cliente.email ?? '—'}</InfoCard>
        <InfoCard label="Telefone">{cliente.telefone ?? '—'}</InfoCard>
        <InfoCard label="Cadastrado em">
          {new Date(cliente.createdAt).toLocaleDateString('pt-BR')}
        </InfoCard>
      </div>

      {/* Processos vinculados */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
          <Briefcase size={16} className="text-[var(--color-text-muted)]" />
          <span className="text-sm-causa font-semibold text-[var(--color-text)]">Processos</span>
          <span className="text-xs-causa text-[var(--color-text-muted)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded-full">
            {processos.length}
          </span>
        </div>
        {processos.length === 0 ? (
          <p className="text-sm-causa text-[var(--color-text-muted)] py-6 text-center">
            Nenhum processo vinculado a este cliente.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-4 py-2 text-xs-causa font-semibold text-[var(--color-text-muted)]">
                  Número CNJ
                </th>
                <th className="text-left px-4 py-2 text-xs-causa font-semibold text-[var(--color-text-muted)]">
                  Área
                </th>
                <th className="text-left px-4 py-2 text-xs-causa font-semibold text-[var(--color-text-muted)]">
                  Tribunal
                </th>
                <th className="text-left px-4 py-2 text-xs-causa font-semibold text-[var(--color-text-muted)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {processos.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/app/processos/${p.id}`}
                      className="text-base-causa text-[var(--color-primary)] hover:underline font-[var(--font-mono)] font-medium"
                    >
                      {p.numeroCnj}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] capitalize">
                    {p.area}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] bg-causa-surface-alt text-xs-causa font-medium text-[var(--color-text-muted)]">
                      {p.tribunalSigla}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium capitalize ${STATUS_STYLES[p.status] ?? ''}`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editData !== undefined && (
        <ClienteModal
          onClose={() => setEditData(undefined)}
          onSaved={handleSaved}
          editData={editData}
        />
      )}
    </div>
  );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
      <div className="text-xs-causa text-[var(--color-text-muted)] mb-1">{label}</div>
      <div className="text-base-causa text-[var(--color-text)] font-medium">{children}</div>
    </div>
  );
}
