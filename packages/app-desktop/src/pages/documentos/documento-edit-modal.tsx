import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import * as api from '../../lib/api';

const CATEGORIAS = [
  { value: '', label: 'Sem categoria' },
  { value: 'peticao', label: 'Petição' },
  { value: 'procuracao', label: 'Procuração' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'substabelecimento', label: 'Substabelecimento' },
  { value: 'certidao', label: 'Certidão' },
  { value: 'laudo_pericial', label: 'Laudo Pericial' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'sentenca', label: 'Sentença' },
  { value: 'acordao', label: 'Acórdão' },
  { value: 'ata_audiencia', label: 'Ata de Audiência' },
  { value: 'correspondencia', label: 'Correspondência' },
  { value: 'nota_fiscal', label: 'Nota Fiscal' },
  { value: 'outro', label: 'Outro' },
];

interface Props {
  documento: api.DocumentoRow;
  onClose: () => void;
  onSave: () => void;
}

export function DocumentoEditModal({ documento, onClose, onSave }: Props) {
  const [nome, setNome] = useState(documento.nome);
  const [descricao, setDescricao] = useState(documento.descricao ?? '');
  const [categoria, setCategoria] = useState(documento.categoria ?? '');
  const [confidencial, setConfidencial] = useState(documento.confidencial);
  const [dataReferencia, setDataReferencia] = useState(documento.dataReferencia ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setNome(documento.nome);
    setDescricao(documento.descricao ?? '');
    setCategoria(documento.categoria ?? '');
    setConfidencial(documento.confidencial);
    setDataReferencia(documento.dataReferencia ?? '');
  }, [documento]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.atualizarDocumento(documento.id, {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        categoria: categoria || null,
        confidencial,
        dataReferencia: dataReferencia || null,
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa';
  const labelClass = 'block text-sm-causa font-medium text-[var(--color-text)] mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Editar Documento</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
          <div>
            <label className={labelClass}>Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className={inputClass}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Data de referência</label>
              <input
                type="date"
                value={dataReferencia}
                onChange={(e) => setDataReferencia(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm-causa text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={confidencial}
              onChange={(e) => setConfidencial(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            Confidencial
          </label>

          {error && (
            <div className="text-sm-causa text-causa-danger bg-causa-danger/8 rounded-[var(--radius-md)] px-3 py-2 border border-causa-danger/20">
              {error}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={(e) => { e.preventDefault(); handleSubmit(e); }} disabled={saving}>
            <Save size={14} className="mr-1" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
