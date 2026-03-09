import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../lib/auth-context';
import * as api from '../../lib/api';

export interface PrazoEditData {
  id: string;
  processoId: string;
  numeroCnj: string | null;
  descricao: string;
  dataFatal: string;
  dataInicio: string | null;
  diasPrazo: number | null;
  tipoPrazo: string;
  categoriaPrazo: string | null;
  prioridade: string;
  fatal: boolean;
  status: string;
  responsavelId: string;
  observacoes: string | null;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editData?: PrazoEditData | null;
}

interface ProcessoOption {
  id: string;
  numeroCnj: string;
  clienteNome: string | null;
}

const TIPOS_PRAZO = [
  { value: 'ncpc', label: 'NCPC' },
  { value: 'clt', label: 'CLT' },
  { value: 'jec', label: 'JEC' },
  { value: 'tributario', label: 'Tributário' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'contratual', label: 'Contratual' },
  { value: 'outros', label: 'Outros' },
];

const CATEGORIAS = [
  { value: '', label: '—' },
  { value: 'contestacao', label: 'Contestação' },
  { value: 'recurso', label: 'Recurso' },
  { value: 'manifestacao', label: 'Manifestação' },
  { value: 'audiencia', label: 'Audiência' },
  { value: 'pericial', label: 'Pericial' },
  { value: 'cumprimento', label: 'Cumprimento' },
  { value: 'outro', label: 'Outro' },
];

