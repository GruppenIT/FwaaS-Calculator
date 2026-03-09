import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import * as api from '../../lib/api';

export interface DespesaEditData {
  id?: string;
  processoId: string;
  tipo: string;
  descricao: string;
  valor: string;
  data: string;
  antecipadoPor: string;
  reembolsavel: boolean;
  status: string;
}

const TIPOS = [
  { value: 'custas_judiciais', label: 'Custas Judiciais' },
  { value: 'pericia', label: 'Perícia' },
  { value: 'diligencia', label: 'Diligência' },
  { value: 'correspondente', label: 'Correspondente' },
  { value: 'copia_autenticada', label: 'Cópia Autenticada' },
  { value: 'cartorio', label: 'Cartório' },
  { value: 'deslocamento', label: 'Deslocamento' },
  { value: 'correio', label: 'Correio' },
  { value: 'publicacao', label: 'Publicação' },
  { value: 'outra', label: 'Outra' },
];

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'pago', label: 'Pago' },
  { value: 'reembolsado', label: 'Reembolsado' },
  { value: 'cancelado', label: 'Cancelado' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: DespesaEditData) => void;
  initial: DespesaEditData | undefined;
}

export function DespesaModal({ open, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<DespesaEditData>({
    processoId: '',
    tipo: 'custas_judiciais',
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0]!,
    antecipadoPor: 'escritorio',
    reembolsavel: true,
    status: 'pendente',
  });

  const [processos, setProcessos] = useState<api.ProcessoListRow[]>([]);

  useEffect(() => {
    if (open) {
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
        processoId: '',
        tipo: 'custas_judiciais',
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0]!,
        antecipadoPor: 'escritorio',
        reembolsavel: true,
        status: 'pendente',
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const isEdit = !!initial?.id;

  function set(field: keyof DespesaEditData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {isEdit ? 'Editar Despesa' : 'Nova Despesa'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="px-6 py-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Tipo *
              </label>
              <select
                required
                value={form.tipo}
                onChange={(e) => set('tipo', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
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

          <div>
            <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
              Descrição *
            </label>
            <input
              type="text"
              required
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={form.valor}
                onChange={(e) => set('valor', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>

            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={form.data}
                onChange={(e) => set('data', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>

            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Antecipado por
              </label>
              <select
                value={form.antecipadoPor}
                onChange={(e) => set('antecipadoPor', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              >
                <option value="escritorio">Escritório</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>
          </div>

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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reembolsavel"
              checked={form.reembolsavel}
              onChange={(e) => set('reembolsavel', e.target.checked)}
              className="rounded border-[var(--color-border)]"
            />
            <label
              htmlFor="reembolsavel"
              className="text-sm-causa text-[var(--color-text)] cursor-pointer"
            >
              Reembolsável
            </label>
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
