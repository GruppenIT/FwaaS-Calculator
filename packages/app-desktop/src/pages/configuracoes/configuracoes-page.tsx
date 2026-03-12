import { useState, useEffect, useCallback } from 'react';
import { Settings, Save, Moon, Sun, RefreshCw, CheckCircle2, AlertCircle, Loader2, Cloud, CloudOff, Unplug, Send, MessageCircle, Bell, Download } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { useTheme } from '../../hooks/use-theme';
import { usePermission } from '../../hooks/use-permission';
import { useAuth } from '../../lib/auth-context';
import * as api from '../../lib/api';
import { useUpdateStatus } from '../../hooks/use-update-status';

function UpdateSection() {
  const { toast } = useToast();
  const { status } = useUpdateStatus();
  const [ghToken, setGhToken] = useState('');
  const [ghTokenLoaded, setGhTokenLoaded] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const appVersion = __APP_VERSION__;

  useEffect(() => {
    api.getGhToken()
      .then(({ token }) => {
        setGhToken(token ?? '');
        setGhTokenLoaded(true);
      })
      .catch(() => setGhTokenLoaded(true));
  }, []);

  function handleCheck() {
    window.causaElectron?.checkForUpdate?.();
  }

  async function handleSaveToken() {
    setSavingToken(true);
    try {
      await api.setGhToken(ghToken.trim());
      toast('Token salvo. Verificando atualizações...', 'success');
      window.causaElectron?.checkForUpdate?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast(`Erro ao salvar token: ${msg}`, 'error');
    } finally {
      setSavingToken(false);
    }
  }

  const isChecking = status.state === 'checking';
  const isUpToDate = status.state === 'not-available';
  const hasError = status.state === 'error';

  const inputClass =
    'w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa';

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
      <h3 className="text-base-causa font-semibold text-[var(--color-text)] mb-1">
        Atualizações
      </h3>
      <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
        Versão atual: <span className="font-medium text-[var(--color-text)]">v{appVersion}</span>
        <span className="ml-2 text-xs-causa">— Verifique se há novas versões disponíveis.</span>
      </p>

      {/* Up to date */}
      {isUpToDate && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm-causa text-causa-success">
            <CheckCircle2 size={18} />
            <span>Você está na versão mais recente.</span>
          </div>
          <button
            type="button"
            onClick={handleCheck}
            className="text-sm-causa text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer underline"
          >
            Verificar novamente
          </button>
        </div>
      )}

      {/* Idle or checking */}
      {(status.state === 'idle' || isChecking) && (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleCheck}
            disabled={isChecking}
          >
            {isChecking ? (
              <Loader2 size={16} className="animate-spin mr-1.5" />
            ) : (
              <RefreshCw size={16} className="mr-1.5" />
            )}
            {isChecking ? 'Verificando...' : 'Verificar atualizações'}
          </Button>
        </div>
      )}

      {/* Error */}
      {hasError && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-causa-danger/8 border border-causa-danger/20">
            <AlertCircle size={18} className="text-causa-danger shrink-0" />
            <div>
              <p className="text-sm-causa font-medium text-causa-danger">
                Erro ao verificar atualizações
              </p>
              {status.error && (
                <p className="text-xs-causa text-[var(--color-text-muted)] mt-0.5 break-all">
                  {status.error}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" onClick={handleCheck}>
            <RefreshCw size={16} className="mr-1.5" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Available — nova versão encontrada */}
      {status.state === 'available' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/20">
            <Download size={18} className="text-[var(--color-primary)] shrink-0" />
            <div>
              <p className="text-sm-causa font-medium text-[var(--color-text)]">
                Nova versão disponível: <span className="text-[var(--color-primary)]">v{status.version}</span>
              </p>
              <p className="text-xs-causa text-[var(--color-text-muted)] mt-0.5">
                Escolha como deseja atualizar:
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => window.causaElectron?.respondToUpdate('install-now')}>
              <Download size={16} className="mr-1.5" />
              Baixar e instalar agora
            </Button>
            <Button variant="ghost" onClick={() => window.causaElectron?.respondToUpdate('install-later')}>
              <RefreshCw size={16} className="mr-1.5" />
              Baixar em segundo plano
            </Button>
            <Button variant="ghost" onClick={() => window.causaElectron?.respondToUpdate('ignore')}>
              Ignorar
            </Button>
          </div>
        </div>
      )}

      {/* Downloading */}
      {status.state === 'downloading' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm-causa text-[var(--color-primary)]">
            <Loader2 size={18} className="animate-spin" />
            <span>Baixando atualização{status.background ? ' em segundo plano' : ''}...</span>
          </div>
          <div className="h-2 rounded-full bg-causa-surface-alt overflow-hidden border border-[var(--color-border)]">
            <div
              className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, status.percent ?? 0)}%` }}
            />
          </div>
          <p className="text-xs-causa text-[var(--color-text-muted)]">
            {status.percent != null ? `${status.percent.toFixed(0)}%` : 'Preparando...'}
          </p>
        </div>
      )}

      {/* Downloaded */}
      {status.state === 'downloaded' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-causa-success/8 border border-causa-success/20">
            <CheckCircle2 size={18} className="text-causa-success shrink-0" />
            <div>
              <p className="text-sm-causa font-medium text-causa-success">
                Atualização v{status.version} pronta!
              </p>
              <p className="text-xs-causa text-[var(--color-text-muted)] mt-0.5">
                {status.background
                  ? 'Será instalada automaticamente ao fechar o programa.'
                  : 'Reinicie para aplicar a atualização.'}
              </p>
            </div>
          </div>
          {!status.background && (
            <Button onClick={() => window.causaElectron?.restartAndUpdate()}>
              Reiniciar agora
            </Button>
          )}
        </div>
      )}

      {/* GH_TOKEN — necessário para repositório privado */}
      {ghTokenLoaded && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
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
      )}
    </div>
  );
}

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
  // OAuth fields
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');
  // SA fields
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

  // Polling para detectar quando o OAuth callback completa
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

  // === OAuth: salvar credentials e abrir janela de autorização ===
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

  // === Service Account: salvar JSON ===
  async function handleSaSave() {
    if (!serviceAccountJson.trim()) {
      toast('Cole o conteúdo do arquivo JSON da Service Account.', 'error');
      return;
    }
    let clientEmail = '';
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
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3.5 w-64 mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const inputClass =
    'w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa';

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
      <div className="flex items-center gap-2 mb-1">
        <Cloud size={18} className="text-[var(--color-primary)]" />
        <h3 className="text-base-causa font-semibold text-[var(--color-text)]">
          Google Drive
        </h3>
      </div>
      <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
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
          {/* Toggle OAuth / Service Account */}
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

function TelegramSection() {
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
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3.5 w-64 mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const inputClass =
    'w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm-causa';

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle size={18} className="text-[#0088cc]" />
        <h3 className="text-base-causa font-semibold text-[var(--color-text)]">
          Telegram
        </h3>
      </div>
      <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
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

          {/* Opções */}
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
        <div className="mt-4 space-y-3 pt-4 border-t border-[var(--color-border)]">
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

export function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();
  const { can } = usePermission();
  const { toast } = useToast();
  const canManageLicenca = can('licenca:gerenciar');
  const [topologia, setTopologia] = useState<'solo' | 'escritorio'>('solo');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getConfiguracoes()
      .then((config) => {
        setTopologia(config.topologia);
      })
      .catch((err) =>
        toast(err instanceof Error ? err.message : 'Erro ao carregar configurações.', 'error'),
      )
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.atualizarConfiguracoes({ topologia });
      toast('Configurações salvas com sucesso.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Configurações" description="Preferências do sistema" />
        <div className="flex flex-col gap-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6"
            >
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3.5 w-48 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Preferências do sistema" />

      <div className="flex flex-col gap-6">
        {/* Atualizações */}
        <UpdateSection />

        {/* Tema */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
          <h3 className="text-base-causa font-semibold text-[var(--color-text)] mb-1">Aparência</h3>
          <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
            Escolha o tema visual do sistema.
          </p>
          <div className="flex gap-3">
            {[
              { value: 'light' as const, label: 'Claro', icon: Sun },
              { value: 'dark' as const, label: 'Escuro', icon: Moon },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm-causa font-medium transition-causa cursor-pointer border ${
                  theme === value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-causa-surface-alt'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Google Drive — somente admin */}
        {canManageLicenca && <GoogleDriveSection />}

        {/* Telegram — somente admin */}
        {canManageLicenca && <TelegramSection />}

        {/* Topologia — somente admin */}
        {canManageLicenca && (
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
            <h3 className="text-base-causa font-semibold text-[var(--color-text)] mb-1">
              Topologia
            </h3>
            <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
              Modo de operação do sistema.
            </p>
            <div className="flex gap-3">
              {[
                {
                  value: 'solo' as const,
                  label: 'Solo',
                  desc: 'Advogado individual com banco local',
                },
                {
                  value: 'escritorio' as const,
                  label: 'Escritório',
                  desc: 'Múltiplos usuários com servidor compartilhado',
                },
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTopologia(value)}
                  className={`flex-1 text-left px-4 py-3 rounded-[var(--radius-md)] transition-causa cursor-pointer border ${
                    topologia === value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-causa-surface-alt'
                  }`}
                >
                  <div
                    className={`text-sm-causa font-medium mb-0.5 ${topologia === value ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}
                  >
                    {label}
                  </div>
                  <div className="text-xs-causa text-[var(--color-text-muted)]">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Certificado A1 */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
          <h3 className="text-base-causa font-semibold text-[var(--color-text)] mb-1">
            Certificado Digital A1
          </h3>
          <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
            Certificado para autenticação nos portais judiciais (PJe, e-SAJ).
          </p>
          <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-causa-surface-alt border border-[var(--color-border)]">
            <Settings size={18} className="text-[var(--color-text-muted)]" />
            <p className="text-sm-causa text-[var(--color-text-muted)]">
              Configuração de certificado estará disponível com os conectores PJe/e-SAJ.
            </p>
          </div>
        </div>

        {/* Banco de dados */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6">
          <h3 className="text-base-causa font-semibold text-[var(--color-text)] mb-1">
            Banco de dados
          </h3>
          <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
            Informações sobre o armazenamento.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-4 py-2 rounded-[var(--radius-md)] bg-causa-surface-alt">
              <span className="text-sm-causa text-[var(--color-text-muted)]">Motor</span>
              <span className="text-sm-causa text-[var(--color-text)] font-medium">
                SQLite (local)
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-2 rounded-[var(--radius-md)] bg-causa-surface-alt">
              <span className="text-sm-causa text-[var(--color-text-muted)]">Topologia</span>
              <span className="text-sm-causa text-[var(--color-text)] font-medium capitalize">
                {topologia}
              </span>
            </div>
          </div>
        </div>

        {/* Ações — somente admin */}
        {canManageLicenca && (
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
