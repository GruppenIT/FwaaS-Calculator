import { useState, useEffect } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import * as api from '../../lib/api';

interface Props {
  documentoId: string;
  onClose: () => void;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64ToBlobUrl(base64: string, mime: string): string {
  const bytes = base64ToBytes(base64);
  return URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: mime }));
}

export function DocumentoViewer({ documentoId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nome, setNome] = useState('');
  const [tipoMime, setTipoMime] = useState('');
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.downloadDocumento(documentoId);
        if (cancelled) return;

        setNome(data.nome);
        setTipoMime(data.tipoMime);

        if (data.tipoMime === 'application/pdf' || data.tipoMime.startsWith('image/')) {
          setContent(base64ToBlobUrl(data.conteudo, data.tipoMime));
        } else if (
          data.tipoMime ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({
            arrayBuffer: base64ToBytes(data.conteudo).buffer as ArrayBuffer,
          });
          setContent(result.value);
        } else {
          // text/plain, text/html, text/csv, etc.
          setContent(atob(data.conteudo));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar documento.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [documentoId]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (content.startsWith('blob:')) {
        URL.revokeObjectURL(content);
      }
    };
  }, [content]);

  function handleDownload() {
    if (!content) return;

    let url: string;
    if (content.startsWith('blob:')) {
      url = content;
    } else {
      // For text/html content from DOCX or plain text
      const blob = new Blob([content], { type: tipoMime || 'text/plain' });
      url = URL.createObjectURL(blob);
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (!content.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-lg border border-[var(--color-border)] w-full max-w-5xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-base-causa font-semibold text-[var(--color-text)] truncate">
              {nome || 'Carregando...'}
            </h2>
            {tipoMime && (
              <span className="text-xs-causa text-[var(--color-text-muted)] bg-causa-surface-alt px-2 py-0.5 rounded-[var(--radius-sm)] shrink-0">
                {tipoMime.split('/').pop()?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!loading && !error && (
              <Button variant="ghost" compact onClick={handleDownload}>
                <Download size={14} className="mr-1" />
                Baixar
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[var(--radius-sm)] hover:bg-causa-surface-alt transition-causa cursor-pointer text-[var(--color-text-muted)]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-full gap-2 text-[var(--color-text-muted)]">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm-causa">Carregando documento...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm-causa text-causa-danger bg-causa-danger/8 rounded-[var(--radius-md)] px-4 py-3 border border-causa-danger/20">
                {error}
              </div>
            </div>
          )}

          {!loading && !error && tipoMime === 'application/pdf' && (
            <iframe src={content} className="w-full h-full border-0" title={nome} />
          )}

          {!loading && !error && tipoMime.startsWith('image/') && (
            <div className="flex items-center justify-center h-full p-4 bg-causa-surface-alt">
              <img
                src={content}
                alt={nome}
                className="max-w-full max-h-full object-contain rounded-[var(--radius-md)]"
              />
            </div>
          )}

          {!loading &&
            !error &&
            tipoMime ===
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && (
              <div
                className="p-8 max-w-3xl mx-auto prose prose-sm text-[var(--color-text)]"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}

          {!loading && !error && (tipoMime === 'text/plain' || tipoMime === 'text/csv') && (
            <pre className="p-6 text-sm-causa text-[var(--color-text)] font-[var(--font-mono)] whitespace-pre-wrap break-words">
              {content}
            </pre>
          )}

          {!loading && !error && tipoMime === 'text/html' && (
            <div
              className="p-6 max-w-3xl mx-auto text-[var(--color-text)]"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
