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

export function UsuarioModal({ onClose, onCreated }: Props) {
  const { financeiro: financeiroEnabled } = useFeatures();
  const availableRoles = financeiroEnabled ? ROLES : ROLES.filter((r) => r.value !== 'financeiro');
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    oabNumero: '',
    oabSeccional: '',
    role: 'advogado',
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
      await api.criarUsuario({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        role: form.role,
        ...(form.oabNumero ? { oabNumero: form.oabNumero } : {}),
        ...(form.oabSeccional ? { oabSeccional: form.oabSeccional } : {}),
      });
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
    <Modal open title="Novo usuário" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome completo"
          value={form.nome}
          onChange={(e) => update('nome', e.target.value)}
          error={errors.nome}
          autoFocus
        />

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          error={errors.email}
        />

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

        <div className="grid grid-cols-2 gap-3">
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
