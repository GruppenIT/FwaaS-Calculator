import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import * as api from '../../lib/api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const TIPOS = [
  { value: 'audiencia', label: 'Audiência' },
  { value: 'diligencia', label: 'Diligência' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'prazo', label: 'Prazo' },
];

export function EventoModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'audiencia' as 'audiencia' | 'diligencia' | 'reuniao' | 'prazo',
    dataHoraInicio: '',
    dataHoraFim: '',
    local: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.titulo.trim()) e.titulo = 'Obrigatório';
    if (!form.dataHoraInicio) e.dataHoraInicio = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.criarEvento({
        titulo: form.titulo,
        tipo: form.tipo,
        dataHoraInicio: new Date(form.dataHoraInicio).toISOString(),
        ...(form.dataHoraFim ? { dataHoraFim: new Date(form.dataHoraFim).toISOString() } : {}),
        ...(form.local ? { local: form.local } : {}),
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
          <h2 className="text-lg-causa text-[var(--color-text)]">Novo evento</h2>
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
            label="Título"
            placeholder="Ex: Audiência de instrução"
            value={form.titulo}
            onChange={(e) => update('titulo', e.target.value)}
            error={errors.titulo}
            autoFocus
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm-causa font-medium text-[var(--color-text-muted)]">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => update('tipo', e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] text-base-causa focus-causa transition-causa cursor-pointer"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Início"
              type="datetime-local"
              value={form.dataHoraInicio}
              onChange={(e) => update('dataHoraInicio', e.target.value)}
              error={errors.dataHoraInicio}
            />
            <Input
              label="Fim (opcional)"
              type="datetime-local"
              value={form.dataHoraFim}
              onChange={(e) => update('dataHoraFim', e.target.value)}
            />
          </div>

          <Input
            label="Local (opcional)"
            placeholder="Ex: Fórum Central, Sala 5"
            value={form.local}
            onChange={(e) => update('local', e.target.value)}
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
              {loading ? 'Salvando...' : 'Criar evento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
