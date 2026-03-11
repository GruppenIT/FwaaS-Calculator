import { google, type drive_v3 } from 'googleapis';
import { Readable } from 'node:stream';
import { logger } from '../logger.js';

export interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain?: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
}

/**
 * Estrutura de pastas no Google Drive:
 * {rootFolder}/
 * ├── Clientes/
 * │   ├── {nomeCliente}-{CPF}/
 * │   │   ├── Proc.-{numeroCnj}/
 * │   │   │   └── documentos...
 * │   │   └── Geral/
 * │   │       └── documentos sem processo...
 * └── Sem Cliente/
 *     └── documentos avulsos...
 *
 * Modos de autenticação:
 * 1. OAuth 2.0 (recomendado) — funciona com qualquer conta Google (Gmail gratuito ou Workspace)
 * 2. Service Account + domain-wide delegation — somente Google Workspace pago
 */
export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private folderCache = new Map<string, string>();
  private userEmail: string;
  private onTokenRefresh?: (tokens: OAuthTokens) => void;

  private constructor(drive: drive_v3.Drive, email: string) {
    this.drive = drive;
    this.userEmail = email;
  }

  /**
   * Cria instância via OAuth 2.0 — funciona com qualquer conta Google.
   * @param clientId OAuth Client ID do Google Cloud Console
   * @param clientSecret OAuth Client Secret
   * @param tokens Tokens salvos (access_token + refresh_token)
   * @param onTokenRefresh Callback para persistir tokens atualizados
   */
  static fromOAuth(
    clientId: string,
    clientSecret: string,
    tokens: OAuthTokens,
    onTokenRefresh?: (tokens: OAuthTokens) => void,
  ): GoogleDriveService {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
    oauth2.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    // Persistir tokens quando renovados automaticamente
    oauth2.on('tokens', (newTokens) => {
      const updated: OAuthTokens = {
        access_token: newTokens.access_token ?? tokens.access_token,
        refresh_token: newTokens.refresh_token ?? tokens.refresh_token,
        expiry_date: newTokens.expiry_date ?? Date.now() + 3600_000,
      };
      if (onTokenRefresh) onTokenRefresh(updated);
    });

    const drive = google.drive({ version: 'v3', auth: oauth2 });
    const service = new GoogleDriveService(drive, '');
    if (onTokenRefresh) service.onTokenRefresh = onTokenRefresh;
    return service;
  }

  /**
   * Cria instância via Service Account (Google Workspace com domain-wide delegation).
   * @param credentials JSON da Service Account
   * @param impersonateEmail E-mail do usuário para impersonar (obrigatório para SA)
   */
  static fromServiceAccount(credentials: ServiceAccountCredentials, impersonateEmail?: string): GoogleDriveService {
    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/drive'],
      impersonateEmail || undefined,
    );
    const drive = google.drive({ version: 'v3', auth });
    return new GoogleDriveService(drive, credentials.client_email);
  }

  /**
   * Gera URL de autorização para OAuth 2.0.
   */
  static getOAuthUrl(clientId: string, clientSecret: string, redirectUri: string): string {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive'],
    });
  }

  /**
   * Troca authorization code por tokens.
   */
  static async exchangeCode(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string,
  ): Promise<OAuthTokens> {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Falha ao obter tokens. Certifique-se de que o consent screen está configurado corretamente.');
    }
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date ?? Date.now() + 3600_000,
    };
  }

  /** Verifica se está conectado e funcionando */
  async testConnection(): Promise<{ ok: boolean; email?: string | undefined; error?: string | undefined }> {
    try {
      const about = await this.drive.about.get({ fields: 'user' });
      const email = about.data.user?.emailAddress ?? this.userEmail;
      if (email) this.userEmail = email;
      return { ok: true, email };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      };
    }
  }

  /** Busca ou cria uma pasta pelo nome dentro de um parent */
  private async findOrCreateFolder(name: string, parentId: string): Promise<string> {
    const cacheKey = `${parentId}/${name}`;
    const cached = this.folderCache.get(cacheKey);
    if (cached) return cached;

    // Busca pasta existente
    const q = [
      `name = '${name.replace(/'/g, "\\'")}'`,
      "mimeType = 'application/vnd.google-apps.folder'",
      'trashed = false',
      `'${parentId}' in parents`,
    ].join(' and ');

    const res = await this.drive.files.list({
      q,
      fields: 'files(id)',
      spaces: 'drive',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    if (res.data.files && res.data.files.length > 0 && res.data.files[0]?.id) {
      const id = res.data.files[0].id;
      this.folderCache.set(cacheKey, id);
      return id;
    }

    // Cria pasta
    const folder = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    const id = folder.data.id;
    if (!id) throw new Error(`Falha ao criar pasta "${name}"`);
    this.folderCache.set(cacheKey, id);
    return id;
  }

  /**
   * Resolve o caminho de pasta para um documento baseado em cliente e processo.
   * Estrutura: Clientes/{Nome}-{CPF}/Proc.-{numeroCnj}/
   * Retorna o ID da pasta final.
   */
  async resolveFolderPath(opts: {
    rootFolderId: string;
    clienteNome?: string | undefined;
    clienteCpfCnpj?: string | undefined;
    numeroCnj?: string | undefined;
  }): Promise<string> {
    const rootId = opts.rootFolderId;

    if (!opts.clienteNome) {
      return this.findOrCreateFolder('Sem Cliente', rootId);
    }

    const clientesId = await this.findOrCreateFolder('Clientes', rootId);

    // Pasta do cliente: "Nome Completo-CPF" ou só "Nome Completo"
    const clienteFolderName = opts.clienteCpfCnpj
      ? `${opts.clienteNome}-${opts.clienteCpfCnpj}`
      : opts.clienteNome;
    const clienteFolderId = await this.findOrCreateFolder(clienteFolderName, clientesId);

    if (!opts.numeroCnj) {
      return this.findOrCreateFolder('Geral', clienteFolderId);
    }

    // Pasta do processo: "Proc.-NUMEROCNJ"
    return this.findOrCreateFolder(`Proc.-${opts.numeroCnj}`, clienteFolderId);
  }

  /** Faz upload de um arquivo para o Google Drive */
  async uploadFile(opts: {
    name: string;
    mimeType: string;
    content: Buffer;
    folderId: string;
  }): Promise<DriveUploadResult> {
    const res = await this.drive.files.create({
      requestBody: {
        name: opts.name,
        parents: [opts.folderId],
      },
      media: {
        mimeType: opts.mimeType,
        body: Readable.from(opts.content),
      },
      fields: 'id,webViewLink',
      supportsAllDrives: true,
    });

    if (!res.data.id) throw new Error('Falha no upload — sem fileId retornado.');

    return {
      fileId: res.data.id,
      webViewLink: res.data.webViewLink ?? '',
    };
  }

  /** Baixa o conteúdo de um arquivo do Google Drive */
  async downloadFile(fileId: string): Promise<Buffer> {
    const res = await this.drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'arraybuffer' },
    );

    return Buffer.from(res.data as ArrayBuffer);
  }

  /** Remove um arquivo do Google Drive */
  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({ fileId, supportsAllDrives: true });
  }

  /** Atualiza o conteúdo de um arquivo existente */
  async updateFile(fileId: string, opts: {
    name?: string;
    mimeType: string;
    content: Buffer;
  }): Promise<void> {
    await this.drive.files.update({
      fileId,
      requestBody: opts.name ? { name: opts.name } : {},
      media: {
        mimeType: opts.mimeType,
        body: Readable.from(opts.content),
      },
      supportsAllDrives: true,
    });
  }

  /** E-mail do usuário conectado */
  get email(): string {
    return this.userEmail;
  }
}
