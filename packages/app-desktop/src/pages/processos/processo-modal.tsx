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
  numeroAntigo: string | null;
  clienteId: string;
  clienteNome: string | null;
  clienteQualidade: string | null;
  tribunalSigla: string;
  plataforma: string;
  area: string;
  fase: string;
  status: string;
  grau: string | null;
  comarca: string | null;
  vara: string | null;
  juiz: string | null;
  rito: string | null;
  prioridade: string;
  segredoJustica: boolean;
  justicaGratuita: boolean;
  valorCausa: number | null;
  observacoes: string | null;
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
  { value: 'familia', label: 'Família' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'ambiental', label: 'Ambiental' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'outro', label: 'Outro' },
];

const FASES = [
  { value: 'conhecimento', label: 'Conhecimento' },
  { value: 'recursal', label: 'Recursal' },
  { value: 'execucao', label: 'Execução' },
  { value: 'cumprimento_sentenca', label: 'Cumprimento de Sentença' },
  { value: 'liquidacao', label: 'Liquidação' },
];

const PLATAFORMAS = [
  { value: 'pje', label: 'PJe' },
  { value: 'esaj', label: 'e-SAJ' },
  { value: 'eproc', label: 'eProc' },
  { value: 'projudi', label: 'Projudi' },
  { value: 'tucujuris', label: 'Tucujuris' },
  { value: 'sei', label: 'SEI' },
  { value: 'outro', label: 'Outro' },
];

const GRAUS = [
  { value: '', label: '—' },
  { value: 'primeiro', label: '1º Grau' },
  { value: 'segundo', label: '2º Grau' },
  { value: 'superior', label: 'Superior' },
  { value: 'stf', label: 'STF' },
];

const RITOS = [
  { value: '', label: '—' },
  { value: 'ordinario', label: 'Ordinário' },
  { value: 'sumario', label: 'Sumário' },
  { value: 'sumarissimo', label: 'Sumaríssimo' },
  { value: 'especial', label: 'Especial' },
  { value: 'juizado', label: 'Juizado' },
];

const PRIORIDADES = [
  { value: 'normal', label: 'Normal' },
  { value: 'idoso', label: 'Idoso' },
  { value: 'deficiente', label: 'Deficiente' },
  { value: 'grave_enfermidade', label: 'Grave Enfermidade' },
  { value: 'reu_preso', label: 'Réu Preso' },
];

