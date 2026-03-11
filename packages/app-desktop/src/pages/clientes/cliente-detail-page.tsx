import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Pencil, MapPin, Phone, Tag, FileText, Download, Eye, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { ClienteModal } from './cliente-modal';
import type { ClienteEditData } from './cliente-modal';
import { DocumentoViewer } from '../documentos/documento-viewer';
import { usePermission } from '../../hooks/use-permission';
import { useFeatures } from '../../lib/auth-context';
import type { ClienteData, EnderecoJson, DocumentoRow } from '../../lib/api';
import * as api from '../../lib/api';

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

interface ProcessoRow {
  id: string;
  numeroCnj: string;
  area: string;
  status: string;
  tribunalSigla: string;
}

const PROCESSO_STATUS_STYLES: Record<string, string> = {
  ativo: 'bg-causa-success/10 text-causa-success',
  arquivado: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
  encerrado: 'bg-causa-warning/10 text-causa-warning',
};

const CLIENTE_STATUS_STYLES: Record<string, string> = {
  prospecto: 'bg-causa-info/10 text-causa-info',
  ativo: 'bg-causa-success/10 text-causa-success',
  inativo: 'bg-causa-surface-alt text-[var(--color-text-muted)]',
  encerrado: 'bg-causa-warning/10 text-causa-warning',
};

const ESTADO_CIVIL_LABELS: Record<string, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
  uniao_estavel: 'União Estável',
  separado: 'Separado(a)',
};

const ORIGEM_LABELS: Record<string, string> = {
  indicacao: 'Indicação',
  site: 'Site',
  oab: 'OAB',
  redes_sociais: 'Redes Sociais',
  google: 'Google',
  outro: 'Outro',
};

const CONTATO_LABELS: Record<string, string> = {
  email: 'Email',
  telefone: 'Telefone',
  whatsapp: 'WhatsApp',
};

