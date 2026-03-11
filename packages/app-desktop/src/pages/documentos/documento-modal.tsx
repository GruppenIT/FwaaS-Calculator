import { useState, useEffect, useRef } from 'react';
import { Upload, X } from 'lucide-react';
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
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  /** Pré-define o clienteId (oculta o campo de seleção) */
  presetClienteId?: string | undefined;
  /** Pré-define o processoId (oculta o campo de seleção) */
  presetProcessoId?: string | undefined;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentoModal({ open, onClose, onSave, presetClienteId, presetProcessoId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [processoId, setProcessoId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [confidencial, setConfidencial] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [processos, setProcessos] = useState<api.ProcessoListRow[]>([]);
  const [clientes, setClientes] = useState<api.ClienteData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) {
      if (!presetProcessoId) api.listarProcessos().then(setProcessos).catch(() => {});
      if (!presetClienteId) api.listarClientes().then(setClientes).catch(() => {});
      setFile(null);
      setDescricao('');
      setCategoria('');
      setProcessoId(presetProcessoId ?? '');
      setClienteId(presetClienteId ?? '');
      setConfidencial(false);
      setError('');
    }
  }, [open, presetClienteId, presetProcessoId]);

  if (!open) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }

  function readFileAsBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:xxx;base64, prefix
        resolve(result.split(',')[1] ?? '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  async function computeSha256(base64: string): Promise<string> {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Selecione um arquivo.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const conteudoBase64 = await readFileAsBase64(file);
      const hashSha256 = await computeSha256(conteudoBase64);

      await api.criarDocumento({
        nome: file.name,
        descricao: descricao || undefined,
        categoria: categoria || undefined,
        processoId: processoId || undefined,
        clienteId: clienteId || undefined,
        confidencial,
        tipoMime: file.type || 'application/octet-stream',
        tamanhoBytes: file.size,
        hashSha256,
        conteudo: conteudoBase64,
      });

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload.');
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
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Novo Documento</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Área de upload */}
          <div>
            <label className={labelClass}>Arquivo *</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`${inputClass} flex items-center gap-2 cursor-pointer hover:border-[var(--color-primary)] transition-causa text-left`}
            >
              <Upload size={16} className="text-[var(--color-primary)] shrink-0" />
              {file ? (
                <span className="truncate">
                  {file.name}{' '}
                  <span className="text-[var(--color-text-muted)]">
                    ({formatFileSize(file.size)})
                  </span>
                </span>
              ) : (
                <span className="text-[var(--color-text-muted)]">Clique para selecionar...</span>
              )}
            </button>
          </div>

          {/* Descrição */}
          <div>
            <label className={labelClass}>Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional do documento"
              className={inputClass}
            />
          </div>

          {/* Categoria + Confidencial */}
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

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm-causa text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={confidencial}
                  onChange={(e) => setConfidencial(e.target.checked)}
                  className="accent-[var(--color-primary)]"
                />
                Confidencial
              </label>
            </div>
          </div>

          {/* Vínculo — oculto quando pre-definido pela tela pai */}
          {(!presetProcessoId || !presetClienteId) && (
            <div className="grid grid-cols-2 gap-3">
              {!presetProcessoId && (
                <div>
                  <label className={labelClass}>Processo</label>
                  <select
                    value={processoId}
                    onChange={(e) => setProcessoId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Nenhum</option>
                    {processos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.numeroCnj}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!presetClienteId && (
                <div>
                  <label className={labelClass}>Cliente</label>
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Nenhum</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

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
          <Button onClick={() => formRef.current?.requestSubmit()} disabled={saving || !file}>
            {saving ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