const QUALIDADES = [
  { value: '', label: '—' },
  { value: 'autor', label: 'Autor' },
  { value: 'reu', label: 'Réu' },
  { value: 'terceiro', label: 'Terceiro' },
  { value: 'interessado', label: 'Interessado' },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm-causa font-semibold text-[var(--color-text)] border-b border-[var(--color-border)] pb-1 mt-2">
      {children}
    </h3>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[var(--color-primary)] w-4 h-4"
      />
      <span className="text-sm-causa text-[var(--color-text)]">{label}</span>
    </label>
  );
}

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
    numeroAntigo: editData?.numeroAntigo ?? '',
    clienteId: editData?.clienteId ?? '',
    clienteQualidade: editData?.clienteQualidade ?? '',
    tribunalSigla: editData?.tribunalSigla ?? '',
    plataforma: editData?.plataforma ?? 'pje',
    area: editData?.area ?? 'civel',
    fase: editData?.fase ?? 'conhecimento',
    status: editData?.status ?? 'ativo',
    grau: editData?.grau ?? '',
    comarca: editData?.comarca ?? '',
    vara: editData?.vara ?? '',
    juiz: editData?.juiz ?? '',
    rito: editData?.rito ?? '',
    prioridade: editData?.prioridade ?? 'normal',
    segredoJustica: editData?.segredoJustica ?? false,
    justicaGratuita: editData?.justicaGratuita ?? false,
    valorCausa: editData?.valorCausa ? String(editData.valorCausa) : '',
    observacoes: editData?.observacoes ?? '',
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
      const payload: Record<string, unknown> = {
        numeroCnj: form.numeroCnj,
        tribunalSigla: form.tribunalSigla,
        plataforma: form.plataforma,
        area: form.area,
        fase: form.fase,
        prioridade: form.prioridade,
        segredoJustica: form.segredoJustica,
        justicaGratuita: form.justicaGratuita,
      };
      if (form.clienteId) payload.clienteId = form.clienteId;
      if (form.clienteQualidade) payload.clienteQualidade = form.clienteQualidade;
      if (form.numeroAntigo) payload.numeroAntigo = form.numeroAntigo;
      if (form.grau) payload.grau = form.grau;
      if (form.comarca) payload.comarca = form.comarca;
      if (form.vara) payload.vara = form.vara;
      if (form.juiz) payload.juiz = form.juiz;
      if (form.rito) payload.rito = form.rito;
      if (valor) payload.valorCausa = valor;
      if (form.observacoes) payload.observacoes = form.observacoes;

      if (isEdit) {
        payload.status = form.status;
        await api.atualizarProcesso(editData.id, payload);
      } else {
        payload.advogadoResponsavelId = user?.id ?? '';
        await api.criarProcesso(payload);
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
    <Modal open title={isEdit ? 'Editar processo' : 'Novo processo'} onClose={onClose} size="lg">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1"
      >
        <SectionTitle>Identificação</SectionTitle>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Número CNJ"
            placeholder="0000000-00.0000.0.00.0000"
            value={form.numeroCnj}
            onChange={(e) => update('numeroCnj', formatCnj(e.target.value))}
            error={errors.numeroCnj}
            autoFocus
            className="font-[var(--font-mono)]"
          />
          <Input
            label="Número antigo (opcional)"
            placeholder="Número anterior"
            value={form.numeroAntigo}
            onChange={(e) => update('numeroAntigo', e.target.value)}
          />
        </div>

        {/* Cliente autocomplete */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
              Cliente
            </label>
            {clienteNome ? (
              <div className="flex items-center gap-2 h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)]">
                <span className="flex-1 text-base-causa text-[var(--color-text)]">
                  {clienteNome}
                </span>
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
          <Select
            label="Qualidade do cliente"
            value={form.clienteQualidade}
            onChange={(v) => update('clienteQualidade', v)}
            options={QUALIDADES}
          />
        </div>

        <SectionTitle>Classificação</SectionTitle>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tribunal"
            placeholder="Ex: TJSP, TRF3"
            value={form.tribunalSigla}
            onChange={(e) => update('tribunalSigla', e.target.value.toUpperCase())}
            error={errors.tribunalSigla}
          />
          <Select
            label="Plataforma"
            value={form.plataforma}
            onChange={(v) => update('plataforma', v)}
            options={PLATAFORMAS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Área"
            value={form.area}
            onChange={(v) => update('area', v)}
            options={AREAS}
          />
          <Select
            label="Fase"
            value={form.fase}
            onChange={(v) => update('fase', v)}
            options={FASES}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Grau"
            value={form.grau}
            onChange={(v) => update('grau', v)}
            options={GRAUS}
          />
          <Select
            label="Rito"
            value={form.rito}
            onChange={(v) => update('rito', v)}
            options={RITOS}
          />
        </div>

        <SectionTitle>Localização</SectionTitle>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Comarca"
            placeholder="Ex: São Paulo"
            value={form.comarca}
            onChange={(e) => update('comarca', e.target.value)}
          />
          <Input
            label="Vara"
            placeholder="Ex: 5ª Vara Cível"
            value={form.vara}
            onChange={(e) => update('vara', e.target.value)}
          />
          <Input
            label="Juiz"
            placeholder="Nome do juiz"
            value={form.juiz}
            onChange={(e) => update('juiz', e.target.value)}
          />
        </div>

        <SectionTitle>Detalhes</SectionTitle>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Prioridade"
            value={form.prioridade}
            onChange={(v) => update('prioridade', v)}
            options={PRIORIDADES}
          />
          <Input
            label="Valor da causa (opcional)"
            placeholder="R$ 0,00"
            value={form.valorCausa}
            onChange={(e) => update('valorCausa', e.target.value)}
          />
        </div>

        <div className="flex gap-6">
          <Checkbox
            label="Segredo de justiça"
            checked={form.segredoJustica}
            onChange={(v) => update('segredoJustica', v)}
          />
          <Checkbox
            label="Justiça gratuita"
            checked={form.justicaGratuita}
            onChange={(v) => update('justicaGratuita', v)}
          />
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
            placeholder="Observações sobre o processo..."
          />
        </div>

        {isEdit && (
          <Select
            label="Status"
            value={form.status}
            onChange={(v) => update('status', v)}
            options={[
              { value: 'ativo', label: 'Ativo' },
              { value: 'arquivado', label: 'Arquivado' },
              { value: 'encerrado', label: 'Encerrado' },
              { value: 'suspenso', label: 'Suspenso' },
              { value: 'baixado', label: 'Baixado' },
            ]}
          />
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
