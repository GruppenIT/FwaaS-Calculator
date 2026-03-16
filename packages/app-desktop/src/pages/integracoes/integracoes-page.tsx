import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Circle,
  Cloud,
  MessageCircle,
  Github,
  Scale,
  Settings,
  Save,
  RefreshCw,
  Loader2,
  Unplug,
  Send,
  Bell,
  Construction,
  Info,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { usePermission } from '../../hooks/use-permission';
import { useAuth } from '../../lib/auth-context';
import { useUpdateStatus } from '../../hooks/use-update-status';
import * as api from '../../lib/api';

/* ------------------------------------------------------------------ */
/*  Collapsible Section (Getting Started pattern)                     */
/* ------------------------------------------------------------------ */

type IntegrationStatus = 'ok' | 'incomplete' | 'building';

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === 'ok') {
    return (
      <span className="flex items-center gap-1 text-xs-causa font-medium text-causa-success">
        <CheckCircle2 size={14} />
        Configurado
      </span>
    );
  }
  if (status === 'building') {
    return (
      <span className="flex items-center gap-1 text-xs-causa font-medium text-causa-warning">
        <Construction size={14} />
        Em construção
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs-causa font-medium text-causa-danger">
      <Circle size={14} />
      Pendente
    </span>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  iconColor,
  status,
  defaultOpen,
  completedCount,
  totalCount,
  children,
}: {
  title: string;
  icon: typeof Cloud;
  iconColor?: string;
  status: IntegrationStatus;
  defaultOpen?: boolean;
  completedCount?: number;
  totalCount?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? status !== 'ok');

  return (
    <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer hover:bg-causa-bg transition-causa"
      >
        {open ? (
          <ChevronDown size={16} className="text-[var(--color-text-muted)] shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-[var(--color-text-muted)] shrink-0" />
        )}
        <Icon size={20} className={iconColor ?? 'text-[var(--color-text-muted)]'} />
        <span className="text-base-causa font-semibold text-[var(--color-text)] flex-1">
          {title}
        </span>
        {completedCount != null && totalCount != null && (
          <span className="text-xs-causa text-[var(--color-text-muted)] mr-2">
            {completedCount} de {totalCount} configurados
          </span>
        )}
        <StatusBadge status={status} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-[var(--color-border)]">
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CNJ Connector Section                                             */
/* ------------------------------------------------------------------ */

function CnjSection() {
  return (
    <div className="py-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-causa-warning/8 border border-causa-warning/20">
        <Construction size={18} className="text-causa-warning shrink-0" />
        <div>
          <p className="text-sm-causa font-medium text-[var(--color-text)]">
            Conectores de tribunal em desenvolvimento
          </p>
          <p className="text-xs-causa text-[var(--color-text-muted)] mt-0.5">
            PJe e e-SAJ serão os primeiros conectores disponíveis. Acompanhe as atualizações.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GitHub Updates Section (PAT key)                                   */
/* ------------------------------------------------------------------ */

function GitHubSection() {
  const { toast } = useToast();
  const { status: _status } = useUpdateStatus();
  const [ghToken, setGhToken] = useState('');
  const [ghTokenLoaded, setGhTokenLoaded] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    api.getGhToken()
      .then(({ token }) => {
        setGhToken(token ?? '');
        setHasToken(!!token);
        setGhTokenLoaded(true);
      })
      .catch(() => setGhTokenLoaded(true));
  }, []);

  async function handleSaveToken() {
    setSavingToken(true);
    try {
      await api.setGhToken(ghToken.trim());
      setHasToken(!!ghToken.trim());
      toast('Token salvo. Verificando atualizações...', 'success');
      window.causaElectron?.checkForUpdate?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(`Erro ao salvar token: ${msg}`, 'error');
    } finally {
      setSavingToken(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa';

  if (!ghTokenLoaded) {
    return (
      <div className="py-4">
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-start gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-causa-surface-alt border border-[var(--color-border)]">
        <Info size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
        <p className="text-sm-causa text-[var(--color-text-muted)]">
          Configure um token de acesso pessoal (PAT) do GitHub para baixar atualizações automáticas de repositórios privados.
        </p>
      </div>

      <div>
        <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
          GitHub Token (repositório privado)
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={ghToken}
            onChange={(e) => setGhToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className={inputClass}
          />
          <Button variant="ghost" onClick={handleSaveToken} disabled={savingToken}>
            <Save size={14} className="mr-1" />
            {savingToken ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
        <p className="text-xs-causa text-[var(--color-text-muted)] mt-1">
          Token de acesso pessoal do GitHub (classic) com permissão <code className="bg-[var(--color-bg)] px-1 py-0.5 rounded text-xs">repo</code>. Necessário para baixar atualizações de repositórios privados.
        </p>
      </div>

      {hasToken && (
        <div className="flex items-center gap-2 text-sm-causa text-causa-success">
          <CheckCircle2 size={16} />
          Token configurado
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Google Drive Section                                               */
/* ------------------------------------------------------------------ */

function GoogleDriveSection() {
  const { toast } = useToast();
  const { refreshFeatures } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncingFolders, setSyncingFolders] = useState(false);
  const [connected, setConnected] = useState(false);
  const [authMode, setAuthMode] = useState<'oauth' | 'service_account'>('oauth');
  const [driveEmail, setDriveEmail] = useState<string | null>(null);
  const [rootFolderId, setRootFolderId] = useState('');
  const [impersonateEmail, setImpersonateEmail] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');

  const loadConfig = useCallback(async () => {
    try {
      const config = await api.getGoogleDriveConfig();
      setConnected(config.connected);
      setAuthMode(config.authMode ?? 'oauth');
      setRootFolderId(config.rootFolderId ?? '');
      setImpersonateEmail(config.impersonateEmail ?? '');
      setOauthClientId(config.oauthClientId ?? '');

      if (config.connected) {
        const status = await api.getGoogleDriveStatus();
        if (status.connected) setDriveEmail(status.email ?? null);
      }
    } catch {
      // Silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (!connecting) return;
    const interval = setInterval(async () => {
      try {
        const status = await api.getGoogleDriveStatus();
        if (status.connected) {
          setConnecting(false);
          setConnected(true);
          setDriveEmail(status.email ?? null);
          toast('Google Drive conectado com sucesso!', 'success');
          loadConfig();
          refreshFeatures();
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [connecting, toast, loadConfig, refreshFeatures]);

  async function handleOAuthConnect() {
    if (!oauthClientId.trim() || !oauthClientSecret.trim()) {
      toast('Preencha o Client ID e o Client Secret.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.updateGoogleDriveConfig({
        authMode: 'oauth',
        oauthClientId: oauthClientId.trim(),
        oauthClientSecret: oauthClientSecret.trim(),
      });
      const { authUrl } = await api.getGoogleDriveOAuthUrl();
      window.open(authUrl, '_blank');
      setConnecting(true);
      setShowSetup(false);
      toast('Janela de autorização aberta. Faça login na sua conta Google.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao conectar.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaSave() {
    if (!serviceAccountJson.trim()) {
      toast('Cole o conteúdo do arquivo JSON da Service Account.', 'error');
      return;
    }
    let clientEmail: string;
    try {
      const parsed = JSON.parse(serviceAccountJson);
      if (!parsed.client_email || !parsed.private_key) {
        toast('JSON inválido: campos client_email e private_key são obrigatórios.', 'error');
        return;
      }
      clientEmail = parsed.client_email;
    } catch {
      toast('JSON inválido. Verifique o conteúdo colado.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.updateGoogleDriveConfig({ authMode: 'service_account', serviceAccountJson });
      setConnected(true);
      setShowSetup(false);
      setServiceAccountJson('');
      setDriveEmail(clientEmail);
      toast('Service Account configurada! Agora configure a pasta raiz e o e-mail de impersonação.', 'success');
      loadConfig();
      refreshFeatures();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSettings() {
    if (!rootFolderId.trim()) {
      toast('Informe o ID da pasta raiz.', 'error');
      return;
    }
    if (authMode === 'service_account' && !impersonateEmail.trim()) {
      toast('E-mail para impersonar é obrigatório no modo Service Account.', 'error');
      return;
    }
    setSavingSettings(true);
    try {
      await api.updateGoogleDriveConfig({ rootFolderId, impersonateEmail: impersonateEmail.trim() || '' });
      toast('Configurações salvas.', 'success');
      loadConfig();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleSyncFolders() {
    setSyncingFolders(true);
    try {
      const result = await api.syncDriveFolders();
      const failed = result.details?.filter((d) => !d.ok) ?? [];
      if (failed.length > 0) {
        toast(`Sincronização parcial: ${result.created}/${result.total}. Erros: ${failed.map((d) => d.nome).join(', ')}`, 'error');
      } else {
        const folderNames = result.details?.map((d) => d.folderName).join(', ') ?? '';
        toast(`Estrutura sincronizada: ${result.created}/${result.total} clientes. Pastas: ${folderNames}`, 'success');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao sincronizar pastas.', 'error');
    } finally {
      setSyncingFolders(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const status = await api.getGoogleDriveStatus();
      if (status.connected) {
        setDriveEmail(status.email ?? null);
        toast('Conexão OK! Drive acessível.', 'success');
      } else {
        toast(status.error ?? 'Falha na conexão.', 'error');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao testar.', 'error');
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await api.disconnectGoogleDrive();
      setConnected(false);
      setDriveEmail(null);
      setRootFolderId('');
      setImpersonateEmail('');
      setOauthClientId('');
      setOauthClientSecret('');
      toast('Google Drive desconectado.', 'success');
      refreshFeatures();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao desconectar.', 'error');
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-4">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3.5 w-64 mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const inputClass =
    'w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa';

  return (
    <div className="py-4 space-y-4">
      <p className="text-sm-causa text-[var(--color-text-muted)]">
        Sincronize documentos com o Google Drive para backup e acesso remoto.
      </p>

      {/* Aguardando callback OAuth */}
      {connecting && !connected && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-causa-surface-alt border border-[var(--color-border)]">
          <Loader2 size={18} className="text-[var(--color-primary)] animate-spin shrink-0" />
          <p className="text-sm-causa text-[var(--color-text)]">
            Aguardando autorização no navegador... Faça login e autorize o acesso.
          </p>
        </div>
      )}

      {/* Estado: conectado */}
      {connected && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-causa-success/8 border border-causa-success/20">
            <CheckCircle2 size={18} className="text-causa-success shrink-0" />
            <div className="flex-1">
              <p className="text-sm-causa font-medium text-[var(--color-text)]">
                Conectado ao Google Drive
              </p>
              {driveEmail && (
                <p className="text-xs-causa text-[var(--color-text-muted)] mt-0.5">
                  {authMode === 'oauth' ? 'Conta' : 'Service Account'}: {driveEmail}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleTest} disabled={testing}>
                <RefreshCw size={14} className={`mr-1 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Testando...' : 'Testar'}
              </Button>
              <Button variant="ghost" onClick={handleDisconnect} disabled={disconnecting}>
                <Unplug size={14} className="mr-1" />
                {disconnecting ? 'Removendo...' : 'Remover'}
              </Button>
            </div>
          </div>

          {/* Configurações de pasta */}
          <div className="pt-3 border-t border-[var(--color-border)] space-y-3">
            {authMode === 'service_account' && (
              <div>
                <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                  E-mail para impersonar (Google Workspace)
                </label>
                <input
                  type="email"
                  value={impersonateEmail}
                  onChange={(e) => setImpersonateEmail(e.target.value)}
                  placeholder="usuario@suaempresa.com.br"
                  className={inputClass}
                />
                <p className="text-xs-causa text-[var(--color-text-muted)] mt-1">
                  Obrigatório para Service Account. E-mail do usuário cujo Drive será usado.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                ID da pasta raiz no Drive
              </label>
              <input
                type="text"
                value={rootFolderId}
                onChange={(e) => setRootFolderId(e.target.value)}
                placeholder="Ex: 1AbCdEfGhIjKlMnOpQrStUvWxYz"
                className={inputClass}
              />
              <p className="text-xs-causa text-[var(--color-text-muted)] mt-1">
                ID da pasta onde os documentos serão organizados.
                Copie da URL: <code className="bg-[var(--color-bg)] px-1 py-0.5 rounded text-xs">drive.google.com/drive/folders/<strong>ID_AQUI</strong></code>
              </p>
              <p className="text-xs-causa text-[var(--color-text-muted)] mt-1">
                Estrutura criada: <code className="bg-[var(--color-bg)] px-1 py-0.5 rounded text-xs">Clientes/Nome-CPF/Proc.-NumeroCNJ/</code>
              </p>
            </div>

            {!rootFolderId && (
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-causa-warning/8 border border-causa-warning/20">
                <AlertCircle size={14} className="text-causa-warning shrink-0" />
                <p className="text-xs-causa text-causa-warning">
                  Sem pasta raiz configurada. A sincronização de documentos não funcionará.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSaveSettings} disabled={savingSettings}>
                <Save size={14} className="mr-1" />
                {savingSettings ? 'Salvando...' : 'Salvar configurações'}
              </Button>
              <Button variant="ghost" onClick={handleSyncFolders} disabled={syncingFolders}>
                <RefreshCw size={14} className={`mr-1 ${syncingFolders ? 'animate-spin' : ''}`} />
                {syncingFolders ? 'Sincronizando...' : 'Sincronizar pastas'}
              </Button>
            </div>
            <p className="text-xs-causa text-[var(--color-text-muted)]">
              &quot;Sincronizar pastas&quot; cria a estrutura de pastas (Clientes/Nome/Compartilhado) para todos os clientes cadastrados.
            </p>
          </div>
        </div>
      )}

      {/* Estado: não configurado */}
      {!connected && !showSetup && !connecting && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-causa-surface-alt border border-[var(--color-border)]">
            <Settings size={18} className="text-[var(--color-text-muted)]" />
            <p className="text-sm-causa text-[var(--color-text-muted)]">
              Conecte sua conta Google para sincronizar documentos com o Drive.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setShowSetup(true)}>
            Configurar Google Drive
          </Button>
        </div>
      )}

      {/* Setup com escolha de modo */}
      {!connected && showSetup && !connecting && (
        <div className="mt-2 space-y-4">
          <div className="flex gap-1 p-1 bg-causa-surface-alt rounded-[var(--radius-md)]">
            {([
              { value: 'oauth' as const, label: 'Conta Google (Recomendado)' },
              { value: 'service_account' as const, label: 'Service Account (Workspace)' },
            ]).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAuthMode(value)}
                className={`flex-1 py-1.5 text-sm-causa font-medium rounded-[var(--radius-sm)] transition-causa cursor-pointer ${
                  authMode === value
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-sm)]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* OAuth setup */}
          {authMode === 'oauth' && (
            <div className="space-y-4">
              <div className="rounded-[var(--radius-md)] bg-causa-surface-alt border border-[var(--color-border)] p-4">
                <p className="text-sm-causa font-medium text-[var(--color-text)] mb-3">
                  Como configurar (funciona com Gmail gratuito):
                </p>
                <ol className="text-xs-causa text-[var(--color-text-muted)] space-y-2 list-decimal list-inside">
                  <li>
                    Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] underline">Google Cloud Console</a> e crie um projeto
                  </li>
                  <li>
                    Ative a <strong>Google Drive API</strong> em APIs e Serviços &gt; Biblioteca
                  </li>
                  <li>
                    Configure a <strong>Tela de consentimento OAuth</strong> (tipo: Externo, adicione seu email como usuário de teste)
                  </li>
                  <li>
                    Vá em <strong>Credenciais &gt; Criar credenciais &gt; ID do cliente OAuth</strong>
                  </li>
                  <li>
                    Tipo: <strong>Aplicativo da Web</strong>. Em URIs de redirecionamento, adicione: <code className="bg-[var(--color-bg)] px-1 py-0.5 rounded">http://localhost:3456/api/google-drive/oauth/callback</code>
                  </li>
                  <li>
                    Copie o <strong>Client ID</strong> e <strong>Client Secret</strong> e cole abaixo
                  </li>
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={oauthClientId}
                    onChange={(e) => setOauthClientId(e.target.value)}
                    placeholder="xxxx.apps.googleusercontent.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    value={oauthClientSecret}
                    onChange={(e) => setOauthClientSecret(e.target.value)}
                    placeholder="GOCSPX-..."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleOAuthConnect} disabled={saving}>
                  <Cloud size={14} className="mr-1" />
                  {saving ? 'Conectando...' : 'Conectar com Google'}
                </Button>
                <Button variant="ghost" onClick={() => { setShowSetup(false); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Service Account setup */}
          {authMode === 'service_account' && (
            <div className="space-y-4">
              <div className="rounded-[var(--radius-md)] bg-causa-surface-alt border border-[var(--color-border)] p-4">
                <p className="text-sm-causa font-medium text-[var(--color-text)] mb-3">
                  Service Account (requer Google Workspace pago):
                </p>
                <ol className="text-xs-causa text-[var(--color-text-muted)] space-y-2 list-decimal list-inside">
                  <li>Crie uma Service Account no Google Cloud Console</li>
                  <li>Baixe a chave JSON e cole o conteúdo abaixo</li>
                  <li>
                    No <strong>Google Admin Console</strong>, habilite a <strong>delegação de domínio</strong> com o escopo <code className="bg-[var(--color-bg)] px-1 py-0.5 rounded">https://www.googleapis.com/auth/drive</code>
                  </li>
                  <li>Informe o e-mail do usuário a impersonar e o ID da pasta raiz</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
                  JSON da Service Account
                </label>
                <textarea
                  value={serviceAccountJson}
                  onChange={(e) => setServiceAccountJson(e.target.value)}
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  rows={6}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-xs font-mono resize-y"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaSave} disabled={saving}>
                  <Save size={14} className="mr-1" />
                  {saving ? 'Salvando...' : 'Salvar e conectar'}
                </Button>
                <Button variant="ghost" onClick={() => { setShowSetup(false); setServiceAccountJson(''); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Telegram Section                                                   */
/* ------------------------------------------------------------------ */

function TelegramSectionContent() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [dailySummary, setDailySummary] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [availableChats, setAvailableChats] = useState<api.TelegramUpdate[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const config = await api.getTelegramConfig();
      setConfigured(config.configured);
      setChatId(config.chatId ?? '');
      setDailySummary(config.dailySummaryEnabled);
    } catch {
      // Silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  async function handleSave() {
    if (!botToken.trim() && !configured) {
      toast('Preencha o token do bot.', 'error');
      return;
    }
    setSaving(true);
    try {
      const data: Record<string, unknown> = { dailySummaryEnabled: dailySummary };
      if (botToken.trim()) data.botToken = botToken;
      if (chatId.trim()) data.chatId = chatId;
      await api.updateTelegramConfig(data as Parameters<typeof api.updateTelegramConfig>[0]);
      setConfigured(true);
      setShowSetup(false);
      toast('Configuração do Telegram salva.', 'success');
      loadConfig();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const result = await api.testTelegram();
      if (result.ok) {
        toast(`Bot conectado: ${result.botName ?? 'ok'}. Mensagem de teste enviada!`, 'success');
      } else {
        toast(`Erro: ${result.error ?? 'falha na conexão'}`, 'error');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao testar.', 'error');
    } finally {
      setTesting(false);
    }
  }

  async function handleSendSummary() {
    setSendingSummary(true);
    try {
      await api.sendTelegramSummary();
      toast('Resumo diário enviado!', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao enviar resumo.', 'error');
    } finally {
      setSendingSummary(false);
    }
  }

  async function handleLoadChats() {
    setLoadingChats(true);
    try {
      const chats = await api.getTelegramUpdates();
      setAvailableChats(chats);
      if (chats.length === 0) {
        toast('Nenhuma conversa encontrada. Envie uma mensagem para o bot primeiro.', 'error');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao buscar conversas.', 'error');
    } finally {
      setLoadingChats(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await api.disconnectTelegram();
      setConfigured(false);
      setChatId('');
      setBotToken('');
      setDailySummary(false);
      toast('Telegram desconectado.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao desconectar.', 'error');
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-4">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3.5 w-64 mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const inputClass =
    'w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa';

  return (
    <div className="py-4 space-y-4">
      <p className="text-sm-causa text-[var(--color-text-muted)]">
        Receba alertas de prazos e resumos diários pelo Telegram.
      </p>

      {/* Configurado */}
      {configured && !showSetup && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-causa-success/8 border border-causa-success/20">
            <CheckCircle2 size={18} className="text-causa-success shrink-0" />
            <div className="flex-1">
              <p className="text-sm-causa font-medium text-[var(--color-text)]">
                Bot Telegram conectado
              </p>
              {chatId && (
                <p className="text-xs-causa text-[var(--color-text-muted)] mt-0.5">
                  Chat ID: {chatId}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-causa-surface-alt border border-[var(--color-border)]">
            <Bell size={16} className="text-[var(--color-text-muted)] shrink-0" />
            <label className="flex items-center gap-2 cursor-pointer text-sm-causa text-[var(--color-text)] flex-1">
              <input
                type="checkbox"
                checked={dailySummary}
                onChange={(e) => {
                  setDailySummary(e.target.checked);
                  api.updateTelegramConfig({ dailySummaryEnabled: e.target.checked })
                    .then(() => toast('Configuração atualizada.', 'success'))
                    .catch(() => {});
                }}
                className="accent-[var(--color-primary)]"
              />
              Resumo diário automático (8h)
            </label>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" onClick={handleTest} disabled={testing}>
              <Send size={14} className="mr-1" />
              {testing ? 'Testando...' : 'Testar'}
            </Button>
            <Button variant="ghost" onClick={handleSendSummary} disabled={sendingSummary}>
              <MessageCircle size={14} className="mr-1" />
              {sendingSummary ? 'Enviando...' : 'Enviar resumo agora'}
            </Button>
            <Button variant="ghost" onClick={() => setShowSetup(true)}>
              Editar config
            </Button>
            <Button variant="ghost" onClick={handleDisconnect} disabled={disconnecting}>
              <Unplug size={14} className="mr-1" />
              {disconnecting ? 'Desconectando...' : 'Desconectar'}
            </Button>
          </div>
        </div>
      )}

      {/* Não configurado */}
      {!configured && !showSetup && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-causa-surface-alt border border-[var(--color-border)]">
            <Settings size={18} className="text-[var(--color-text-muted)]" />
            <p className="text-sm-causa text-[var(--color-text-muted)]">
              Crie um bot no @BotFather do Telegram e configure o token para receber alertas.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setShowSetup(true)}>
            Configurar bot
          </Button>
        </div>
      )}

      {/* Formulário de configuração */}
      {showSetup && (
        <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
          <div>
            <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
              Token do Bot
            </label>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456:ABC-DEF1234..."
              className={inputClass}
            />
            <p className="text-xs-causa text-[var(--color-text-muted)] mt-1">
              Obtenha em @BotFather no Telegram.
            </p>
          </div>

          <div>
            <label className="block text-sm-causa font-medium text-[var(--color-text)] mb-1">
              Chat ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="-1001234567890"
                className={inputClass}
              />
              <Button
                variant="ghost"
                onClick={handleLoadChats}
                disabled={loadingChats || !botToken.trim()}
                title="Salve o token primeiro, envie uma mensagem ao bot, depois clique aqui"
              >
                {loadingChats ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              </Button>
            </div>
            {availableChats.length > 0 && (
              <div className="mt-2 space-y-1">
                {availableChats.map((c) => (
                  <button
                    key={c.chatId}
                    type="button"
                    onClick={() => setChatId(c.chatId)}
                    className={`w-full text-left px-3 py-1.5 rounded-[var(--radius-md)] text-sm-causa transition-causa cursor-pointer ${
                      chatId === c.chatId
                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                        : 'bg-causa-surface-alt text-[var(--color-text)] hover:bg-causa-bg'
                    }`}
                  >
                    {c.chatTitle} <span className="text-[var(--color-text-muted)]">({c.chatId})</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs-causa text-[var(--color-text-muted)] mt-1">
              Envie uma mensagem ao bot e clique no botão de refresh para descobrir o chat ID.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm-causa text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={dailySummary}
              onChange={(e) => setDailySummary(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            Habilitar resumo diário automático (8h)
          </label>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save size={14} className="mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            {configured && (
              <Button variant="ghost" onClick={() => setShowSetup(false)}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Integrações Page                                              */
/* ------------------------------------------------------------------ */

export function IntegracoesPage() {
  const { can } = usePermission();
  const canManageLicenca = can('licenca:gerenciar');

  const [driveConnected, setDriveConnected] = useState(false);
  const [telegramConfigured, setTelegramConfigured] = useState(false);
  const [ghTokenConfigured, setGhTokenConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [driveConfig, telegramConfig, ghTokenResult] = await Promise.allSettled([
          api.getGoogleDriveConfig(),
          api.getTelegramConfig(),
          api.getGhToken(),
        ]);
        if (!mounted) return;
        if (driveConfig.status === 'fulfilled') setDriveConnected(driveConfig.value.connected);
        if (telegramConfig.status === 'fulfilled') setTelegramConfigured(telegramConfig.value.configured);
        if (ghTokenResult.status === 'fulfilled') setGhTokenConfigured(!!ghTokenResult.value.token);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const completedCount = [driveConnected, telegramConfigured, ghTokenConfigured].filter(Boolean).length;
  const totalIntegrations = 4; // CNJ, Google Drive, GitHub, Telegram

  if (loading) {
    return (
      <div>
        <PageHeader title="Integrações" description="Configure as integrações e conectores do sistema" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] p-5"
            >
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3.5 w-64" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Integrações" description="Configure as integrações e conectores do sistema" />

      {/* Summary bar */}
      <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-causa-surface-alt border border-[var(--color-border)]">
        <Info size={18} className="text-[var(--color-primary)] shrink-0" />
        <p className="text-sm-causa text-[var(--color-text)]">
          <span className="font-medium">{completedCount} de {totalIntegrations}</span> integrações configuradas.
          {completedCount < totalIntegrations && ' Complete as pendentes para aproveitar todos os recursos.'}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Conector CNJ */}
        <CollapsibleSection
          title="Conector CNJ"
          icon={Scale}
          iconColor="text-causa-warning"
          status="building"
          defaultOpen={false}
        >
          <CnjSection />
        </CollapsibleSection>

        {/* Google Drive */}
        {canManageLicenca && (
          <CollapsibleSection
            title="Google Drive"
            icon={Cloud}
            iconColor="text-[var(--color-primary)]"
            status={driveConnected ? 'ok' : 'incomplete'}
            defaultOpen={!driveConnected}
          >
            <GoogleDriveSection />
          </CollapsibleSection>
        )}

        {/* GitHub - Atualizações */}
        <CollapsibleSection
          title="GitHub - Atualizações"
          icon={Github}
          iconColor="text-[var(--color-text)]"
          status={ghTokenConfigured ? 'ok' : 'incomplete'}
          defaultOpen={!ghTokenConfigured}
        >
          <GitHubSection />
        </CollapsibleSection>

        {/* Telegram */}
        {canManageLicenca && (
          <CollapsibleSection
            title="Telegram"
            icon={MessageCircle}
            iconColor="text-causa-accent-telegram"
            status={telegramConfigured ? 'ok' : 'incomplete'}
            defaultOpen={!telegramConfigured}
          >
            <TelegramSectionContent />
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
