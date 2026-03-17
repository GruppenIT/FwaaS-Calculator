import { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';

export interface ContatoEditData {
  id?: string;
  nome: string;
  tipo: string;
  cpfCnpj: string;
  oabNumero: string;
  oabSeccional: string;
  email: string;
  telefone: string;
  whatsapp: string;
  especialidade: string;
  observacoes: string;
  avaliacao: number;
}

const TIPOS = [
  { value: 'correspondente', label: 'Correspondente' },
  { value: 'perito', label: 'Perito' },
  { value: 'testemunha', label: 'Testemunha' },
  { value: 'oficial_justica', label: 'Oficial de Justiça' },
  { value: 'mediador', label: 'Mediador' },
  { value: 'tradutor', label: 'Tradutor' },
  { value: 'contador', label: 'Contador' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'outro', label: 'Outro' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: ContatoEditData) => void;
  initial: ContatoEditData | undefined;
}

export function ContatoModal({ open, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<ContatoEditData>({
    nome: '',
    tipo: 'correspondente',
    cpfCnpj: '',
    oabNumero: '',
    oabSeccional: '',
    email: '',
    telefone: '',
    whatsapp: '',
    especialidade: '',
    observacoes: '',
    avaliacao: 0,
  });

  useEffect(() => {
    if (initial) {
      setForm(initial);
    } else {
      setForm({
        nome: '',
        tipo: 'correspondente',
        cpfCnpj: '',
        oabNumero: '',
        oabSeccional: '',
        email: '',
        telefone: '',
        whatsapp: '',
        especialidade: '',
        observacoes: '',
        avaliacao: 0,
      });
    }
  }, [initial, open]);

  if (!open) return null;

  const isEdit = !!initial?.id;

  function set(field: keyof ContatoEditData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {isEdit ? 'Editar Contato' : 'Novo Contato'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Nome *
              </label>
              <input
                type="text"
                required
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>

            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Tipo *
              </label>
              <select
                required
                value={form.tipo}
                onChange={(e) => set('tipo', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                CPF/CNPJ
              </label>
              <input
                type="text"
                value={form.cpfCnpj}
                onChange={(e) => set('cpfCnpj', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>

            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => set('telefone', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>

            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                OAB
              </label>
              <input
                type="text"
                value={form.oabNumero}
                onChange={(e) => set('oabNumero', e.target.value)}
                placeholder="Número"
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Seccional
              </label>
              <input
                type="text"
                value={form.oabSeccional}
                onChange={(e) => set('oabSeccional', e.target.value)}
                placeholder="UF"
                maxLength={2}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>
            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                Especialidade
              </label>
              <input
                type="text"
                value={form.especialidade}
                onChange={(e) => set('especialidade', e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
              Avaliação
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('avaliacao', form.avaliacao === v ? 0 : v)}
                  className="cursor-pointer"
                >
                  <Star
                    size={20}
                    className={
                      v <= form.avaliacao
                        ? 'text-causa-warning fill-causa-warning'
                        : 'text-[var(--color-text-muted)]'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
              Observações
            </label>
            <textarea
              value={form.observacoes}
              onChange={(e) => set('observacoes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa"
            />
          </div>
        </form>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(form)}>{isEdit ? 'Salvar' : 'Criar'}</Button>
        </div>
      </div>
    </div>
  );
}
