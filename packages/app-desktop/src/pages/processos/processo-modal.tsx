import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../lib/auth-context';
import * as api from '../../lib/api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
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

export function ProcessoModal({ onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    numeroCnj: '',
    clienteId: '',
    tribunalSigla: '',
    plataforma: 'pje',
    area: 'civel',
    fase: 'conhecimento',
    valorCausa: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
      const valor = form.valorCausa ? parseFloat(form.valorCausa.replace(/[^\d.,]/g, '').replace(',', '.')) : undefined;
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
      onCreated();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-[var(--color-border)] w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg-causa text-[var(--color-text)]">Novo processo</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] hover:bg-causa-surface-alt transition-causa cursor-pointer text-[var(--color-text-muted)]"
          >
            <X size={18} />
          </button>
        </div>

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

          {/* TODO: substituir por select/autocomplete de clientes reais */}
          <Input
            label="Cliente"
            placeholder="Buscar cliente..."
            value={form.clienteId}
            onChange={(e) => update('clienteId', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tribunal"
              placeholder="Ex: TJSP, TRF3"
              value={form.tribunalSigla}
              onChange={(e) => update('tribunalSigla', e.target.value.toUpperCase())}
              error={errors.tribunalSigla}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">Plataforma</label>
              <select
                value={form.plataforma}
                onChange={(e) => update('plataforma', e.target.value)}
                className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
              >
                {PLATAFORMAS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
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
                  <option key={a.value} value={a.value}>{a.label}</option>
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
                  <option key={f.value} value={f.value}>{f.label}</option>
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

          {errors.geral && (
            <div className="text-sm-causa text-causa-danger bg-causa-danger/8 rounded-[var(--radius-md)] px-3 py-2 border border-causa-danger/20">
              {errors.geral}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Cadastrando...' : 'Cadastrar processo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
