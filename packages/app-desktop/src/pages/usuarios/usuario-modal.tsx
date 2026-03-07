import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface Props {
  onClose: () => void;
}

const ROLES = [
  { value: 'advogado', label: 'Advogado' },
  { value: 'socio', label: 'Sócio' },
  { value: 'estagiario', label: 'Estagiário' },
  { value: 'secretaria', label: 'Secretária' },
  { value: 'financeiro', label: 'Financeiro' },
];

const UF_OPTIONS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
];

export function UsuarioModal({ onClose }: Props) {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    oabNumero: '',
    oabSeccional: '',
    roleId: 'advogado',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Obrigatório';
    if (!form.email.trim()) e.email = 'Obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (form.senha.length < 8) e.senha = 'Mínimo 8 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    // TODO: chamar AuthService.createUser via IPC
    onClose();
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-[var(--color-border)] w-full max-w-md p-6 animate-[fadeIn_180ms_ease-out]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg-causa text-[var(--color-text)]">Novo usuário</h2>
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
              value={form.roleId}
              onChange={(e) => update('roleId', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
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
              <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">Seccional</label>
              <select
                value={form.oabSeccional}
                onChange={(e) => update('oabSeccional', e.target.value)}
                className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
              >
                <option value="">—</option>
                {UF_OPTIONS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Criar usuário
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
