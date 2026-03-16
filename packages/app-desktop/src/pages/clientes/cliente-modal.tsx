import { useState, type FormEvent } from 'react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { ClienteData, CreateClienteData, EnderecoJson } from '../../lib/api';
import * as api from '../../lib/api';

export type ClienteEditData = ClienteData;

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editData?: ClienteEditData | null;
}

const ESTADO_CIVIL_LABELS: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  uniao_estavel: 'União Estável',
  separado: 'Separado(a)',
};

const ORIGEM_LABELS: Record<string, string> = {
  indicacao: 'Indicação',
  site: 'Site',
  oab: 'OAB',
  redes_sociais: 'Redes Sociais',
  google: 'Google',
  outro: 'Outro',
};

const STATUS_LABELS: Record<string, string> = {
  prospecto: 'Prospecto',
  ativo: 'Ativo',
  inativo: 'Inativo',
  encerrado: 'Encerrado',
};

const CONTATO_LABELS: Record<string, string> = {
  email: 'Email',
  telefone: 'Telefone',
  whatsapp: 'WhatsApp',
};

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Record<string, string>;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa"
      >
        <option value="">{placeholder ?? 'Selecione...'}</option>
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa resize-none"
      />
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-sm-causa font-semibold text-[var(--color-text)] border-b border-[var(--color-border)] pb-1 mt-2">
      {title}
    </h3>
  );
}

interface FormState {
  nome: string;
  nomeSocial: string;
  cpfCnpj: string;
  rg: string;
  rgOrgaoEmissor: string;
  dataNascimento: string;
  nacionalidade: string;
  estadoCivil: string;
  profissao: string;
  email: string;
  emailSecundario: string;
  telefone: string;
  telefoneSecundario: string;
  whatsapp: string;
  observacoes: string;
  origemCaptacao: string;
  indicadoPor: string;
  statusCliente: string;
  dataContrato: string;
  contatoPreferencial: string;
  tags: string;
  endereco: EnderecoJson;
  enderecoComercial: EnderecoJson;
}

const EMPTY_ENDERECO: EnderecoJson = {
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
};

function initForm(ed?: ClienteEditData | null): FormState {
  return {
    nome: ed?.nome ?? '',
    nomeSocial: ed?.nomeSocial ?? '',
    cpfCnpj: ed?.cpfCnpj ?? '',
    rg: ed?.rg ?? '',
    rgOrgaoEmissor: ed?.rgOrgaoEmissor ?? '',
    dataNascimento: ed?.dataNascimento ?? '',
    nacionalidade: ed?.nacionalidade ?? '',
    estadoCivil: ed?.estadoCivil ?? '',
    profissao: ed?.profissao ?? '',
    email: ed?.email ?? '',
    emailSecundario: ed?.emailSecundario ?? '',
    telefone: ed?.telefone ?? '',
    telefoneSecundario: ed?.telefoneSecundario ?? '',
    whatsapp: ed?.whatsapp ?? '',
    observacoes: ed?.observacoes ?? '',
    origemCaptacao: ed?.origemCaptacao ?? '',
    indicadoPor: ed?.indicadoPor ?? '',
    statusCliente: ed?.statusCliente ?? 'ativo',
    dataContrato: ed?.dataContrato ?? '',
    contatoPreferencial: ed?.contatoPreferencial ?? '',
    tags: ed?.tags?.join(', ') ?? '',
    endereco: ed?.endereco ?? { ...EMPTY_ENDERECO },
    enderecoComercial: ed?.enderecoComercial ?? { ...EMPTY_ENDERECO },
  };
}

