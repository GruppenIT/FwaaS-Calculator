import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import * as api from '../../lib/api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

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

export function ClienteModal({ onClose, onCreated }: Props) {
  const [tipo, setTipo] = useState<'PF' | 'PJ'>('PF');
  const [form, setForm] = useState({
    nome: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Obrigatório';
    if (form.cpfCnpj) {
      const digits = form.cpfCnpj.replace(/\D/g, '');
      if (tipo === 'PF' && digits.length !== 11) e.cpfCnpj = 'CPF deve ter 11 dígitos';
      if (tipo === 'PJ' && digits.length !== 14) e.cpfCnpj = 'CNPJ deve ter 14 dígitos';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.criarCliente({
        tipo,
        nome: form.nome,
        ...(form.cpfCnpj ? { cpfCnpj: form.cpfCnpj } : {}),
        ...(form.email ? { email: form.email } : {}),
        ...(form.telefone ? { telefone: form.telefone } : {}),
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

  function handleDocChange(value: string) {
    const formatted = tipo === 'PF' ? formatCpf(value) : formatCnpj(value);
    setForm((prev) => ({ ...prev, cpfCnpj: formatted }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-[var(--color-border)] w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg-causa text-[var(--color-text)]">Novo cliente</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] hover:bg-causa-surface-alt transition-causa cursor-pointer text-[var(--color-text-muted)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <Input
            label={tipo === 'PF' ? 'Nome completo' : 'Razão social'}
            value={form.nome}
            onChange={(e) => update('nome', e.target.value)}
            error={errors.nome}
            autoFocus
          />

          <Input
            label={tipo === 'PF' ? 'CPF' : 'CNPJ'}
            placeholder={tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
            value={form.cpfCnpj}
            onChange={(e) => handleDocChange(e.target.value)}
            error={errors.cpfCnpj}
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />

          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) => update('telefone', e.target.value)}
            placeholder="(11) 99999-0000"
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
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
