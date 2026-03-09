import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Trash2, Pencil, Star, Phone } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { SkeletonTableRows } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { ContatoModal } from './contato-modal';
import type { ContatoEditData } from './contato-modal';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';
import type { ContatoRow } from '../../lib/api';

const TIPO_LABELS: Record<string, string> = {
  correspondente: 'Correspondente',
  perito: 'Perito',
  testemunha: 'Testemunha',
  oficial_justica: 'Oficial de Justiça',
  mediador: 'Mediador',
  tradutor: 'Tradutor',
  contador: 'Contador',
  fornecedor: 'Fornecedor',
  outro: 'Outro',
};

const TIPO_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'correspondente', label: 'Correspondentes' },
  { value: 'perito', label: 'Peritos' },
  { value: 'mediador', label: 'Mediadores' },
  { value: 'tradutor', label: 'Tradutores' },
  { value: 'contador', label: 'Contadores' },
];

export function ContatosPage() {
  const [contatos, setContatos] = useState<ContatoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<ContatoEditData | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [busca, setBusca] = useState('');
  const { toast } = useToast();
  const { can } = usePermission();

  const canManage = can('contatos:gerenciar');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const filtros: { tipo?: string; q?: string } = {};
      if (tipoFilter) filtros.tipo = tipoFilter;
      if (busca) filtros.q = busca;
      const data = await api.listarContatos(filtros);
      setContatos(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar contatos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [tipoFilter, busca, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function handleNew() {
    setEditData(undefined);
    setModalOpen(true);
  }

  function handleEdit(c: ContatoRow) {
    setEditData({
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      cpfCnpj: c.cpfCnpj ?? '',
      oabNumero: c.oabNumero ?? '',
      oabSeccional: c.oabSeccional ?? '',
      email: c.email ?? '',
      telefone: c.telefone ?? '',
      whatsapp: c.whatsapp ?? '',
      especialidade: c.especialidade ?? '',
      observacoes: c.observacoes ?? '',
      avaliacao: c.avaliacao ?? 0,
    });
    setModalOpen(true);
  }

  async function handleSave(data: ContatoEditData) {
    try {
      const payload: Record<string, unknown> = {
        nome: data.nome,
        tipo: data.tipo,
      };
      if (data.cpfCnpj) payload.cpfCnpj = data.cpfCnpj;
      if (data.oabNumero) payload.oabNumero = data.oabNumero;
      if (data.oabSeccional) payload.oabSeccional = data.oabSeccional;
      if (data.email) payload.email = data.email;
      if (data.telefone) payload.telefone = data.telefone;
      if (data.whatsapp) payload.whatsapp = data.whatsapp;
      if (data.especialidade) payload.especialidade = data.especialidade;
      if (data.observacoes) payload.observacoes = data.observacoes;
      if (data.avaliacao > 0) payload.avaliacao = data.avaliacao;

      if (data.id) {
        await api.atualizarContato(data.id, payload);
        toast('Contato atualizado.', 'success');
      } else {
        await api.criarContato(payload);
        toast('Contato criado.', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar contato.', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.excluirContato(deleteId);
      toast('Contato desativado.', 'success');
      setDeleteId(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao desativar contato.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Contatos Externos"
        description="Correspondentes, peritos, mediadores e outros contatos"
        action={
          canManage ? (
            <Button onClick={handleNew}>
              <Plus size={16} />
              Novo Contato
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          {TIPO_FILTERS.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => setTipoFilter(tf.value)}
              className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm-causa font-medium transition-causa cursor-pointer ${
                tipoFilter === tf.value
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-causa-bg'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
          className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa w-48"
        />
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm-causa">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-causa-bg">
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Nome
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Tipo
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Contato
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Especialidade
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Avaliação
              </th>
              <th className="text-right px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows cols={6} rows={5} />
            ) : contatos.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={Users} message="Nenhum contato encontrado" />
                </td>
              </tr>
            ) : (
              contatos.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--color-border)] hover:bg-causa-bg/50 transition-causa"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--color-text)]">{c.nome}</div>
                    {c.oabNumero && (
                      <div className="text-xs text-[var(--color-text-muted)]">
                        OAB {c.oabNumero}/{c.oabSeccional}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)]">
                    {TIPO_LABELS[c.tipo] ?? c.tipo}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {c.telefone && (
                        <span className="flex items-center gap-1 text-xs text-[var(--color-text)]">
                          <Phone size={10} /> {c.telefone}
                        </span>
                      )}
                      {c.email && (
                        <span className="text-xs text-[var(--color-text-muted)]">{c.email}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)]">{c.especialidade ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.avaliacao ? (
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <Star
                            key={v}
                            size={12}
                            className={
                              v <= (c.avaliacao ?? 0)
                                ? 'text-causa-warning fill-causa-warning'
                                : 'text-[var(--color-text-muted)]'
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(c)}
                            className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-causa-bg transition-causa cursor-pointer"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(c.id)}
                            className="p-1.5 rounded-[var(--radius-md)] text-causa-danger hover:bg-causa-danger/10 transition-causa cursor-pointer"
                            title="Desativar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <ContatoModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          initial={editData}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Desativar Contato"
        message="Tem certeza que deseja desativar este contato?"
        confirmLabel="Desativar"
        loading={deleting}
      />
    </div>
  );
}
