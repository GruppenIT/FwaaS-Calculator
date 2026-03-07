import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowLeft } from 'lucide-react';

interface AdminData {
  nome: string;
  email: string;
  senha: string;
  oabNumero: string;
  oabSeccional: string;
}

interface Props {
  onBack: () => void;
  onSubmit: (data: AdminData) => void;
}

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

export function StepAdmin({ onBack, onSubmit }: Props) {
  const [form, setForm] = useState<AdminData>({
    nome: '',
    email: '',
    senha: '',
    oabNumero: '',
    oabSeccional: '',
  });
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório';
    if (!form.email.trim()) e.email = 'Email é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (form.senha.length < 8) e.senha = 'Mínimo 8 caracteres';
    if (form.senha !== confirmarSenha) e.confirmarSenha = 'Senhas não conferem';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (validate()) onSubmit(form);
  }

  function update(field: keyof AdminData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm-causa text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <h2 className="text-xl-causa text-[var(--color-text)] mb-1">Criar administrador</h2>
      <p className="text-sm-causa text-[var(--color-text-muted)] mb-6">
        Este será o primeiro usuário do sistema com acesso total.
      </p>

      <div className="flex flex-col gap-4">
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

        <Input
          label="Senha"
          type="password"
          value={form.senha}
          onChange={(e) => update('senha', e.target.value)}
          error={errors.senha}
        />

        <Input
          label="Confirmar senha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          error={errors.confirmarSenha}
        />

        <Button type="submit" className="mt-2">
          Criar e continuar
        </Button>
      </div>
    </form>
  );
}
