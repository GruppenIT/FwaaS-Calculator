import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import * as api from '../../lib/api';

export interface TarefaEditData {
  id?: string;
  titulo: string;
  descricao: string;
  processoId: string;
  clienteId: string;
  responsavelId: string;
  prioridade: string;
  status: string;
  categoria: string;
  dataLimite: string;
  tempoEstimadoMin: string;
  tempoGastoMin: string;
  observacoes: string;
}

const PRIORIDADES = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
];

const CATEGORIAS = [
  { value: '', label: 'Sem categoria' },
  { value: 'peticao', label: 'Petição' },
  { value: 'pesquisa', label: 'Pesquisa' },
  { value: 'ligacao', label: 'Ligação' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'revisao', label: 'Revisão' },
  { value: 'diligencia', label: 'Diligência' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'outro', label: 'Outro' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: TarefaEditData) => void;
  initial: TarefaEditData | undefined;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm-causa font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mt-4 mb-2 first:mt-0">
      {children}
    </h3>
  );
}

export function TarefaModal({ open, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<TarefaEditData>({
    titulo: '',
    descricao: '',
    processoId: '',
    clienteId: '',
    responsavelId: '',
    prioridade: 'normal',
    status: 'pendente',
    categoria: '',
    dataLimite: '',
    tempoEstimadoMin: '',
    tempoGastoMin: '',
    observacoes: '',
  });

  const [usuarios, setUsuarios] = useState<api.UsuarioRow[]>([]);
  const [processos, setProcessos] = useState<api.ProcessoListRow[]>([]);

  useEffect(() => {
    if (open) {
      api
        .listarUsuarios()
        .then(setUsuarios)
        .catch(() => {});
      api
        .listarProcessos()
        .then(setProcessos)
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (initial) {
      setForm(initial);
    } else {
      setForm({
        titulo: '',
        descricao: '',
        processoId: '',
        clienteId: '',
        responsavelId: '',
        prioridade: 'normal',
        status: 'pendente',
        categoria: '',
        dataLimite: '',
        tempoEstimadoMin: '',
        tempoGastoMin: '',
        observacoes: '',
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const isEdit = !!initial?.id;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  function set(field: keyof TarefaEditData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-lg w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-3">
          <SectionTitle>Informações</SectionTitle>

          <div>
            <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
              Título *
            </label>
            <input
              type="text"
              required
              value={form.titulo}
              onChange={(e) => set('titulo', e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
            />
          </div>

          <div>
            <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
              Descrição
            </label>
            <textarea
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Responsável *
              </label>
              <select
                required
                value={form.responsavelId}
                onChange={(e) => set('responsavelId', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              >
                <option value="">Selecione...</option>
                {usuarios
                  .filter((u) => u.ativo)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Categoria
              </label>
              <select
                value={form.categoria}
                onChange={(e) => set('categoria', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <SectionTitle>Classificação</SectionTitle>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Prioridade
              </label>
              <select
                value={form.prioridade}
                onChange={(e) => set('prioridade', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              >
                {PRIORIDADES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <SectionTitle>Vínculo</SectionTitle>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Processo
              </label>
              <select
                value={form.processoId}
                onChange={(e) => set('processoId', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              >
                <option value="">Nenhum</option>
                {processos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.numeroCnj}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Data Limite
              </label>
              <input
                type="date"
                value={form.dataLimite}
                onChange={(e) => set('dataLimite', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>
          </div>

          <SectionTitle>Tempo</SectionTitle>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Tempo Estimado (min)
              </label>
              <input
                type="number"
                min="0"
                value={form.tempoEstimadoMin}
                onChange={(e) => set('tempoEstimadoMin', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>

            {isEdit && (
              <div>
                <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                  Tempo Gasto (min)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.tempoGastoMin}
                  onChange={(e) => set('tempoGastoMin', e.target.value)}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
              Observações
            </label>
            <textarea
              value={form.observacoes}
              onChange={(e) => set('observacoes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
            />
          </div>
        </form>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(form)}>{isEdit ? 'Salvar' : 'Criar'}</Button>
        </div>
      </div>
    </div>
  );
}
