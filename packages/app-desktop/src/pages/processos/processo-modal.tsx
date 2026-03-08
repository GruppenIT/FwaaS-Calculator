import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../lib/auth-context';
import * as api from '../../lib/api';

export interface ProcessoEditData {
  id: string;
  numeroCnj: string;
  clienteId: string;
  clienteNome: string | null;
  tribunalSigla: string;
  plataforma: string;
  area: string;
  fase: string;
  status: 'ativo' | 'arquivado' | 'encerrado';
  valorCausa: number | null;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editData?: ProcessoEditData | null;
}

interface ClienteOption {
  id: string;
  nome: string;
  cpfCnpj: string | null;
}

const AREAS = [
  { value: 'civel', label: 'Cível' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'previdenciario', label: 'Previdenciário' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'tributario', label: 'Tributário' },
];

const FASES = [
  { value: 'conhecimento', label: 'Conhecimento' },
  { value: 'recursal', label: 'Recursal' },
  { value: 'execucao', label: 'Execução' },
];

const PLATAFORMAS = [
  { value: 'pje', label: 'PJe' },
  { value: 'esaj', label: 'e-SAJ' },
  { value: 'eproc', label: 'eProc' },
  { value: 'projudi', label: 'Projudi' },
];

/**
 * Formata número CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO
 */
function formatCnj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 20);
  let result = '';
  if (digits.length > 0) result += digits.slice(0, 7);
  if (digits.length > 7) result += '-' + digits.slice(7, 9);
  if (digits.length > 9) result += '.' + digits.slice(9, 13);
  if (digits.length > 13) result += '.' + digits.slice(13, 14);
  if (digits.length > 14) result += '.' + digits.slice(14, 16);
  if (digits.length > 16) result += '.' + digits.slice(16, 20);
  return result;
}

export function ProcessoModal({ onClose, onSaved, editData }: Props) {
  const isEdit = !!editData;
  const { user } = useAuth();
  const [form, setForm] = useState({
    numeroCnj: editData?.numeroCnj ?? '',
    clienteId: editData?.clienteId ?? '',
    tribunalSigla: editData?.tribunalSigla ?? '',
    plataforma: editData?.plataforma ?? 'pje',
    area: editData?.area ?? 'civel',
    fase: editData?.fase ?? 'conhecimento',
    status: editData?.status ?? 'ativo',
    valorCausa: editData?.valorCausa ? String(editData.valorCausa) : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Cliente autocomplete state
  const [clienteBusca, setClienteBusca] = useState('');
  const [clienteNome, setClienteNome] = useState(editData?.clienteNome ?? '');
  const [clienteOptions, setClienteOptions] = useState<ClienteOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clienteBusca || clienteBusca.length < 2) {
      setClienteOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api.listarClientes(clienteBusca);
        setClienteOptions(data.map((c) => ({ id: c.id, nome: c.nome, cpfCnpj: c.cpfCnpj })));
      } catch {
        setClienteOptions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [clienteBusca]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectCliente(c: ClienteOption) {
    setForm((prev) => ({ ...prev, clienteId: c.id }));
    setClienteNome(c.nome);
    setClienteBusca('');
    setShowDropdown(false);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    const cnjDigits = form.numeroCnj.replace(/\D/g, '');
    if (cnjDigits.length !== 20) e.numeroCnj = 'Número CNJ deve ter 20 dígitos';
    if (!form.tribunalSigla.trim()) e.tribunalSigla = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const valor = form.valorCausa
        ? parseFloat(form.valorCausa.replace(/[^\d.,]/g, '').replace(',', '.'))
        : undefined;
      if (isEdit) {
        await api.atualizarProcesso(editData.id, {
          numeroCnj: form.numeroCnj,
          ...(form.clienteId ? { clienteId: form.clienteId } : {}),
          tribunalSigla: form.tribunalSigla,
          plataforma: form.plataforma,
          area: form.area,
          fase: form.fase,
          status: form.status,
          ...(valor ? { valorCausa: valor } : {}),
        });
      } else {
        await api.criarProcesso({
          numeroCnj: form.numeroCnj,
          clienteId: form.clienteId,
          advogadoResponsavelId: user?.id ?? '',
          tribunalSigla: form.tribunalSigla,
          plataforma: form.plataforma,
          area: form.area,
          fase: form.fase,
          ...(valor ? { valorCausa: valor } : {}),
        });
      }
      onSaved();
    } catch (err) {
      setErrors({ geral: err instanceof Error ? err.message : 'Erro ao cadastrar.' });
    } finally {
      setLoading(false);
    }
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Modal open title={isEdit ? 'Editar processo' : 'Novo processo'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Número CNJ"
          placeholder="0000000-00.0000.0.00.0000"
          value={form.numeroCnj}
          onChange={(e) => update('numeroCnj', formatCnj(e.target.value))}
          error={errors.numeroCnj}
          autoFocus
          className="font-[var(--font-mono)]"
        />

        {/* Cliente autocomplete */}
        <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
          <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
            Cliente
          </label>
          {clienteNome ? (
            <div className="flex items-center gap-2 h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)]">
              <span className="flex-1 text-base-causa text-[var(--color-text)]">{clienteNome}</span>
              <button
                type="button"
                onClick={() => {
                  setClienteNome('');
                  setForm((prev) => ({ ...prev, clienteId: '' }));
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
                placeholder="Buscar cliente por nome..."
                value={clienteBusca}
                onChange={(e) => {
                  setClienteBusca(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => clienteOptions.length > 0 && setShowDropdown(true)}
                className="w-full h-9 pl-8 pr-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa placeholder:text-[var(--color-text-muted)]/60"
              />
              {showDropdown && clienteOptions.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] max-h-40 overflow-auto">
                  {clienteOptions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCliente(c)}
                      className="w-full text-left px-3 py-2 hover:bg-causa-surface-alt transition-causa cursor-pointer"
                    >
                      <span className="text-base-causa text-[var(--color-text)]">{c.nome}</span>
                      {c.cpfCnpj && (
                        <span className="ml-2 text-xs-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                          {c.cpfCnpj}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tribunal"
            placeholder="Ex: TJSP, TRF3"
            value={form.tribunalSigla}
            onChange={(e) => update('tribunalSigla', e.target.value.toUpperCase())}
            error={errors.tribunalSigla}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
              Plataforma
            </label>
            <select
              value={form.plataforma}
              onChange={(e) => update('plataforma', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {PLATAFORMAS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">Área</label>
            <select
              value={form.area}
              onChange={(e) => update('area', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {AREAS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">Fase</label>
            <select
              value={form.fase}
              onChange={(e) => update('fase', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {FASES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Valor da causa (opcional)"
          placeholder="R$ 0,00"
          value={form.valorCausa}
          onChange={(e) => update('valorCausa', e.target.value)}
        />

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
              <option value="ativo">Ativo</option>
              <option value="arquivado">Arquivado</option>
              <option value="encerrado">Encerrado</option>
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
            {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar processo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
