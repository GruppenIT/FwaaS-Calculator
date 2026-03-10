import { useState, useEffect, useCallback } from 'react';
import { FileText, Trash2, Lock, Tag, Download, Plus } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { SkeletonTableRows } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { usePermission } from '../../hooks/use-permission';
import { DocumentoModal } from './documento-modal';
import * as api from '../../lib/api';
import type { DocumentoRow } from '../../lib/api';

const CATEGORIA_LABELS: Record<string, string> = {
  peticao: 'Petição',
  procuracao: 'Procuração',
  contrato: 'Contrato',
  substabelecimento: 'Substabelecimento',
  certidao: 'Certidão',
  laudo_pericial: 'Laudo Pericial',
  comprovante: 'Comprovante',
  sentenca: 'Sentença',
  acordao: 'Acórdão',
  ata_audiencia: 'Ata de Audiência',
  correspondencia: 'Correspondência',
  nota_fiscal: 'Nota Fiscal',
  outro: 'Outro',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function DocumentosPage() {
  const [documentos, setDocumentos] = useState<DocumentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoriaFilter, setCategoriaFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();
  const { can } = usePermission();

  const canUpload = can('documentos:upload');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const filtros: { categoria?: string } = {};
      if (categoriaFilter) filtros.categoria = categoriaFilter;
      const data = await api.listarDocumentos(filtros);
      setDocumentos(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar documentos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [categoriaFilter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.excluirDocumento(deleteId);
      toast('Documento excluído.', 'success');
      setDeleteId(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao excluir documento.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload(id: string) {
    try {
      const data = await api.downloadDocumento(id);
      const byteChars = atob(data.conteudo);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.tipoMime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.nome;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao baixar documento.', 'error');
    }
  }

  function handleModalSave() {
    setModalOpen(false);
    toast('Documento enviado com sucesso.', 'success');
    load();
  }

  const CATEGORIA_FILTERS = [
    { value: '', label: 'Todas' },
    { value: 'peticao', label: 'Petições' },
    { value: 'contrato', label: 'Contratos' },
    { value: 'procuracao', label: 'Procurações' },
    { value: 'certidao', label: 'Certidões' },
    { value: 'sentenca', label: 'Sentenças' },
    { value: 'comprovante', label: 'Comprovantes' },
  ];

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Gerenciamento de documentos do escritório"
        action={
          canUpload ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} className="mr-1" />
              Novo Documento
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {CATEGORIA_FILTERS.map((cf) => (
          <button
            key={cf.value}
            type="button"
            onClick={() => setCategoriaFilter(cf.value)}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm-causa font-medium transition-causa cursor-pointer ${
              categoriaFilter === cf.value
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-causa-bg'
            }`}
          >
            {cf.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm-causa">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-causa-bg">
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Nome
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Categoria
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Processo
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Tamanho
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Enviado por
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Data
              </th>
              <th className="text-right px-4 py-3 font-medium text-[var(--color-text-muted)]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRows cols={7} rows={5} />
            ) : documentos.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon={FileText} message="Nenhum documento encontrado" />
                </td>
              </tr>
            ) : (
              documentos.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-[var(--color-border)] hover:bg-causa-bg/50 transition-causa"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[var(--color-primary)] shrink-0" />
                      <div>
                        <div className="font-medium text-[var(--color-text)]">
                          {d.nome}
                          {d.confidencial && (
                            <Lock size={12} className="inline ml-1 text-causa-danger" />
                          )}
                        </div>
                        {d.descricao && (
                          <div className="text-xs text-[var(--color-text-muted)] truncate max-w-[200px]">
                            {d.descricao}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)]">
                    {d.categoria ? (CATEGORIA_LABELS[d.categoria] ?? d.categoria) : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)]">{d.numeroCnj ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-text)]">
                    {formatFileSize(d.tamanhoBytes)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)]">{d.uploaderNome ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-text)]">{formatDate(d.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {d.tags && d.tags.length > 0 && (
                        <span
                          className="p-1.5 text-[var(--color-text-muted)]"
                          title={d.tags.join(', ')}
                        >
                          <Tag size={14} />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownload(d.id)}
                        className="p-1.5 rounded-[var(--radius-md)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-causa cursor-pointer"
                        title="Baixar"
                      >
                        <Download size={16} />
                      </button>
                      {canUpload && (
                        <button
                          type="button"
                          onClick={() => setDeleteId(d.id)}
                          className="p-1.5 rounded-[var(--radius-md)] text-causa-danger hover:bg-causa-danger/10 transition-causa cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DocumentoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Documento"
        message="Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  );
}