const PRIORIDADES = [
  { value: 'normal', label: 'Normal' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

export function PrazoModal({ onClose, onSaved, editData }: Props) {
  const isEdit = !!editData;
  const { user } = useAuth();
  const [form, setForm] = useState({
    processoId: editData?.processoId ?? '',
    descricao: editData?.descricao ?? '',
    dataFatal: editData?.dataFatal ?? '',
    dataInicio: editData?.dataInicio ?? '',
    diasPrazo: editData?.diasPrazo ? String(editData.diasPrazo) : '',
    tipoPrazo: editData?.tipoPrazo ?? 'ncpc',
    categoriaPrazo: editData?.categoriaPrazo ?? '',
    prioridade: editData?.prioridade ?? 'normal',
    fatal: editData?.fatal ?? false,
    status: editData?.status ?? 'pendente',
    observacoes: editData?.observacoes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Processo autocomplete
  const [processoBusca, setProcessoBusca] = useState('');
  const [processoLabel, setProcessoLabel] = useState(editData?.numeroCnj ?? '');
  const [processoOptions, setProcessoOptions] = useState<ProcessoOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!processoBusca || processoBusca.length < 2) {
      setProcessoOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api.listarProcessos(processoBusca);
        setProcessoOptions(
          data.map((p) => ({ id: p.id, numeroCnj: p.numeroCnj, clienteNome: p.clienteNome })),
        );
      } catch {
        setProcessoOptions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [processoBusca]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectProcesso(p: ProcessoOption) {
    setForm((prev) => ({ ...prev, processoId: p.id }));
    setProcessoLabel(p.numeroCnj);
    setProcessoBusca('');
    setShowDropdown(false);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.processoId) e.processoId = 'Selecione um processo';
    if (!form.descricao.trim()) e.descricao = 'Obrigatório';
    if (!form.dataFatal) e.dataFatal = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        descricao: form.descricao,
        dataFatal: form.dataFatal,
        tipoPrazo: form.tipoPrazo,
        prioridade: form.prioridade,
        fatal: form.fatal,
        responsavelId: user?.id ?? '',
      };
      if (form.dataInicio) payload.dataInicio = form.dataInicio;
      if (form.diasPrazo) payload.diasPrazo = parseInt(form.diasPrazo, 10);
      if (form.categoriaPrazo) payload.categoriaPrazo = form.categoriaPrazo;
      if (form.observacoes) payload.observacoes = form.observacoes;

      if (isEdit) {
        payload.status = form.status;
        await api.atualizarPrazo(editData.id, payload);
      } else {
        payload.processoId = form.processoId;
        await api.criarPrazo(payload);
      }
      onSaved();
    } catch (err) {
      setErrors({ geral: err instanceof Error ? err.message : 'Erro ao cadastrar.' });
    } finally {
      setLoading(false);
    }
  }

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Modal open title={isEdit ? 'Editar prazo' : 'Novo prazo'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Processo autocomplete */}
        <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
          <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
            Processo
          </label>
          {processoLabel ? (
            <div className="flex items-center gap-2 h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)]">
              <span className="flex-1 text-base-causa text-[var(--color-text)] font-[var(--font-mono)]">
                {processoLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  setProcessoLabel('');
                  setForm((prev) => ({ ...prev, processoId: '' }));
                }}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <input
                type="text"
                placeholder="Buscar por número CNJ..."
                value={processoBusca}
                onChange={(e) => {
                  setProcessoBusca(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => processoOptions.length > 0 && setShowDropdown(true)}
                className="w-full h-9 pl-8 pr-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa placeholder:text-[var(--color-text-muted)]/60"
              />
              {showDropdown && processoOptions.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] max-h-40 overflow-auto">
                  {processoOptions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectProcesso(p)}
                      className="w-full text-left px-3 py-2 hover:bg-causa-surface-alt transition-causa cursor-pointer"
                    >
                      <span className="text-base-causa text-[var(--color-text)] font-[var(--font-mono)]">
                        {p.numeroCnj}
                      </span>
                      {p.clienteNome && (
                        <span className="ml-2 text-xs-causa text-[var(--color-text-muted)]">
                          {p.clienteNome}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {errors.processoId && (
            <span className="text-xs-causa text-causa-danger">{errors.processoId}</span>
          )}
        </div>

        <Input
          label="Descrição"
          placeholder="Ex: Prazo para contestação"
          value={form.descricao}
          onChange={(e) => update('descricao', e.target.value)}
          error={errors.descricao}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Data fatal"
            type="date"
            value={form.dataFatal}
            onChange={(e) => update('dataFatal', e.target.value)}
            error={errors.dataFatal}
          />
          <Input
            label="Data início (opcional)"
            type="date"
            value={form.dataInicio}
            onChange={(e) => update('dataInicio', e.target.value)}
          />
          <Input
            label="Dias (opcional)"
            type="number"
            placeholder="15"
            value={form.diasPrazo}
            onChange={(e) => update('diasPrazo', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
              Tipo de prazo
            </label>
            <select
              value={form.tipoPrazo}
              onChange={(e) => update('tipoPrazo', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {TIPOS_PRAZO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
              Categoria
            </label>
            <select
              value={form.categoriaPrazo}
              onChange={(e) => update('categoriaPrazo', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
              Prioridade
            </label>
            <select
              value={form.prioridade}
              onChange={(e) => update('prioridade', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.fatal}
              onChange={(e) => update('fatal', e.target.checked)}
              className="accent-[var(--color-primary)] w-4 h-4"
            />
            <span className="text-sm-causa text-[var(--color-text)]">Prazo fatal</span>
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
            Observações
          </label>
          <textarea
            value={form.observacoes}
            onChange={(e) => update('observacoes', e.target.value)}
            rows={2}
            className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa resize-none"
            placeholder="Observações sobre o prazo..."
          />
        </div>

        {isEdit && (
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              <option value="pendente">Pendente</option>
              <option value="cumprido">Cumprido</option>
              <option value="perdido">Perdido</option>
              <option value="suspenso">Suspenso</option>
            </select>
          </div>
        )}

        {errors.geral && (
          <div className="text-sm-causa text-causa-danger bg-causa-danger/8 rounded-[var(--radius-md)] px-3 py-2 border border-causa-danger/20">
            {errors.geral}
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar prazo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