export function ClienteModal({ onClose, onSaved, editData }: Props) {
  const isEdit = !!editData;
  const [tipo, setTipo] = useState<'PF' | 'PJ'>(editData?.tipo ?? 'PF');
  const [form, setForm] = useState<FormState>(() => initForm(editData));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Nome completo é obrigatório';
    if (!form.cpfCnpj) {
      e.cpfCnpj = tipo === 'PF' ? 'CPF é obrigatório' : 'CNPJ é obrigatório';
    } else {
      const digits = form.cpfCnpj.replace(/\D/g, '');
      if (tipo === 'PF' && digits.length !== 11) e.cpfCnpj = 'CPF deve ter 11 dígitos';
      if (tipo === 'PJ' && digits.length !== 14) e.cpfCnpj = 'CNPJ deve ter 14 dígitos';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (form.emailSecundario && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailSecundario))
      e.emailSecundario = 'Email inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildPayload(): CreateClienteData {
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    function cleanEndereco(end: EnderecoJson): EnderecoJson | undefined {
      const hasValue = Object.values(end).some((v) => v && v.trim());
      return hasValue ? end : undefined;
    }

    return {
      tipo,
      nome: form.nome,
      cpfCnpj: form.cpfCnpj,
      ...(form.nomeSocial ? { nomeSocial: form.nomeSocial } : {}),
      ...(form.rg ? { rg: form.rg } : {}),
      ...(form.rgOrgaoEmissor ? { rgOrgaoEmissor: form.rgOrgaoEmissor } : {}),
      ...(form.dataNascimento ? { dataNascimento: form.dataNascimento } : {}),
      ...(form.nacionalidade ? { nacionalidade: form.nacionalidade } : {}),
      ...(form.estadoCivil ? { estadoCivil: form.estadoCivil } : {}),
      ...(form.profissao ? { profissao: form.profissao } : {}),
      ...(form.email ? { email: form.email } : {}),
      ...(form.emailSecundario ? { emailSecundario: form.emailSecundario } : {}),
      ...(form.telefone ? { telefone: form.telefone } : {}),
      ...(form.telefoneSecundario ? { telefoneSecundario: form.telefoneSecundario } : {}),
      ...(form.whatsapp ? { whatsapp: form.whatsapp } : {}),
      ...(cleanEndereco(form.endereco)
        ? { endereco: cleanEndereco(form.endereco) as EnderecoJson }
        : {}),
      ...(cleanEndereco(form.enderecoComercial)
        ? { enderecoComercial: cleanEndereco(form.enderecoComercial) as EnderecoJson }
        : {}),
      ...(form.observacoes ? { observacoes: form.observacoes } : {}),
      ...(form.origemCaptacao ? { origemCaptacao: form.origemCaptacao } : {}),
      ...(form.indicadoPor ? { indicadoPor: form.indicadoPor } : {}),
      ...(form.statusCliente ? { statusCliente: form.statusCliente } : {}),
      ...(form.dataContrato ? { dataContrato: form.dataContrato } : {}),
      ...(form.contatoPreferencial ? { contatoPreferencial: form.contatoPreferencial } : {}),
      ...(tags.length > 0 ? { tags } : {}),
    };
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await api.atualizarCliente(editData.id, payload);
      } else {
        await api.criarCliente(payload);
      }
      onSaved();
    } catch (err) {
      setErrors({ geral: err instanceof Error ? err.message : 'Erro ao salvar.' });
    } finally {
      setLoading(false);
    }
  }

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateEndereco(which: 'endereco' | 'enderecoComercial', field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [which]: { ...prev[which], [field]: value },
    }));
  }

  function handleDocChange(value: string) {
    const formatted = tipo === 'PF' ? formatCpf(value) : formatCnpj(value);
    setForm((prev) => ({ ...prev, cpfCnpj: formatted }));
  }

  function EnderecoFields({
    which,
    label,
  }: {
    which: 'endereco' | 'enderecoComercial';
    label: string;
  }) {
    const end = form[which];
    return (
      <>
        <SectionTitle title={label} />
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="Logradouro"
              value={end.logradouro ?? ''}
              onChange={(e) => updateEndereco(which, 'logradouro', e.target.value)}
            />
          </div>
          <Input
            label="Número"
            value={end.numero ?? ''}
            onChange={(e) => updateEndereco(which, 'numero', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Complemento"
            value={end.complemento ?? ''}
            onChange={(e) => updateEndereco(which, 'complemento', e.target.value)}
          />
          <Input
            label="Bairro"
            value={end.bairro ?? ''}
            onChange={(e) => updateEndereco(which, 'bairro', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Cidade"
            value={end.cidade ?? ''}
            onChange={(e) => updateEndereco(which, 'cidade', e.target.value)}
          />
          <Input
            label="UF"
            value={end.uf ?? ''}
            onChange={(e) => updateEndereco(which, 'uf', e.target.value)}
            maxLength={2}
          />
          <Input
            label="CEP"
            value={end.cep ?? ''}
            onChange={(e) => updateEndereco(which, 'cep', e.target.value)}
            placeholder="00000-000"
          />
        </div>
      </>
    );
  }

  return (
    <Modal open title={isEdit ? 'Editar cliente' : 'Novo cliente'} onClose={onClose} size="lg">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1"
      >
        {/* Toggle PF/PJ */}
        <div className="flex gap-1 p-1 bg-causa-surface-alt rounded-[var(--radius-md)]">
          {(['PF', 'PJ'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTipo(t);
                setForm((prev) => ({ ...prev, cpfCnpj: '' }));
              }}
              className={`flex-1 py-1.5 text-sm-causa font-medium rounded-[var(--radius-sm)] transition-causa cursor-pointer ${
                tipo === t
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              {t === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
            </button>
          ))}
        </div>

        {/* Dados Pessoais / Empresariais */}
        <SectionTitle title={tipo === 'PF' ? 'Dados Pessoais' : 'Dados Empresariais'} />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={tipo === 'PF' ? 'Nome completo *' : 'Razão social *'}
            value={form.nome}
            onChange={(e) => update('nome', e.target.value)}
            error={errors.nome}
            autoFocus
          />
          <Input
            label="Nome social / Fantasia"
            value={form.nomeSocial}
            onChange={(e) => update('nomeSocial', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={tipo === 'PF' ? 'CPF *' : 'CNPJ *'}
            placeholder={tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
            value={form.cpfCnpj}
            onChange={(e) => handleDocChange(e.target.value)}
            error={errors.cpfCnpj}
          />
          {tipo === 'PF' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="RG" value={form.rg} onChange={(e) => update('rg', e.target.value)} />
              <Input
                label="Órgão emissor"
                value={form.rgOrgaoEmissor}
                onChange={(e) => update('rgOrgaoEmissor', e.target.value)}
                placeholder="SSP/SP"
              />
            </div>
          )}
        </div>

        {tipo === 'PF' && (
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Data de nascimento"
              type="date"
              value={form.dataNascimento}
              onChange={(e) => update('dataNascimento', e.target.value)}
            />
            <Input
              label="Nacionalidade"
              value={form.nacionalidade}
              onChange={(e) => update('nacionalidade', e.target.value)}
              placeholder="Brasileira"
            />
            <Select
              label="Estado civil"
              value={form.estadoCivil}
              onChange={(v) => update('estadoCivil', v)}
              options={ESTADO_CIVIL_LABELS}
            />
          </div>
        )}

        <Input
          label="Profissão / Atividade"
          value={form.profissao}
          onChange={(e) => update('profissao', e.target.value)}
        />

        {/* Contato */}
        <SectionTitle title="Contato" />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Email principal"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            error={errors.email}
          />
          <Input
            label="Email secundário"
            type="email"
            value={form.emailSecundario}
            onChange={(e) => update('emailSecundario', e.target.value)}
            error={errors.emailSecundario}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) => update('telefone', e.target.value)}
            placeholder="(11) 99999-0000"
          />
          <Input
            label="Telefone secundário"
            value={form.telefoneSecundario}
            onChange={(e) => update('telefoneSecundario', e.target.value)}
            placeholder="(11) 99999-0000"
          />
          <Input
            label="WhatsApp"
            value={form.whatsapp}
            onChange={(e) => update('whatsapp', e.target.value)}
            placeholder="(11) 99999-0000"
          />
        </div>
        <Select
          label="Contato preferencial"
          value={form.contatoPreferencial}
          onChange={(v) => update('contatoPreferencial', v)}
          options={CONTATO_LABELS}
        />

        {/* Endereço */}
        <EnderecoFields which="endereco" label="Endereço Residencial" />
        <EnderecoFields which="enderecoComercial" label="Endereço Comercial" />

        {/* Informações Adicionais */}
        <SectionTitle title="Informações Adicionais" />
        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Status"
            value={form.statusCliente}
            onChange={(v) => update('statusCliente', v)}
            options={STATUS_LABELS}
          />
          <Select
            label="Origem de captação"
            value={form.origemCaptacao}
            onChange={(v) => update('origemCaptacao', v)}
            options={ORIGEM_LABELS}
          />
          <Input
            label="Indicado por"
            value={form.indicadoPor}
            onChange={(e) => update('indicadoPor', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data do contrato"
            type="date"
            value={form.dataContrato}
            onChange={(e) => update('dataContrato', e.target.value)}
          />
          <Input
            label="Tags (separadas por vírgula)"
            value={form.tags}
            onChange={(e) => update('tags', e.target.value)}
            placeholder="trabalhista, urgente"
          />
        </div>
        <TextArea
          label="Observações"
          value={form.observacoes}
          onChange={(v) => update('observacoes', v)}
        />

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
            {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
