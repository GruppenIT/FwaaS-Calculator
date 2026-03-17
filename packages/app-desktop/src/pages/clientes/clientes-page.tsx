import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Users, Search, Pencil, Trash2, Download, Eye } from 'lucide-react';
import { PageHeader, Button, useToast, ConfirmDialog, DataTable } from '../../components/ui';
import type { Column } from '../../components/ui';
import { ClienteModal } from './cliente-modal';
import type { ClienteEditData } from './cliente-modal';
import { usePermission } from '../../hooks/use-permission';
import { useTablePreferences } from '../../hooks/use-table-preferences';
import type { ClienteData } from '../../lib/api';
import * as api from '../../lib/api';

const STATUS_STYLES: Record<string, string> = {
  prospecto: 'bg-causa-info/10 text-causa-info',
  ativo: 'bg-causa-success/10 text-causa-success',
  inativo: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
  encerrado: 'bg-causa-warning/10 text-causa-warning',
};

const STATUS_LABELS: Record<string, string> = {
  '': 'Todos',
  prospecto: 'Prospecto',
  ativo: 'Ativo',
  inativo: 'Inativo',
  encerrado: 'Encerrado',
};

export function ClientesPage() {
  const { can } = usePermission();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [modalData, setModalData] = useState<ClienteEditData | null | undefined>(undefined);
  const [clientes, setClientes] = useState<ClienteData[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    (location.state as { selectedId?: string } | null)?.selectedId ?? null,
  );

  const { sortState, setSortState } = useTablePreferences('clientes');

  const showModal = modalData !== undefined;

  const carregar = useCallback(async () => {
    try {
      const data = await api.listarClientes(busca || undefined);
      setClientes(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar clientes.', 'error');
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  }, [busca, toast]);

  useEffect(() => {
    const timer = setTimeout(carregar, busca ? 300 : 0);
    return () => clearTimeout(timer);
  }, [carregar, busca]);

  const filteredClientes = filtroStatus
    ? clientes.filter((c) => c.statusCliente === filtroStatus)
    : clientes;

  const sorted = useMemo(() => {
    if (!sortState || sortState.direction === null) return filteredClientes;
    const dir = sortState.direction === 'asc' ? 1 : -1;
    return [...filteredClientes].sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[sortState.key] ?? '');
      const bVal = String((b as unknown as Record<string, unknown>)[sortState.key] ?? '');
      return aVal.localeCompare(bVal) * dir;
    });
  }, [filteredClientes, sortState]);

  // Auto-select first row when data changes (preserve restored selection)
  useEffect(() => {
    if (loading) return;
    if (sorted.length > 0) {
      if (!selectedId || !sorted.find((c) => c.id === selectedId)) {
        setSelectedId(sorted[0]!.id);
      }
    } else {
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, loading]);

  // Keyboard shortcuts: N to open create modal, Esc to clear search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showModal || !!deleteId) return;

      const active = document.activeElement;
      const isInput =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement;

      if (e.key === 'Escape' && busca) {
        setBusca('');
        searchInputRef.current?.blur();
        return;
      }

      if ((e.key === 'n' || e.key === 'N') && !isInput) {
        if (can('clientes:criar')) {
          e.preventDefault();
          setModalData(null);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, deleteId, busca, can]);

  function handleSaved() {
    const isEdit = !!modalData;
    setModalData(undefined);
    toast(
      isEdit ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.',
      'success',
    );
    carregar();
  }

  function handleEdit(c: ClienteData) {
    setModalData(c);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.excluirCliente(deleteId);
      toast('Cliente excluído.', 'success');
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao excluir cliente.', 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const columns: Column<ClienteData>[] = [
    {
      key: 'nome',
      header: 'Nome',
      width: 'w-[250px]',
      sortable: true,
      render: (value) => <span className="truncate block">{String(value ?? '')}</span>,
    },
    {
      key: 'cpfCnpj',
      header: 'CPF/CNPJ',
      width: 'w-[160px]',
      render: (value) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          {String(value ?? '-')}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      width: 'w-[220px]',
      render: (value) => <span className="truncate block">{String(value ?? '-')}</span>,
    },
    {
      key: 'telefone',
      header: 'Telefone',
      width: 'w-[140px]',
      render: (value) => String(value ?? '-'),
    },
    {
      key: 'statusCliente',
      header: 'Status',
      width: 'w-[100px]',
      render: (value) => {
        const s = String(value ?? '');
        return (
          <span
            className={`text-xs-causa font-medium px-2 py-0.5 rounded-[var(--radius-sm)] ${STATUS_STYLES[s] ?? ''}`}
          >
            {STATUS_LABELS[s] ?? s}
          </span>
        );
      },
    },
    {
      key: 'id',
      header: '',
      width: 'w-[100px]',
      align: 'right',
      render: (_value, row) => (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="p-1 rounded hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-causa cursor-pointer"
            onClick={() => navigate('/app/clientes/' + row.id)}
            title="Ver detalhes"
          >
            <Eye size={14} />
          </button>
          {can('clientes:editar') && (
            <button
              type="button"
              className="p-1 rounded hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-causa cursor-pointer"
              onClick={() => handleEdit(row)}
            >
              <Pencil size={14} />
            </button>
          )}
          {can('clientes:excluir') && (
            <button
              type="button"
              className="p-1 rounded hover:bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-causa-danger transition-causa cursor-pointer"
              onClick={() => setDeleteId(row.id)}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Pessoas físicas e jurídicas do escritório"
        action={
          can('clientes:criar') ? (
            <Button onClick={() => setModalData(null)}>
              <Plus size={16} />
              Novo cliente
            </Button>
          ) : undefined
        }
      />

      {/* Busca + Filtro Status + Export */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar por nome, CPF/CNPJ, email, telefone ou WhatsApp..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa placeholder:text-[var(--color-text-muted)]/60"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-sm-causa focus-causa transition-causa"
        >
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            const header = ['Nome', 'Tipo', 'CPF/CNPJ', 'Email', 'Telefone', 'WhatsApp', 'Status'];
            const lines = filteredClientes.map((c) => [
              c.nome,
              c.tipo,
              c.cpfCnpj ?? '',
              c.email ?? '',
              c.telefone ?? '',
              c.whatsapp ?? '',
              c.statusCliente ?? '',
            ]);
            const csv = [header, ...lines]
              .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
              .join('\n');
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clientes.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
          disabled={filteredClientes.length === 0}
          className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] text-sm-causa hover:bg-causa-surface-alt transition-causa cursor-pointer disabled:opacity-50 disabled:cursor-default flex items-center gap-1.5"
          title="Exportar CSV"
        >
          <Download size={14} />
          CSV
        </button>
      </div>

      <DataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        data={(loading ? [] : sorted) as unknown as Record<string, unknown>[]}
        keyExtractor={(r) => r['id'] as string}
        selectedKey={selectedId}
        onSelect={(r) => setSelectedId(r['id'] as string)}
        onActivate={(r) => navigate('/app/clientes/' + (r['id'] as string))}
        {...(sortState !== undefined ? { sortState } : {})}
        onSort={setSortState}
        animateFirstLoad={isFirstLoad}
        emptyIcon={Users}
        emptyMessage={
          busca || filtroStatus
            ? 'Nenhum cliente encontrado.'
            : 'Cadastre seu primeiro cliente para começar.'
        }
      />

      {showModal && (
        <ClienteModal
          onClose={() => setModalData(undefined)}
          onSaved={handleSaved}
          editData={modalData}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir cliente"
        message="Tem certeza que deseja excluir este cliente? Processos vinculados podem ser afetados."
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  );
}
