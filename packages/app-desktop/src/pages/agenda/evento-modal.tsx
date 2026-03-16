import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import * as api from '../../lib/api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

interface ProcessoOption {
  id: string;
  numeroCnj: string;
}

const TIPOS = [
  { value: 'audiencia', label: 'Audiência' },
  { value: 'diligencia', label: 'Diligência' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'prazo', label: 'Prazo' },
  { value: 'pericia', label: 'Perícia' },
  { value: 'mediacao', label: 'Mediação' },
  { value: 'conciliacao', label: 'Conciliação' },
  { value: 'depoimento', label: 'Depoimento' },
  { value: 'juri', label: 'Júri' },
  { value: 'outro', label: 'Outro' },
];

const CORES = [
  { value: '', label: 'Padrão' },
  { value: 'var(--color-accent-blue)', label: 'Azul' },
  { value: 'var(--color-accent-red)', label: 'Vermelho' },
  { value: 'var(--color-accent-green)', label: 'Verde' },
  { value: 'var(--color-accent-amber)', label: 'Amarelo' },
  { value: 'var(--color-accent-purple)', label: 'Roxo' },
  { value: 'var(--color-accent-pink)', label: 'Rosa' },
];

export function EventoModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    tipo: 'audiencia',
    dataHoraInicio: '',
    dataHoraFim: '',
    diaInteiro: false,
    local: '',
    linkVideoconferencia: '',
    cor: '',
    processoId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Processo autocomplete
  const [processoBusca, setProcessoBusca] = useState('');
  const [processoLabel, setProcessoLabel] = useState('');
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
        setProcessoOptions(data.map((p) => ({ id: p.id, numeroCnj: p.numeroCnj })));
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

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.titulo.trim()) e.titulo = 'Obrigatório';
    if (!form.dataHoraInicio) e.dataHoraInicio = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        titulo: form.titulo,
        tipo: form.tipo,
        dataHoraInicio: new Date(form.dataHoraInicio).toISOString(),
        diaInteiro: form.diaInteiro,
      };
      if (form.dataHoraFim) payload.dataHoraFim = new Date(form.dataHoraFim).toISOString();
      if (form.local) payload.local = form.local;
      if (form.descricao) payload.descricao = form.descricao;
      if (form.linkVideoconferencia) payload.linkVideoconferencia = form.linkVideoconferencia;
      if (form.cor) payload.cor = form.cor;
      if (form.processoId) payload.processoId = form.processoId;

      await api.criarEvento(payload);
      onCreated();
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
    <Modal open title="Novo evento" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Título"
          placeholder="Ex: Audiência de instrução"
          value={form.titulo}
          onChange={(e) => update('titulo', e.target.value)}
          error={errors.titulo}
          autoFocus
        />

        <Input
          label="Descrição (opcional)"
          placeholder="Detalhes do evento"
          value={form.descricao}
          onChange={(e) => update('descricao', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => update('tipo', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">Cor</label>
            <select
              value={form.cor}
              onChange={(e) => update('cor', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {CORES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.diaInteiro}
            onChange={(e) => update('diaInteiro', e.target.checked)}
            className="accent-[var(--color-primary)] w-4 h-4"
          />
          <span className="text-sm-causa text-[var(--color-text)]">Dia inteiro</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Início"
            type={form.diaInteiro ? 'date' : 'datetime-local'}
            value={form.dataHoraInicio}
            onChange={(e) => update('dataHoraInicio', e.target.value)}
            error={errors.dataHoraInicio}
          />
          <Input
            label="Fim (opcional)"
            type={form.diaInteiro ? 'date' : 'datetime-local'}
            value={form.dataHoraFim}
            onChange={(e) => update('dataHoraFim', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Local (opcional)"
            placeholder="Ex: Fórum Central, Sala 5"
            value={form.local}
            onChange={(e) => update('local', e.target.value)}
          />
          <Input
            label="Link videoconferência (opcional)"
            placeholder="https://..."
            value={form.linkVideoconferencia}
            onChange={(e) => update('linkVideoconferencia', e.target.value)}
          />
        </div>

        {/* Processo autocomplete */}
        <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
          <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
            Processo (opcional)
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
                  setForm((p) => ({ ...p, processoId: '' }));
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
                placeholder="Buscar processo por CNJ..."
                value={processoBusca}
                onChange={(e) => {
                  setProcessoBusca(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => processoOptions.length > 0 && setShowDropdown(true)}
                className="w-full h-9 pl-8 pr-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa placeholder:text-[var(--color-text-muted)]/60 font-[var(--font-mono)]"
              />
              {showDropdown && processoOptions.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] max-h-32 overflow-auto">
                  {processoOptions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, processoId: p.id }));
                        setProcessoLabel(p.numeroCnj);
                        setProcessoBusca('');
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-causa-surface-alt transition-causa cursor-pointer text-base-causa text-[var(--color-text)] font-[var(--font-mono)]"
                    >
                      {p.numeroCnj}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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
            {loading ? 'Salvando...' : 'Criar evento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
