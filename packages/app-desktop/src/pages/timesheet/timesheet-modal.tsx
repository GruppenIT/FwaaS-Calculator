import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import * as api from '../../lib/api';

export interface TimesheetEditData {
  id?: string;
  processoId: string;
  clienteId: string;
  tarefaId: string;
  data: string;
  duracaoMinutos: string;
  descricao: string;
  tipoAtividade: string;
  faturavel: boolean;
  taxaHorariaAplicada: string;
}

const TIPOS_ATIVIDADE = [
  { value: 'peticao', label: 'Petição' },
  { value: 'pesquisa_jurisprudencia', label: 'Pesquisa Jurisprudência' },
  { value: 'reuniao_cliente', label: 'Reunião com Cliente' },
  { value: 'audiencia', label: 'Audiência' },
  { value: 'diligencia', label: 'Diligência' },
  { value: 'revisao', label: 'Revisão' },
  { value: 'analise_documental', label: 'Análise Documental' },
  { value: 'telefonema', label: 'Telefonema' },
  { value: 'email', label: 'E-mail' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'deslocamento', label: 'Deslocamento' },
  { value: 'outro', label: 'Outro' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: TimesheetEditData) => void;
  initial: TimesheetEditData | undefined;
}

export function TimesheetModal({ open, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<TimesheetEditData>({
    processoId: '',
    clienteId: '',
    tarefaId: '',
    data: new Date().toISOString().split('T')[0] ?? '',
    duracaoMinutos: '',
    descricao: '',
    tipoAtividade: 'outro',
    faturavel: true,
    taxaHorariaAplicada: '',
  });

  const [processos, setProcessos] = useState<{ id: string; numeroCnj: string }[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [tarefas, setTarefas] = useState<{ id: string; titulo: string }[]>([]);

  useEffect(() => {
    if (initial) {
      setForm(initial);
    } else {
      setForm({
        processoId: '',
        clienteId: '',
        tarefaId: '',
        data: new Date().toISOString().split('T')[0] ?? '',
        duracaoMinutos: '',
        descricao: '',
        tipoAtividade: 'outro',
        faturavel: true,
        taxaHorariaAplicada: '',
      });
    }
  }, [initial, open]);

  useEffect(() => {
    if (!open) return;
    Promise.all([api.listarProcessos(), api.listarClientes(), api.listarTarefas()]).then(
      ([p, c, t]) => {
        setProcessos(p.map((x) => ({ id: x.id, numeroCnj: x.numeroCnj })));
        setClientes(c.map((x) => ({ id: x.id, nome: x.nome })));
        setTarefas(t.map((x) => ({ id: x.id, titulo: x.titulo })));
      },
    );
  }, [open]);

  if (!open) return null;

  const isEdit = !!initial?.id;

  function set(field: keyof TimesheetEditData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Calculate display values
  const duracao = parseInt(form.duracaoMinutos) || 0;
  const horas = Math.floor(duracao / 60);
  const mins = duracao % 60;
  const taxa = parseFloat(form.taxaHorariaAplicada) || 0;
  const valorCalc = taxa > 0 ? (duracao / 60) * taxa : 0;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {isEdit ? 'Editar Registro' : 'Novo Registro de Tempo'}
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
          className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
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
                Duração (minutos) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={form.duracaoMinutos}
                onChange={(e) => set('duracaoMinutos', e.target.value)}
                placeholder="Ex: 90"
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
              {duracao > 0 && (
                <span className="text-xs text-[var(--color-text-muted)] mt-0.5 block">
                  {horas}h {mins}min
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
              Tipo de Atividade *
            </label>
            <select
              required
              value={form.tipoAtividade}
              onChange={(e) => set('tipoAtividade', e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
            >
              {TIPOS_ATIVIDADE.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
              Descrição *
            </label>
            <textarea
              required
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
            />
          </div>

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
                Cliente
              </label>
              <select
                value={form.clienteId}
                onChange={(e) => set('clienteId', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              >
                <option value="">Nenhum</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
              Tarefa
            </label>
            <select
              value={form.tarefaId}
              onChange={(e) => set('tarefaId', e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
            >
              <option value="">Nenhuma</option>
              {tarefas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titulo}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Taxa horária (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.taxaHorariaAplicada}
                onChange={(e) => set('taxaHorariaAplicada', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm-causa text-[var(--color-text)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.faturavel}
                  onChange={(e) => set('faturavel', e.target.checked)}
                  className="rounded"
                />
                Faturável
              </label>
            </div>
          </div>

          {valorCalc > 0 && (
            <div className="text-sm-causa text-[var(--color-text-muted)] bg-causa-bg rounded-[var(--radius-md)] px-3 py-2">
              Valor calculado:{' '}
              <span className="font-semibold text-[var(--color-text)]">
                {valorCalc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          )}
        </form>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(form)}>{isEdit ? 'Salvar' : 'Registrar'}</Button>
        </div>
      </div>
    </div>
  );
}
