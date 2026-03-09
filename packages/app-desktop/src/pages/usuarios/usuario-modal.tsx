import { useState, type FormEvent } from 'react';
import { Modal } from '../../components/ui/modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import * as api from '../../lib/api';
import { useFeatures } from '../../lib/auth-context';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const ROLES = [
  { value: 'advogado', label: 'Advogado' },
  { value: 'socio', label: 'Sócio' },
  { value: 'estagiario', label: 'Estagiário' },
  { value: 'secretaria', label: 'Secretária' },
  { value: 'financeiro', label: 'Financeiro' },
];

const UF_OPTIONS = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
];

const OAB_TIPOS = [
  { value: '', label: '—' },
  { value: 'inscrito', label: 'Inscrito' },
  { value: 'suplementar', label: 'Suplementar' },
  { value: 'estagiario', label: 'Estagiário' },
];

const AREAS_ATUACAO = [
  { value: '', label: '—' },
  { value: 'civel', label: 'Cível' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'tributario', label: 'Tributário' },
  { value: 'previdenciario', label: 'Previdenciário' },
  { value: 'familia', label: 'Família' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'ambiental', label: 'Ambiental' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'outro', label: 'Outro' },
];

export function UsuarioModal({ onClose, onCreated }: Props) {
  const { financeiro: financeiroEnabled } = useFeatures();
  const availableRoles = financeiroEnabled ? ROLES : ROLES.filter((r) => r.value !== 'financeiro');
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    oabNumero: '',
    oabSeccional: '',
    oabTipo: '',
    telefone: '',
    role: 'advogado',
    areaAtuacao: '',
    especialidade: '',
    taxaHoraria: '',
    dataAdmissao: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Obrigatório';
    if (!form.email.trim()) e.email = 'Obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (form.senha.length < 8) e.senha = 'Mínimo 8 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        role: form.role,
      };
      if (form.oabNumero) payload.oabNumero = form.oabNumero;
      if (form.oabSeccional) payload.oabSeccional = form.oabSeccional;
      if (form.oabTipo) payload.oabTipo = form.oabTipo;
      if (form.telefone) payload.telefone = form.telefone;
      if (form.areaAtuacao) payload.areaAtuacao = form.areaAtuacao;
      if (form.especialidade) payload.especialidade = form.especialidade;
      if (form.taxaHoraria) payload.taxaHoraria = parseFloat(form.taxaHoraria);
      if (form.dataAdmissao) payload.dataAdmissao = form.dataAdmissao;

      await api.criarUsuario(payload as Parameters<typeof api.criarUsuario>[0]);
      onCreated();
    } catch (err) {
      setErrors({ geral: err instanceof Error ? err.message : 'Erro ao criar usuário.' });
    } finally {
      setLoading(false);
    }
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Modal open title="Novo usuário" onClose={onClose} size="lg">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1"
      >
        <Input
          label="Nome completo"
          value={form.nome}
          onChange={(e) => update('nome', e.target.value)}
          error={errors.nome}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            error={errors.email}
          />
          <Input
            label="Telefone (opcional)"
            placeholder="(11) 99999-9999"
            value={form.telefone}
            onChange={(e) => update('telefone', e.target.value)}
          />
        </div>

        <Input
          label="Senha inicial"
          type="password"
          value={form.senha}
          onChange={(e) => update('senha', e.target.value)}
          error={errors.senha}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">Papel</label>
          <select
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
            className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
          >
            {availableRoles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="OAB (opcional)"
            placeholder="123456"
            value={form.oabNumero}
            onChange={(e) => update('oabNumero', e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
              Seccional
            </label>
            <select
              value={form.oabSeccional}
              onChange={(e) => update('oabSeccional', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              <option value="">—</option>
              {UF_OPTIONS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
              Tipo OAB
            </label>
            <select
              value={form.oabTipo}
              onChange={(e) => update('oabTipo', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {OAB_TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">
              Área de atuação
            </label>
            <select
              value={form.areaAtuacao}
              onChange={(e) => update('areaAtuacao', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {AREAS_ATUACAO.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Especialidade (opcional)"
            placeholder="Ex: Direito do Consumidor"
            value={form.especialidade}
            onChange={(e) => update('especialidade', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Taxa horária (R$/h)"
            placeholder="250,00"
            value={form.taxaHoraria}
            onChange={(e) => update('taxaHoraria', e.target.value)}
          />
          <Input
            label="Data de admissão"
            type="date"
            value={form.dataAdmissao}
            onChange={(e) => update('dataAdmissao', e.target.value)}
          />
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
            {loading ? 'Criando...' : 'Criar usuário'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