function formatEndereco(end: EnderecoJson | null): string | null {
  if (!end) return null;
  const parts = [
    end.logradouro,
    end.numero ? `nº ${end.numero}` : null,
    end.complemento,
    end.bairro,
    end.cidade && end.uf ? `${end.cidade}/${end.uf}` : end.cidade,
    end.cep ? `CEP ${end.cep}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

export function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { can } = usePermission();
  const { googleDrive: driveEnabled } = useFeatures();

  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [processos, setProcessos] = useState<ProcessoRow[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<ClienteEditData | null | undefined>(undefined);
  const [viewDocId, setViewDocId] = useState<string | null>(null);
  const [syncingDocId, setSyncingDocId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!id) return;
    try {
      const c = await api.obterCliente(id);
      setCliente(c);
      const [matchedProcessos, docs] = await Promise.all([
        api.listarProcessos(c.nome),
        api.listarDocumentos({ clienteId: id }),
      ]);
      const filtered = matchedProcessos.filter((p) => p.clienteNome === c.nome);
      setProcessos(filtered);
      setDocumentos(docs);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao carregar cliente.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

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

  function handleEdit() {
    if (!cliente) return;
    setEditData(cliente);
  }

  function handleSaved() {
    setEditData(undefined);
    toast('Cliente atualizado.', 'success');
    carregar();
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-causa-surface-alt rounded w-1/3"></div>
        <div className="h-40 bg-causa-surface-alt rounded"></div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)]">
        Cliente não encontrado.
      </div>
    );
  }

  const enderecoStr = formatEndereco(cliente.endereco);
  const enderecoComStr = formatEndereco(cliente.enderecoComercial);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/app/clientes')}
          className="p-1.5 rounded-[var(--radius-sm)] hover:bg-causa-surface-alt transition-causa cursor-pointer text-[var(--color-text-muted)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl-causa text-[var(--color-text)] font-semibold">{cliente.nome}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] bg-causa-surface-alt text-xs-causa font-medium text-[var(--color-text-muted)]">
              {cliente.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
            </span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium capitalize ${CLIENTE_STATUS_STYLES[cliente.statusCliente] ?? ''}`}
            >
              {cliente.statusCliente}
            </span>
          </div>
        </div>
        {can('clientes:editar') && (
          <Button variant="secondary" onClick={handleEdit}>
            <Pencil size={14} />
            Editar
          </Button>
        )}
      </div>

      {/* Dados Pessoais */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
        <h2 className="text-sm-causa font-semibold text-[var(--color-text)] mb-3">
          {cliente.tipo === 'PF' ? 'Dados Pessoais' : 'Dados Empresariais'}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoField label="CPF/CNPJ" value={cliente.cpfCnpj} />
          {cliente.nomeSocial && (
            <InfoField label="Nome Social / Fantasia" value={cliente.nomeSocial} />
          )}
          {cliente.tipo === 'PF' && (
            <>
              <InfoField
                label="RG"
                value={
                  cliente.rg
                    ? `${cliente.rg}${cliente.rgOrgaoEmissor ? ` - ${cliente.rgOrgaoEmissor}` : ''}`
                    : null
                }
              />
              <InfoField label="Data de Nascimento" value={cliente.dataNascimento} />
              <InfoField label="Nacionalidade" value={cliente.nacionalidade} />
              <InfoField
                label="Estado Civil"
                value={
                  cliente.estadoCivil
                    ? (ESTADO_CIVIL_LABELS[cliente.estadoCivil] ?? cliente.estadoCivil)
                    : null
                }
              />
            </>
          )}
          <InfoField label="Profissão" value={cliente.profissao} />
        </div>
      </div>

      {/* Contato */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Phone size={14} className="text-[var(--color-text-muted)]" />
          <h2 className="text-sm-causa font-semibold text-[var(--color-text)]">Contato</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoField label="Email" value={cliente.email} />
          <InfoField label="Email Secundário" value={cliente.emailSecundario} />
          <InfoField label="Telefone" value={cliente.telefone} />
          <InfoField label="Telefone Secundário" value={cliente.telefoneSecundario} />
          <InfoField label="WhatsApp" value={cliente.whatsapp} />
          <InfoField
            label="Contato Preferencial"
            value={
              cliente.contatoPreferencial
                ? (CONTATO_LABELS[cliente.contatoPreferencial] ?? cliente.contatoPreferencial)
                : null
            }
          />
        </div>
      </div>

      {/* Endereços */}
      {(enderecoStr || enderecoComStr) && (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} className="text-[var(--color-text-muted)]" />
            <h2 className="text-sm-causa font-semibold text-[var(--color-text)]">Endereços</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {enderecoStr && <InfoField label="Residencial" value={enderecoStr} />}
            {enderecoComStr && <InfoField label="Comercial" value={enderecoComStr} />}
          </div>
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag size={14} className="text-[var(--color-text-muted)]" />
          <h2 className="text-sm-causa font-semibold text-[var(--color-text)]">
            Informações Adicionais
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoField
            label="Origem de Captação"
            value={
              cliente.origemCaptacao
                ? (ORIGEM_LABELS[cliente.origemCaptacao] ?? cliente.origemCaptacao)
                : null
            }
          />
          <InfoField label="Indicado por" value={cliente.indicadoPor} />
          <InfoField label="Data do Contrato" value={cliente.dataContrato} />
          <InfoField
            label="Cadastrado em"
            value={new Date(cliente.createdAt).toLocaleDateString('pt-BR')}
          />
        </div>
        {cliente.tags && cliente.tags.length > 0 && (
          <div className="mt-3">
            <div className="text-xs-causa text-[var(--color-text-muted)] mb-1">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {cliente.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex px-2 py-0.5 rounded-full bg-causa-surface-alt text-xs-causa font-medium text-[var(--color-text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        {cliente.observacoes && (
          <div className="mt-3">
            <div className="text-xs-causa text-[var(--color-text-muted)] mb-1">Observações</div>
            <div className="text-sm-causa text-[var(--color-text)] whitespace-pre-wrap">
              {cliente.observacoes}
            </div>
          </div>
        )}
      </div>

      {/* Processos vinculados */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
          <Briefcase size={16} className="text-[var(--color-text-muted)]" />
          <span className="text-sm-causa font-semibold text-[var(--color-text)]">Processos</span>
          <span className="text-xs-causa text-[var(--color-text-muted)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded-full">
            {processos.length}
          </span>
        </div>
        {processos.length === 0 ? (
          <p className="text-sm-causa text-[var(--color-text-muted)] py-6 text-center">
            Nenhum processo vinculado a este cliente.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-4 py-2 text-xs-causa font-semibold text-[var(--color-text-muted)]">
                  Número CNJ
                </th>
                <th className="text-left px-4 py-2 text-xs-causa font-semibold text-[var(--color-text-muted)]">
                  Área
                </th>
                <th className="text-left px-4 py-2 text-xs-causa font-semibold text-[var(--color-text-muted)]">
                  Tribunal
                </th>
                <th className="text-left px-4 py-2 text-xs-causa font-semibold text-[var(--color-text-muted)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {processos.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-causa-surface-alt transition-causa"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/app/processos/${p.id}`}
                      className="text-base-causa text-[var(--color-primary)] hover:underline font-[var(--font-mono)] font-medium"
                    >
                      {p.numeroCnj}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)] capitalize">
                    {p.area}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] bg-causa-surface-alt text-xs-causa font-medium text-[var(--color-text-muted)]">
                      {p.tribunalSigla}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs-causa font-medium capitalize ${PROCESSO_STATUS_STYLES[p.status] ?? ''}`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Documentos vinculados */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-causa-surface-alt">
          <FileText size={16} className="text-[var(--color-text-muted)]" />
          <span className="text-sm-causa font-semibold text-[var(--color-text)]">Documentos</span>
          <span className="text-xs-causa text-[var(--color-text-muted)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded-full">
            {documentos.length}
          </span>
        </div>
        {documentos.length === 0 ? (
          <p className="text-sm-causa text-[var(--color-text-muted)] py-6 text-center">
            Nenhum documento vinculado a este cliente.
          </p>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {documentos.map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={14} className="text-[var(--color-primary)] shrink-0" />
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
                    <span className="text-xs-causa text-[var(--color-text-muted)] shrink-0 ml-1">
                      {d.categoria}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs-causa text-[var(--color-text-muted)] mr-2">
                    {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  {driveEnabled && (
                    d.driveFileId ? (
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
                    )
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

      {viewDocId && (
        <DocumentoViewer documentoId={viewDocId} onClose={() => setViewDocId(null)} />
      )}

      {editData !== undefined && (
        <ClienteModal
          onClose={() => setEditData(undefined)}
          onSaved={handleSaved}
          editData={editData}
        />
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs-causa text-[var(--color-text-muted)] mb-0.5">{label}</div>
      <div className="text-sm-causa text-[var(--color-text)] font-medium">{value ?? '—'}</div>
    </div>
  );
}
