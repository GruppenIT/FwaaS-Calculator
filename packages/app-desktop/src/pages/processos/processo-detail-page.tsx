import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'motion/react';
import {
  Clock,
  FileText,
  DollarSign,
  Pencil,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  MapPin,
  Scale,
  Shield,
  Tag,
  Download,
  Eye,
  Cloud,
  CloudOff,
  Loader2,
  CheckSquare,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { diasRestantes } from '../prazos/prazo-countdown';
import { useToast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { ProcessoModal } from './processo-modal';
import type { ProcessoEditData } from './processo-modal';
import { DocumentoModal } from '../documentos/documento-modal';
import { DocumentoEditModal } from '../documentos/documento-edit-modal';
import { DocumentoViewer } from '../documentos/documento-viewer';
import { usePermission } from '../../hooks/use-permission';
import * as api from '../../lib/api';
import type { PrazoRow, HonorarioRow, MovimentacaoRow, DocumentoRow, TarefaRow } from '../../lib/api';
import { useFeatures } from '../../lib/auth-context';

const PREVIEWABLE_MIMES = new Set([
  'application/pdf',
  'text/plain',
  'text/html',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function isPreviewable(tipoMime: string): boolean {
  return PREVIEWABLE_MIMES.has(tipoMime) || tipoMime.startsWith('image/');
}

const STATUS_STYLES: Record<string, string> = {
  ativo: 'bg-causa-success/10 text-causa-success',
  arquivado: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
  encerrado: 'bg-causa-warning/10 text-causa-warning',
  suspenso: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  baixado: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
};

const PRAZO_STATUS_STYLES: Record<string, string> = {
  pendente: 'bg-causa-warning/10 text-causa-warning',
  cumprido: 'bg-causa-success/10 text-causa-success',
  perdido: 'bg-causa-danger/10 text-causa-danger',
};

const HONORARIO_STATUS_STYLES: Record<string, string> = {
  pendente: 'bg-causa-warning/10 text-causa-warning',
  recebido: 'bg-causa-success/10 text-causa-success',
  inadimplente: 'bg-causa-danger/10 text-causa-danger',
};

const TAREFA_STATUS_STYLES: Record<string, string> = {
  pendente: 'bg-causa-warning/10 text-causa-warning',
  em_andamento: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  concluida: 'bg-causa-success/10 text-causa-success',
  cancelada: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
};

const TAREFA_PRIORIDADE_STYLES: Record<string, string> = {
  baixa: 'text-[var(--color-text-muted)]',
  normal: 'text-[var(--color-text-muted)]',
  alta: 'text-causa-warning',
  urgente: 'text-causa-danger',
};

const PRIORIDADE_LABELS: Record<string, string> = {
  normal: 'Normal',
  idoso: 'Idoso',
  deficiente: 'Deficiente',
  grave_enfermidade: 'Grave Enfermidade',
  reu_preso: 'Réu Preso',
};

const AREA_LABELS: Record<string, string> = {
  civel: 'Cível',
  trabalhista: 'Trabalhista',
  previdenciario: 'Previdenciário',
  criminal: 'Criminal',
  tributario: 'Tributário',
  familia: 'Família',
  consumidor: 'Consumidor',
  ambiental: 'Ambiental',
  administrativo: 'Administrativo',
  outro: 'Outro',
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface TabDef {
  key: string;
  label: string;
  count?: number;
}

export function ProcessoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { can } = usePermission();
  const navigate = useNavigate();
  const { financeiro: financeiroEnabled, googleDrive: driveEnabled } = useFeatures();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const activeTab = searchParams.get('tab') ?? 'dados-gerais';

  function handleTabChange(tabKey: string) {
    setSearchParams({ tab: tabKey });
  }

  const [processo, setProcesso] = useState<api.ProcessoDetail | null>(null);
  const [clienteNome, setClienteNome] = useState<string>('');
  const [prazos, setPrazos] = useState<PrazoRow[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRow[]>([]);
  const [honorarios, setHonorarios] = useState<HonorarioRow[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoRow[]>([]);
  const [tarefas, setTarefas] = useState<TarefaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<ProcessoEditData | null | undefined>(undefined);
  const [deleteMovId, setDeleteMovId] = useState<string | null>(null);
  const [deletingMov, setDeletingMov] = useState(false);
  const [viewDocId, setViewDocId] = useState<string | null>(null);
  const [syncingDocId, setSyncingDocId] = useState<string | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<DocumentoRow | null>(null);
  const canUpload = can('documentos:upload');

  // Esc returns to list when no modal/dialog is open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      const active = document.activeElement;
      const isInput =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement;
      if (isInput) return;
      // Skip if any modal/dialog is open
      if (editData !== undefined || deleteMovId || docModalOpen || viewDocId) return;
      navigate('/app/processos', { state: { selectedId: id } });
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, editData, deleteMovId, docModalOpen, viewDocId]);

  const carregar = useCallback(async () => {
    if (!id) return;
    try {
      const [proc, movs, prazosData, honData, docsData, tarefasData] = await Promise.all([
        api.obterProcesso(id),
        api.listarMovimentacoes(id),
        api.listarPrazosDoProcesso(id),
        financeiroEnabled ? api.listarHonorariosDoProcesso(id) : Promise.resolve([]),
        api.listarDocumentos({ processoId: id }),
        api.listarTarefas({ processoId: id }),
      ]);
      setProcesso(proc);
      setMovimentacoes(movs);
      setPrazos(prazosData);
      setHonorarios(honData);
      setDocumentos(docsData);
      setTarefas(tarefasData);

      if (proc.clienteId) {
        try {
          const c = await api.obterCliente(proc.clienteId);
          setClienteNome(c.nome);
        } catch {
          setClienteNome('—');
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar processo.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function handleEdit() {
    if (!processo) return;
    setEditData({
      id: processo.id,
      numeroCnj: processo.numeroCnj,
      numeroAntigo: processo.numeroAntigo,
      clienteId: processo.clienteId ?? '',
      clienteNome: clienteNome || null,
      clienteQualidade: processo.clienteQualidade,
      tribunalSigla: processo.tribunalSigla,
      plataforma: processo.plataforma,
      area: processo.area,
      fase: processo.fase,
      status: processo.status,
      grau: processo.grau,
      comarca: processo.comarca,
      vara: processo.vara,
      juiz: processo.juiz,
      rito: processo.rito,
      prioridade: processo.prioridade,
      segredoJustica: processo.segredoJustica,
      justicaGratuita: processo.justicaGratuita,
      valorCausa: processo.valorCausa,
      observacoes: processo.observacoes,
    });
  }

  function handleSaved() {
    setEditData(undefined);
    toast('Processo atualizado.', 'success');
    carregar();
  }

  async function handleDeleteMov() {
    if (!deleteMovId) return;
    setDeletingMov(true);
    try {
      await api.excluirMovimentacao(deleteMovId);
      toast('Movimentação excluída.', 'success');
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao excluir movimentação.', 'error');
    } finally {
      setDeletingMov(false);
      setDeleteMovId(null);
    }
  }

  function handleDocModalSave() {
    setDocModalOpen(false);
    toast('Documento enviado com sucesso.', 'success');
    carregar();
  }

  async function handleDownloadDoc(docId: string) {
    try {
      const data = await api.downloadDocumento(docId);
      const byteChars = atob(data.conteudo);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: data.tipoMime });
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

  async function handleSyncDoc(docId: string) {
    setSyncingDocId(docId);
    try {
      await api.syncDocumentoDrive(docId);
      toast('Documento sincronizado com o Drive.', 'success');
      carregar();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao sincronizar.', 'error');
    } finally {
      setSyncingDocId(null);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-causa-surface-alt rounded w-1/3"></div>
        <div className="h-40 bg-causa-surface-alt rounded"></div>
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)]">
        Processo não encontrado.
      </div>
    );
  }

  const allTabs: TabDef[] = [
    { key: 'dados-gerais', label: 'Dados Gerais' },
    { key: 'prazos', label: 'Prazos', count: prazos.length },
    { key: 'movimentacoes', label: 'Movimentações', count: movimentacoes.length },
    { key: 'documentos', label: 'Documentos', count: documentos.length },
    ...(financeiroEnabled
      ? [{ key: 'financeiro', label: 'Financeiro', count: honorarios.length }]
      : []),
    { key: 'tarefas', label: 'Tarefas', count: tarefas.length },
  ];

  const animTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.1, ease: 'easeOut' as const };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={processo.numeroCnj}
        breadcrumb={[{ label: 'Processos', to: '/app/processos' }, { label: processo.numeroCnj }]}
        action={
          can('processos:editar') ? (
            <Button variant="secondary" onClick={handleEdit}>
              <Pencil size={14} />
              Editar
            </Button>
          ) : undefined
        }
      />

      {/* Status badges */}
      <div className="flex items-center gap-3 -mt-4 flex-wrap">
        <span
          className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium capitalize ${STATUS_STYLES[processo.status] ?? ''}`}
        >
          {processo.status}
        </span>
        <span className="text-sm-causa text-[var(--color-text-muted)]">
          {AREA_LABELS[processo.area] ?? processo.area} &middot; {processo.fase} &middot;{' '}
          {processo.tribunalSigla}
        </span>
        {processo.prioridade !== 'normal' && (
          <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium bg-causa-danger/10 text-causa-danger">
            {PRIORIDADE_LABELS[processo.prioridade] ?? processo.prioridade}
          </span>
        )}
        {processo.segredoJustica && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium bg-causa-warning/10 text-causa-warning">
            <Shield size={10} /> Segredo
          </span>
        )}
        {processo.justicaGratuita && (
          <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            Justiça Gratuita
          </span>
        )}
      </div>

      {/* Tab Bar */}
      <nav
        role="tablist"
        aria-label="Seções do processo"
        className="flex items-center gap-0 border-b border-[var(--color-border)] -mb-2"
      >
        {allTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              id={`tab-${tab.key}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.key}`}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={[
                'relative px-4 py-2.5 text-sm-causa font-medium transition-causa focus-causa',
                'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:transition-causa',
                isActive
                  ? 'text-[var(--color-primary)] after:bg-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] after:bg-transparent',
              ].join(' ')}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={[
                    'ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium',
                    isActive
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'bg-causa-surface-alt text-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Tab Panels — all in DOM for print compatibility (DET-03 contract) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={animTransition}
        >
          {allTabs.map((tab) => (
            <div
              key={tab.key}
              role="tabpanel"
              id={`panel-${tab.key}`}
              aria-labelledby={`tab-${tab.key}`}
              data-print-section
              className={activeTab !== tab.key ? 'hidden' : ''}
            >
              {tab.key === 'dados-gerais' && (
                <div className="space-y-6">
                  {/* Info Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <InfoCard label="Cliente">
                      {processo.clienteId ? (
                        <Link
                          to={`/app/clientes/${processo.clienteId}`}
                          className="text-[var(--color-primary)] hover:underline"
                        >
                          {clienteNome || '...'}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </InfoCard>
                    <InfoCard label="Plataforma">{processo.plataforma.toUpperCase()}</InfoCard>
                    <InfoCard label="Valor da causa">
                      {processo.valorCausa ? formatCurrency(processo.valorCausa) : '—'}
                    </InfoCard>
                    <InfoCard label="Cadastrado em">{formatDate(processo.createdAt)}</InfoCard>
                  </div>

                  {/* Extra Info */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {processo.grau && (
                      <InfoCard label="Grau">
                        <span className="flex items-center gap-1">
                          <Scale size={12} className="text-[var(--color-text-muted)]" />
                          {processo.grau === 'primeiro'
                            ? '1º Grau'
                            : processo.grau === 'segundo'
                              ? '2º Grau'
                              : processo.grau === 'superior'
                                ? 'Superior'
                                : 'STF'}
                        </span>
                      </InfoCard>
                    )}
                    {processo.comarca && (
                      <InfoCard label="Comarca">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-[var(--color-text-muted)]" />
                          {processo.comarca}
                        </span>
                      </InfoCard>
                    )}
                    {processo.vara && <InfoCard label="Vara">{processo.vara}</InfoCard>}
                    {processo.juiz && <InfoCard label="Juiz">{processo.juiz}</InfoCard>}
                    {processo.rito && <InfoCard label="Rito">{processo.rito}</InfoCard>}
                    {processo.dataDistribuicao && (
                      <InfoCard label="Distribuição">
                        {formatDate(processo.dataDistribuicao)}
                      </InfoCard>
                    )}
                    {processo.valorCondenacao != null && (
                      <InfoCard label="Valor Condenação">
                        {formatCurrency(processo.valorCondenacao)}
                      </InfoCard>
                    )}
                    {processo.advogadoContrario && (
                      <InfoCard label="Advogado Contrário">
                        {processo.advogadoContrario}
                        {processo.oabContrario && (
                          <span className="text-xs-causa text-[var(--color-text-muted)] ml-1">
                            OAB {processo.oabContrario}
                          </span>
                        )}
                      </InfoCard>
                    )}
                  </div>

                  {/* Tags */}
                  {processo.tags && processo.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag size={14} className="text-[var(--color-text-muted)]" />
                      {processo.tags.map((t, i) => (
                        <span
                          key={i}
                          className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium bg-causa-surface-alt text-[var(--color-text-muted)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Observações */}
                  {processo.observacoes && (
                    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
                      <div className="text-xs-causa text-[var(--color-text-muted)] mb-1">
                        Observações
                      </div>
                      <div className="text-sm-causa text-[var(--color-text)] whitespace-pre-wrap">
                        {processo.observacoes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab.key === 'prazos' && (
                <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
                    <Clock size={16} className="text-[var(--color-text-muted)]" />
                    <span className="text-sm-causa font-semibold text-[var(--color-text)]">
                      Prazos
                    </span>
                  </div>
                  {prazos.length === 0 ? (
                    <p className="text-sm-causa text-[var(--color-text-muted)] py-8 text-center">
                      Nenhum prazo vinculado.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                      {prazos.map((p) => {
                        const dias = diasRestantes(p.dataFatal);
                        const urgente = p.status === 'pendente' && dias <= 3;
                        return (
                          <div
                            key={p.id}
                            className={`px-4 py-3 ${urgente ? 'bg-causa-danger/5' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {urgente && (
                                  <AlertTriangle size={12} className="text-causa-danger" />
                                )}
                                {p.fatal && (
                                  <span className="text-[10px] font-bold text-causa-danger bg-causa-danger/10 px-1 rounded">
                                    FATAL
                                  </span>
                                )}
                                <span className="text-sm-causa text-[var(--color-text)] font-medium">
                                  {p.descricao}
                                </span>
                              </div>
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium ${PRAZO_STATUS_STYLES[p.status] ?? ''}`}
                              >
                                {p.status}
                              </span>
                            </div>
                            <div className="text-xs-causa text-[var(--color-text-muted)] mt-1">
                              {formatDate(p.dataFatal)}
                              {p.status === 'pendente' && (
                                <span
                                  className={`ml-2 ${dias <= 1 ? 'text-causa-danger' : dias <= 3 ? 'text-causa-warning' : ''}`}
                                >
                                  {dias < 0
                                    ? `${Math.abs(dias)}d atrasado`
                                    : dias === 0
                                      ? 'Vence hoje'
                                      : `${dias}d restantes`}
                                </span>
                              )}
                              {p.categoriaPrazo && (
                                <span className="ml-2 text-[var(--color-text-muted)]">
                                  &middot; {p.categoriaPrazo}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab.key === 'movimentacoes' && (
                <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
                    <FileText size={16} className="text-[var(--color-text-muted)]" />
                    <span className="text-sm-causa font-semibold text-[var(--color-text)]">
                      Movimentações
                    </span>
                  </div>
                  {movimentacoes.length === 0 ? (
                    <p className="text-sm-causa text-[var(--color-text-muted)] py-8 text-center">
                      Nenhuma movimentação registrada.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                      {movimentacoes.map((m) => (
                        <div
                          key={m.id}
                          className={`px-4 py-3 ${m.urgente ? 'border-l-2 border-l-causa-danger' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {m.urgente && (
                                <AlertTriangle size={12} className="text-causa-danger shrink-0" />
                              )}
                              <span className="text-sm-causa text-[var(--color-text)] font-medium">
                                {m.descricao}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs-causa text-[var(--color-text-muted)] font-[var(--font-mono)]">
                                {formatDate(m.dataMovimento)}
                              </span>
                              {m.linkExterno && (
                                <a
                                  href={m.linkExterno}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-causa"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                              {can('processos:editar') && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteMovId(m.id)}
                                  className="p-1 rounded-[var(--radius-sm)] hover:bg-causa-danger/10 text-[var(--color-text-muted)] hover:text-causa-danger transition-causa cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] bg-causa-surface-alt text-xs-causa text-[var(--color-text-muted)]">
                              {m.tipo}
                            </span>
                            <span className="text-xs-causa text-[var(--color-text-muted)]">
                              {m.origem}
                            </span>
                            {!m.lido && (
                              <span className="inline-flex px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-medium">
                                Novo
                              </span>
                            )}
                          </div>
                          {m.teor && (
                            <p className="text-xs-causa text-[var(--color-text-muted)] mt-1 line-clamp-2">
                              {m.teor}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab.key === 'documentos' && (
                <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
                    <FileText size={16} className="text-[var(--color-text-muted)]" />
                    <span className="text-sm-causa font-semibold text-[var(--color-text)]">
                      Documentos
                    </span>
                    {canUpload && (
                      <div className="flex-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setDocModalOpen(true)}
                          className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] text-xs-causa font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-causa cursor-pointer"
                        >
                          <Plus size={14} />
                          Novo
                        </button>
                      </div>
                    )}
                  </div>
                  {documentos.length === 0 ? (
                    <p className="text-sm-causa text-[var(--color-text-muted)] py-8 text-center">
                      Nenhum documento vinculado.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                      {documentos.map((d) => (
                        <div key={d.id} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText
                              size={14}
                              className="text-[var(--color-primary)] shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-sm-causa text-[var(--color-text)] font-medium truncate block">
                                {d.nome}
                              </span>
                              {d.descricao && (
                                <span className="text-xs-causa text-[var(--color-text-muted)] truncate block">
                                  {d.descricao}
                                </span>
                              )}
                            </div>
                            {d.categoria && (
                              <span className="text-xs-causa text-[var(--color-text-muted)] shrink-0">
                                {d.categoria}
                              </span>
                            )}
                            {d.confidencial && (
                              <span className="text-xs-causa text-causa-danger font-medium shrink-0">
                                Confidencial
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs-causa text-[var(--color-text-muted)] mr-2">
                              {formatDate(d.createdAt)}
                            </span>
                            {driveEnabled &&
                              (d.driveFileId ? (
                                <span
                                  className="p-1.5 text-causa-success"
                                  title={`Sincronizado em ${d.driveSyncedAt ? new Date(d.driveSyncedAt).toLocaleString('pt-BR') : ''}`}
                                >
                                  <Cloud size={14} />
                                </span>
                              ) : syncingDocId === d.id ? (
                                <span className="p-1.5 text-[var(--color-primary)]">
                                  <Loader2 size={14} className="animate-spin" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSyncDoc(d.id)}
                                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-causa cursor-pointer"
                                  title="Enviar ao Google Drive"
                                >
                                  <CloudOff size={14} />
                                </button>
                              ))}
                            {canUpload && (
                              <button
                                type="button"
                                onClick={() => setEditDoc(d)}
                                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-causa cursor-pointer"
                                title="Editar metadados"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {isPreviewable(d.tipoMime) && (
                              <button
                                type="button"
                                onClick={() => setViewDocId(d.id)}
                                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-causa cursor-pointer"
                                title="Visualizar"
                              >
                                <Eye size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDownloadDoc(d.id)}
                              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-causa cursor-pointer"
                              title="Baixar"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab.key === 'financeiro' && financeiroEnabled && (
                <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
                    <DollarSign size={16} className="text-[var(--color-text-muted)]" />
                    <span className="text-sm-causa font-semibold text-[var(--color-text)]">
                      Financeiro
                    </span>
                  </div>
                  {honorarios.length === 0 ? (
                    <p className="text-sm-causa text-[var(--color-text-muted)] py-8 text-center">
                      Nenhum honorário vinculado.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                      {honorarios.map((h) => (
                        <div
                          key={h.id}
                          className="px-4 py-3 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-sm-causa text-[var(--color-text)] font-medium font-[var(--font-mono)]">
                              {formatCurrency(h.valor)}
                            </span>
                            <span className="ml-2 text-xs-causa text-[var(--color-text-muted)]">
                              {h.tipo === 'fixo'
                                ? 'Fixo'
                                : h.tipo === 'exito'
                                  ? 'Êxito'
                                  : h.tipo === 'por_hora'
                                    ? 'Por hora'
                                    : h.tipo === 'sucumbencia'
                                      ? 'Sucumbência'
                                      : h.tipo}
                            </span>
                            {h.descricao && (
                              <span className="ml-2 text-xs-causa text-[var(--color-text-muted)]">
                                — {h.descricao}
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium ${HONORARIO_STATUS_STYLES[h.status] ?? ''}`}
                          >
                            {h.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab.key === 'tarefas' && (
                <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
                    <CheckSquare size={16} className="text-[var(--color-text-muted)]" />
                    <span className="text-sm-causa font-semibold text-[var(--color-text)]">
                      Tarefas
                    </span>
                  </div>
                  {tarefas.length === 0 ? (
                    <p className="text-sm-causa text-[var(--color-text-muted)] py-8 text-center">
                      Nenhuma tarefa vinculada.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                      {tarefas.map((t) => (
                        <div key={t.id} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm-causa font-medium ${t.status === 'concluida' ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}
                              >
                                {t.titulo}
                              </span>
                              {t.prioridade === 'alta' || t.prioridade === 'urgente' ? (
                                <span
                                  className={`text-xs-causa font-medium ${TAREFA_PRIORIDADE_STYLES[t.prioridade] ?? ''}`}
                                >
                                  {t.prioridade === 'urgente' ? 'Urgente' : 'Alta'}
                                </span>
                              ) : null}
                            </div>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium ${TAREFA_STATUS_STYLES[t.status] ?? ''}`}
                            >
                              {t.status === 'em_andamento'
                                ? 'Em andamento'
                                : t.status === 'concluida'
                                  ? 'Concluída'
                                  : t.status === 'cancelada'
                                    ? 'Cancelada'
                                    : 'Pendente'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {t.dataLimite && (
                              <span className="text-xs-causa text-[var(--color-text-muted)]">
                                Prazo: {formatDate(t.dataLimite)}
                              </span>
                            )}
                            {t.responsavelNome && (
                              <span className="text-xs-causa text-[var(--color-text-muted)]">
                                {t.responsavelNome}
                              </span>
                            )}
                            {t.categoria && (
                              <span className="text-xs-causa text-[var(--color-text-muted)]">
                                {t.categoria}
                              </span>
                            )}
                          </div>
                          {t.descricao && (
                            <p className="text-xs-causa text-[var(--color-text-muted)] mt-1 line-clamp-2">
                              {t.descricao}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <DocumentoModal
        open={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        onSave={handleDocModalSave}
        presetProcessoId={id}
        presetClienteId={processo.clienteId ?? undefined}
      />

      {editData !== undefined && (
        <ProcessoModal
          onClose={() => setEditData(undefined)}
          onSaved={handleSaved}
          editData={editData}
        />
      )}

      {viewDocId && <DocumentoViewer documentoId={viewDocId} onClose={() => setViewDocId(null)} />}

      {editDoc && (
        <DocumentoEditModal
          documento={editDoc}
          onClose={() => setEditDoc(null)}
          onSave={() => {
            setEditDoc(null);
            carregar();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteMovId}
        onClose={() => setDeleteMovId(null)}
        onConfirm={handleDeleteMov}
        title="Excluir movimentação"
        message="Tem certeza que deseja excluir esta movimentação?"
        confirmLabel="Excluir"
        loading={deletingMov}
      />
    </div>
  );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
      <div className="text-xs-causa text-[var(--color-text-muted)] mb-1">{label}</div>
      <div className="text-base-causa text-[var(--color-text)] font-medium">{children}</div>
    </div>
  );
}
