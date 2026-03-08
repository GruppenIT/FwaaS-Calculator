import { useState, useEffect, useRef, type FormEvent } from 'react';
import { X, Search } from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import * as api from '../../lib/api';

export interface HonorarioEditData {
  id: string;
  clienteId: string | null;
  clienteNome: string | null;
  processoId: string | null;
  numeroCnj: string | null;
  tipo: 'fixo' | 'exito' | 'por_hora';
  valor: number;
  percentualExito: number | null;
  vencimento: string | null;
  status: 'pendente' | 'recebido' | 'inadimplente';
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editData?: HonorarioEditData | null;
}

interface ClienteOption {
  id: string;
  nome: string;
}

const TIPOS = [
  { value: 'fixo', label: 'Fixo' },
  { value: 'exito', label: 'Êxito' },
  { value: 'por_hora', label: 'Por hora' },
];

export function HonorarioModal({ onClose, onSaved, editData }: Props) {
  const isEdit = !!editData;
  const [form, setForm] = useState({
    clienteId: editData?.clienteId ?? '',
    processoId: editData?.processoId ?? '',
    tipo: (editData?.tipo ?? 'fixo') as 'fixo' | 'exito' | 'por_hora',
    valor: editData ? String(editData.valor) : '',
    percentualExito: editData?.percentualExito ? String(editData.percentualExito) : '',
    vencimento: editData?.vencimento ?? '',
    status: (editData?.status ?? 'pendente') as 'pendente' | 'recebido' | 'inadimplente',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Cliente autocomplete
  const [clienteBusca, setClienteBusca] = useState('');
  const [clienteNome, setClienteNome] = useState(editData?.clienteNome ?? '');
  const [clienteOptions, setClienteOptions] = useState<ClienteOption[]>([]);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const clienteRef = useRef<HTMLDivElement>(null);

  // Processo autocomplete
  const [processoBusca, setProcessoBusca] = useState('');
  const [processoLabel, setProcessoLabel] = useState(editData?.numeroCnj ?? '');
  const [processoOptions, setProcessoOptions] = useState<{ id: string; numeroCnj: string }[]>([]);
  const [showProcessoDropdown, setShowProcessoDropdown] = useState(false);
  const processoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clienteBusca || clienteBusca.length < 2) {
      setClienteOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const data = await api.listarClientes(clienteBusca);
        setClienteOptions(data.map((c) => ({ id: c.id, nome: c.nome })));
      } catch {
        setClienteOptions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [clienteBusca]);

  useEffect(() => {
    if (!processoBusca || processoBusca.length < 2) {
      setProcessoOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const data = await api.listarProcessos(processoBusca);
        setProcessoOptions(data.map((p) => ({ id: p.id, numeroCnj: p.numeroCnj })));
      } catch {
        setProcessoOptions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [processoBusca]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node))
        setShowClienteDropdown(false);
      if (processoRef.current && !processoRef.current.contains(e.target as Node))
        setShowProcessoDropdown(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function validate(): boolean {
    const e: Record<string, string> = {};
    const valor = parseFloat(form.valor.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!form.valor || isNaN(valor) || valor <= 0) e.valor = 'Valor deve ser maior que zero';
    if (form.tipo === 'exito' && form.percentualExito) {
      const pct = parseFloat(form.percentualExito);
      if (isNaN(pct) || pct <= 0 || pct > 100) e.percentualExito = 'Entre 0 e 100';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const valor = parseFloat(form.valor.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (isEdit) {
        await api.atualizarHonorario(editData.id, {
          tipo: form.tipo,
          valor,
          status: form.status,
          ...(form.clienteId ? { clienteId: form.clienteId } : {}),
          ...(form.processoId ? { processoId: form.processoId } : {}),
          ...(form.tipo === 'exito' && form.percentualExito
            ? { percentualExito: parseFloat(form.percentualExito) }
            : {}),
          ...(form.vencimento ? { vencimento: form.vencimento } : {}),
        });
      } else {
        await api.criarHonorario({
          tipo: form.tipo,
          valor,
          ...(form.clienteId ? { clienteId: form.clienteId } : {}),
          ...(form.processoId ? { processoId: form.processoId } : {}),
          ...(form.tipo === 'exito' && form.percentualExito
            ? { percentualExito: parseFloat(form.percentualExito) }
            : {}),
          ...(form.vencimento ? { vencimento: form.vencimento } : {}),
        });
      }
      onSaved();
    } catch (err) {
      setErrors({ geral: err instanceof Error ? err.message : 'Erro ao cadastrar.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open title={isEdit ? 'Editar honorário' : 'Novo honorário'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Cliente autocomplete */}
        <div className="flex flex-col gap-1 relative" ref={clienteRef}>
          <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
            Cliente (opcional)
          </label>
          {clienteNome ? (
            <div className="flex items-center gap-2 h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)]">
              <span className="flex-1 text-base-causa text-[var(--color-text)]">{clienteNome}</span>
              <button
                type="button"
                onClick={() => {
                  setClienteNome('');
                  setForm((p) => ({ ...p, clienteId: '' }));
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
                placeholder="Buscar cliente..."
                value={clienteBusca}
                onChange={(e) => {
                  setClienteBusca(e.target.value);
                  setShowClienteDropdown(true);
                }}
                onFocus={() => clienteOptions.length > 0 && setShowClienteDropdown(true)}
                className="w-full h-9 pl-8 pr-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa placeholder:text-[var(--color-text-muted)]/60"
              />
              {showClienteDropdown && clienteOptions.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] max-h-32 overflow-auto">
                  {clienteOptions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setForm((p) => ({ ...p, clienteId: c.id }));
                        setClienteNome(c.nome);
                        setClienteBusca('');
                        setShowClienteDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-causa-surface-alt transition-causa cursor-pointer text-base-causa text-[var(--color-text)]"
                    >
                      {c.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Processo autocomplete */}
        <div className="flex flex-col gap-1 relative" ref={processoRef}>
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
                  setShowProcessoDropdown(true);
                }}
                onFocus={() => processoOptions.length > 0 && setShowProcessoDropdown(true)}
                className="w-full h-9 pl-8 pr-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa placeholder:text-[var(--color-text-muted)]/60 font-[var(--font-mono)]"
              />
              {showProcessoDropdown && processoOptions.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] max-h-32 overflow-auto">
                  {processoOptions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, processoId: p.id }));
                        setProcessoLabel(p.numeroCnj);
                        setProcessoBusca('');
                        setShowProcessoDropdown(false);
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

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) =>
                setForm((p) => ({ ...p, tipo: e.target.value as 'fixo' | 'exito' | 'por_hora' }))
              }
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Valor (R$)"
            placeholder="10.000,00"
            value={form.valor}
            onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
            error={errors.valor}
          />
        </div>

        {form.tipo === 'exito' && (
          <Input
            label="Percentual de êxito (%)"
            placeholder="30"
            value={form.percentualExito}
            onChange={(e) => setForm((p) => ({ ...p, percentualExito: e.target.value }))}
            error={errors.percentualExito}
          />
        )}

        <Input
          label="Vencimento (opcional)"
          type="date"
          value={form.vencimento}
          onChange={(e) => setForm((p) => ({ ...p, vencimento: e.target.value }))}
        />

        {isEdit && (
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  status: e.target.value as 'pendente' | 'recebido' | 'inadimplente',
                }))
              }
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              <option value="pendente">Pendente</option>
              <option value="recebido">Recebido</option>
              <option value="inadimplente">Inadimplente</option>
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
            {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Registrar honorário'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
