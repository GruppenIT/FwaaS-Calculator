import { useState, useEffect, useCallback } from 'react';
import { FileText, FolderOpen, RefreshCw, Loader2, Search, Tag as TagIcon, ExternalLink } from 'lucide-react';
import { EmptyState } from '../../components/ui/empty-state';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { usePermission } from '../../hooks/use-permission';
import { useFeatures } from '../../lib/auth-context';
import * as api from '../../lib/api';
import type { UnclassifiedFolder, ClienteData, ProcessoListRow } from '../../lib/api';

interface ClassifyTarget {
  driveFileId: string;
  fileName: string;
  sourceParentId: string;
}

type ClassifyStep = 'vinculo' | 'cliente' | 'processo' | 'confirmar';

export function DocumentosPage() {
  const [folders, setFolders] = useState<UnclassifiedFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { can } = usePermission();
  const features = useFeatures();
  const canUpload = can('documentos:upload');
  const driveEnabled = features.googleDrive;

  // Classification flow state
  const [classifyTarget, setClassifyTarget] = useState<ClassifyTarget | null>(null);
  const [classifyStep, setClassifyStep] = useState<ClassifyStep>('vinculo');
  const [vinculoType, setVinculoType] = useState<'cliente' | 'processo'>('cliente');
  const [clientes, setClientes] = useState<ClienteData[]>([]);
  const [processos, setProcessos] = useState<ProcessoListRow[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedProcessoId, setSelectedProcessoId] = useState('');
  const [keepOriginal, setKeepOriginal] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [processoSearch, setProcessoSearch] = useState('');

  const load = useCallback(async () => {
    if (!driveEnabled) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.listarDocumentosNaoClassificados();
      setFolders(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar documentos não classificados.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driveEnabled, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function handleRefresh() {
    setRefreshing(true);
    load();
  }

  function startClassify(file: { id: string; name: string }, compartilhadoId: string) {
    setClassifyTarget({ driveFileId: file.id, fileName: file.name, sourceParentId: compartilhadoId });
    setClassifyStep('vinculo');
    setVinculoType('cliente');
    setSelectedClienteId('');
    setSelectedProcessoId('');
    setKeepOriginal(false);
    setClienteSearch('');
    setProcessoSearch('');
  }

  function cancelClassify() {
    setClassifyTarget(null);
  }

  async function handleStepVinculo() {
    // Load clientes
    try {
      const c = await api.listarClientes();
      setClientes(c);
    } catch {
      toast('Erro ao carregar clientes.', 'error');
      return;
    }
    setClassifyStep('cliente');
  }

  async function handleStepCliente() {
    if (!selectedClienteId) {
      toast('Selecione um cliente.', 'error');
      return;
    }
    if (vinculoType === 'cliente') {
      setClassifyStep('confirmar');
    } else {
      // Load processos for selected client
      try {
        const allProcessos = await api.listarProcessos();
        const cliente = clientes.find((c) => c.id === selectedClienteId);
        const filtered = allProcessos.filter((p) => p.clienteNome === cliente?.nome);
        setProcessos(filtered);
      } catch {
        toast('Erro ao carregar processos.', 'error');
        return;
      }
      setClassifyStep('processo');
    }
  }

  function handleStepProcesso() {
    if (!selectedProcessoId) {
      toast('Selecione um processo.', 'error');
      return;
    }
    setClassifyStep('confirmar');
  }

  async function handleConfirmClassify() {
    if (!classifyTarget) return;
    setClassifying(true);
    try {
      await api.classificarDocumentoDrive({
        driveFileId: classifyTarget.driveFileId,
        sourceParentId: classifyTarget.sourceParentId,
        clienteId: selectedClienteId,
        processoId: vinculoType === 'processo' ? selectedProcessoId : undefined,
        keepOriginal,
      });
      toast('Documento classificado com sucesso.', 'success');
      setClassifyTarget(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao classificar documento.', 'error');
    } finally {
      setClassifying(false);
    }
  }

  const totalFiles = folders.reduce((sum, f) => sum + f.files.length, 0);

  if (!driveEnabled) {
    return (
      <div>
        <PageHeader
          title="Documentos não Classificados"
          description="Documentos nas pastas Compartilhado aguardando classificação"
        />
        <EmptyState icon={FileText} message="Integração com Google Drive não está habilitada. Ative nas Configurações." />
      </div>
    );
  }

  // Classification modal
  const classifyModal = classifyTarget && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Classificar Documento</h2>
          <button
            type="button"
            onClick={cancelClassify}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer text-xl"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="text-sm-causa text-[var(--color-text-muted)]">
            Arquivo: <span className="font-medium text-[var(--color-text)]">{classifyTarget.fileName}</span>
          </div>

          {classifyStep === 'vinculo' && (
            <div className="space-y-3">
              <p className="text-sm-causa text-[var(--color-text)]">O documento será vinculado a:</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setVinculoType('cliente')}
                  className={`flex-1 px-4 py-3 rounded-[var(--radius-md)] border text-sm-causa font-medium transition-causa cursor-pointer ${
                    vinculoType === 'cliente'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-causa-bg'
                  }`}
                >
                  Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setVinculoType('processo')}
                  className={`flex-1 px-4 py-3 rounded-[var(--radius-md)] border text-sm-causa font-medium transition-causa cursor-pointer ${
                    vinculoType === 'processo'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-causa-bg'
                  }`}
                >
                  Processo
                </button>
              </div>
            </div>
          )}

          {classifyStep === 'cliente' && (
            <div className="space-y-3">
              <p className="text-sm-causa text-[var(--color-text)]">Selecione o cliente:</p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={clienteSearch}
                  onChange={(e) => setClienteSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full pl-8 pr-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-sm-causa text-[var(--color-text)]"
                />
              </div>
              <div className="max-h-48 overflow-auto border border-[var(--color-border)] rounded-[var(--radius-md)]">
                {clientes
                  .filter((c) => !clienteSearch || c.nome.toLowerCase().includes(clienteSearch.toLowerCase()))
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedClienteId(c.id)}
                      className={`w-full text-left px-3 py-2 text-sm-causa transition-causa cursor-pointer border-b border-[var(--color-border)] last:border-0 ${
                        selectedClienteId === c.id
                          ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-medium'
                          : 'text-[var(--color-text)] hover:bg-causa-bg'
                      }`}
                    >
                      <div>{c.nome}</div>
                      {c.cpfCnpj && (
                        <div className="text-xs-causa text-[var(--color-text-muted)]">{c.cpfCnpj}</div>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {classifyStep === 'processo' && (
            <div className="space-y-3">
              <p className="text-sm-causa text-[var(--color-text)]">Selecione o processo:</p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={processoSearch}
                  onChange={(e) => setProcessoSearch(e.target.value)}
                  placeholder="Buscar processo..."
                  className="w-full pl-8 pr-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-sm-causa text-[var(--color-text)]"
                />
              </div>
              <div className="max-h-48 overflow-auto border border-[var(--color-border)] rounded-[var(--radius-md)]">
                {processos.length === 0 ? (
                  <p className="text-sm-causa text-[var(--color-text-muted)] py-4 text-center">
                    Nenhum processo encontrado para este cliente.
                  </p>
                ) : (
                  processos
                    .filter((p) => !processoSearch || p.numeroCnj.includes(processoSearch))
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProcessoId(p.id)}
                        className={`w-full text-left px-3 py-2 text-sm-causa transition-causa cursor-pointer border-b border-[var(--color-border)] last:border-0 ${
                          selectedProcessoId === p.id
                            ? 'bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-medium'
                            : 'text-[var(--color-text)] hover:bg-causa-bg'
                        }`}
                      >
                        <div className="font-[var(--font-mono)]">{p.numeroCnj}</div>
                        <div className="text-xs-causa text-[var(--color-text-muted)]">
                          {p.area} &middot; {p.status}
                        </div>
                      </button>
                    ))
                )}
              </div>
            </div>
          )}

          {classifyStep === 'confirmar' && (
            <div className="space-y-3">
              <p className="text-sm-causa text-[var(--color-text)]">
                Confirme a classificação:
              </p>
              <div className="bg-causa-bg rounded-[var(--radius-md)] p-3 text-sm-causa space-y-1">
                <div>
                  <span className="text-[var(--color-text-muted)]">Vínculo:</span>{' '}
                  <span className="text-[var(--color-text)] font-medium">
                    {vinculoType === 'cliente' ? 'Cliente' : 'Processo'}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">Cliente:</span>{' '}
                  <span className="text-[var(--color-text)] font-medium">
                    {clientes.find((c) => c.id === selectedClienteId)?.nome}
                  </span>
                </div>
                {vinculoType === 'processo' && selectedProcessoId && (
                  <div>
                    <span className="text-[var(--color-text-muted)]">Processo:</span>{' '}
                    <span className="text-[var(--color-text)] font-medium font-[var(--font-mono)]">
                      {processos.find((p) => p.id === selectedProcessoId)?.numeroCnj}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setKeepOriginal(false)}
                  className={`flex-1 px-3 py-2 rounded-[var(--radius-md)] border text-sm-causa font-medium transition-causa cursor-pointer ${
                    !keepOriginal
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-causa-bg'
                  }`}
                >
                  Mover arquivo
                </button>
                <button
                  type="button"
                  onClick={() => setKeepOriginal(true)}
                  className={`flex-1 px-3 py-2 rounded-[var(--radius-md)] border text-sm-causa font-medium transition-causa cursor-pointer ${
                    keepOriginal
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-causa-bg'
                  }`}
                >
                  Manter na origem
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between px-6 py-4 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={cancelClassify}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            {classifyStep !== 'vinculo' && classifyStep !== 'confirmar' && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (classifyStep === 'cliente') setClassifyStep('vinculo');
                  if (classifyStep === 'processo') setClassifyStep('cliente');
                }}
              >
                Voltar
              </Button>
            )}
            {classifyStep === 'confirmar' ? (
              <Button
                variant="ghost"
                onClick={() => {
                  if (vinculoType === 'processo') setClassifyStep('processo');
                  else setClassifyStep('cliente');
                }}
              >
                Voltar
              </Button>
            ) : null}
            {classifyStep === 'vinculo' && (
              <Button onClick={handleStepVinculo}>Avançar</Button>
            )}
            {classifyStep === 'cliente' && (
              <Button onClick={handleStepCliente} disabled={!selectedClienteId}>
                Avançar
              </Button>
            )}
            {classifyStep === 'processo' && (
              <Button onClick={handleStepProcesso} disabled={!selectedProcessoId}>
                Avançar
              </Button>
            )}
            {classifyStep === 'confirmar' && (
              <Button onClick={handleConfirmClassify} disabled={classifying}>
                {classifying ? 'Classificando...' : 'Classificar'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Documentos não Classificados"
        description="Documentos nas pastas Compartilhado do Google Drive aguardando classificação"
        action={
          <Button variant="ghost" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 size={16} className="animate-spin mr-1" />
            ) : (
              <RefreshCw size={16} className="mr-1" />
            )}
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-causa-surface-alt rounded-[var(--radius-md)] animate-pulse" />
          ))}
        </div>
      ) : totalFiles === 0 ? (
        <EmptyState
          icon={FolderOpen}
          message="Nenhum documento não classificado encontrado nas pastas Compartilhado"
        />
      ) : (
        <div className="space-y-4">
          {folders.map((folder) => (
            <div
              key={folder.compartilhadoId}
              className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
                <FolderOpen size={16} className="text-[var(--color-text-muted)]" />
                <span className="text-sm-causa font-semibold text-[var(--color-text)]">
                  {folder.clienteFolderName}
                </span>
                <span className="text-xs-causa text-[var(--color-text-muted)]">/ Compartilhado</span>
                <span className="text-xs-causa text-[var(--color-text-muted)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded-full ml-1">
                  {folder.files.length}
                </span>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {folder.files.map((file) => (
                  <div key={file.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-[var(--color-primary)] shrink-0" />
                      <span className="text-sm-causa text-[var(--color-text)] font-medium truncate">
                        {file.name}
                      </span>
                      <span className="text-xs-causa text-[var(--color-text-muted)] shrink-0">
                        {file.mimeType.split('/').pop()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-causa"
                          title="Abrir no Drive"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {canUpload && (
                        <button
                          type="button"
                          onClick={() => startClassify(file, folder.compartilhadoId)}
                          className="px-2.5 py-1 rounded-[var(--radius-sm)] text-xs-causa font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-causa cursor-pointer"
                        >
                          Classificar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {classifyModal}
    </div>
  );
}
