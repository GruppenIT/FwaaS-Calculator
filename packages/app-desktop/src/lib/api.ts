const API_URL = 'http://localhost:3456';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

export function getAccessToken() {
  return accessToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    // "Failed to fetch" — o servidor não respondeu (crash, timeout, não iniciado)
    throw new Error(
      `Não foi possível conectar ao servidor (${path}). Verifique se o serviço CAUSA está rodando. Detalhes: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`,
    );
  }

  if (res.status === 401 && refreshToken) {
    // Try to refresh
    const refreshRes = await fetch(`${API_URL}/api/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const tokens = (await refreshRes.json()) as { accessToken: string; refreshToken: string };
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;

      // Retry original request
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retryRes = await fetch(`${API_URL}${path}`, { ...options, headers });
      if (!retryRes.ok) {
        const err = (await retryRes.json().catch(() => ({ error: 'Erro desconhecido' }))) as {
          error: string;
        };
        throw new Error(err.error);
      }
      return retryRes.json() as Promise<T>;
    } else {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))) as {
      error: string;
    };
    throw new Error(err.error);
  }

  return res.json() as Promise<T>;
}

// === Health ===
export function checkHealth() {
  return request<{ ok: boolean; configured: boolean }>('/api/health');
}

// === Setup ===
// O setup pode demorar (migrations, bcrypt, seed) — retry em caso de falha de rede
export async function setupSystem(data: {
  topologia: 'solo' | 'escritorio';
  postgresUrl?: string;
  admin: {
    nome: string;
    email: string;
    senha: string;
    oabNumero?: string;
    oabSeccional?: string;
  };
}): Promise<{ ok: boolean; adminId: string }> {
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 2000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await request<{ ok: boolean; adminId: string }>('/api/setup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const isNetworkError =
        err instanceof Error &&
        (err.message.includes('Não foi possível conectar') ||
          err.message.includes('Failed to fetch'));
      const isAlreadyConfigured =
        err instanceof Error && err.message.includes('já configurado');

      // Se já foi configurado, significa que o setup anterior deu certo (a resposta é que se perdeu)
      if (isAlreadyConfigured) {
        return { ok: true, adminId: '' };
      }

      // Retry apenas para erros de rede, não erros de negócio
      if (isNetworkError && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }

      throw err;
    }
  }

  throw new Error('Falha ao configurar sistema após múltiplas tentativas.');
}

// === Auth ===
export async function login(email: string, senha: string) {
  const tokens = await request<{ accessToken: string; refreshToken: string }>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export function getMe() {
  return request<{
    sub: string;
    email: string;
    role: string;
    permissions: string[];
  }>('/api/me');
}

// === Clientes ===
export function listarClientes(busca?: string) {
  const q = busca ? `?q=${encodeURIComponent(busca)}` : '';
  return request<
    Array<{
      id: string;
      tipo: 'PF' | 'PJ';
      nome: string;
      cpfCnpj: string | null;
      email: string | null;
      telefone: string | null;
      createdAt: string;
    }>
  >(`/api/clientes${q}`);
}

export function criarCliente(data: {
  tipo: 'PF' | 'PJ';
  nome: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
}) {
  return request<{ id: string }>('/api/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function excluirCliente(id: string) {
  return request<{ ok: boolean }>(`/api/clientes/${id}`, {
    method: 'DELETE',
  });
}

// === Processos ===
export function listarProcessos(busca?: string) {
  const q = busca ? `?q=${encodeURIComponent(busca)}` : '';
  return request<
    Array<{
      id: string;
      numeroCnj: string;
      clienteNome: string | null;
      advogadoNome: string | null;
      tribunalSigla: string;
      plataforma: string;
      area: string;
      fase: string;
      status: 'ativo' | 'arquivado' | 'encerrado';
      valorCausa: number | null;
      ultimoSyncAt: string | null;
      createdAt: string;
    }>
  >(`/api/processos${q}`);
}

export function criarProcesso(data: {
  numeroCnj: string;
  clienteId: string;
  advogadoResponsavelId: string;
  tribunalSigla: string;
  plataforma: string;
  area: string;
  fase: string;
  valorCausa?: number;
}) {
  return request<{ id: string }>('/api/processos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarProcesso(
  id: string,
  data: Partial<{
    numeroCnj: string;
    clienteId: string;
    advogadoResponsavelId: string;
    tribunalSigla: string;
    plataforma: string;
    area: string;
    fase: string;
    status: 'ativo' | 'arquivado' | 'encerrado';
    valorCausa: number;
  }>,
) {
  return request<{ ok: boolean }>(`/api/processos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function excluirProcesso(id: string) {
  return request<{ ok: boolean }>(`/api/processos/${id}`, {
    method: 'DELETE',
  });
}

// === Usuarios ===
export function listarUsuarios() {
  return request<
    Array<{
      id: string;
      nome: string;
      email: string;
      oabNumero: string | null;
      oabSeccional: string | null;
      role: string | null;
      ativo: boolean;
      createdAt: string;
    }>
  >('/api/usuarios');
}

export function criarUsuario(data: {
  nome: string;
  email: string;
  senha: string;
  role: string;
  oabNumero?: string;
  oabSeccional?: string;
}) {
  return request<{ id: string }>('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarUsuario(
  id: string,
  data: Partial<{
    nome: string;
    email: string;
    oabNumero: string;
    oabSeccional: string;
    role: string;
    ativo: boolean;
  }>,
) {
  return request<{ ok: boolean }>(`/api/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function listarRoles() {
  return request<Array<{ id: string; nome: string }>>('/api/roles');
}

// === Honorários ===
export interface HonorarioRow {
  id: string;
  processoId: string | null;
  numeroCnj: string | null;
  clienteId: string | null;
  clienteNome: string | null;
  tipo: 'fixo' | 'exito' | 'por_hora';
  valor: number;
  percentualExito: number | null;
  status: 'pendente' | 'recebido' | 'inadimplente';
  vencimento: string | null;
  createdAt: string;
}

export function listarHonorarios() {
  return request<HonorarioRow[]>('/api/honorarios');
}

export function criarHonorario(data: {
  processoId?: string;
  clienteId?: string;
  tipo: 'fixo' | 'exito' | 'por_hora';
  valor: number;
  percentualExito?: number;
  vencimento?: string;
}) {
  return request<{ id: string }>('/api/honorarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarStatusHonorario(
  id: string,
  status: 'pendente' | 'recebido' | 'inadimplente',
) {
  return request<{ ok: boolean }>(`/api/honorarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export function excluirHonorario(id: string) {
  return request<{ ok: boolean }>(`/api/honorarios/${id}`, {
    method: 'DELETE',
  });
}

// === Agenda ===
export interface AgendaRow {
  id: string;
  titulo: string;
  tipo: 'audiencia' | 'diligencia' | 'reuniao' | 'prazo';
  dataHoraInicio: string;
  dataHoraFim: string | null;
  processoId: string | null;
  numeroCnj: string | null;
  participantes: string[] | null;
  local: string | null;
  createdAt: string;
}

export function listarAgenda(inicio?: string, fim?: string) {
  const params = new URLSearchParams();
  if (inicio) params.set('inicio', inicio);
  if (fim) params.set('fim', fim);
  const q = params.toString();
  return request<AgendaRow[]>(`/api/agenda${q ? `?${q}` : ''}`);
}

export function criarEvento(data: {
  titulo: string;
  tipo: 'audiencia' | 'diligencia' | 'reuniao' | 'prazo';
  dataHoraInicio: string;
  dataHoraFim?: string;
  processoId?: string;
  participantes?: string[];
  local?: string;
}) {
  return request<{ id: string }>('/api/agenda', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarEvento(
  id: string,
  data: Partial<{
    titulo: string;
    tipo: 'audiencia' | 'diligencia' | 'reuniao' | 'prazo';
    dataHoraInicio: string;
    dataHoraFim: string;
    processoId: string;
    participantes: string[];
    local: string;
  }>,
) {
  return request<{ ok: boolean }>(`/api/agenda/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function excluirEvento(id: string) {
  return request<{ ok: boolean }>(`/api/agenda/${id}`, {
    method: 'DELETE',
  });
}

// === Prazos ===
export interface PrazoRow {
  id: string;
  processoId: string;
  numeroCnj: string | null;
  descricao: string;
  dataFatal: string;
  tipoPrazo: 'ncpc' | 'clt' | 'jec' | 'outros';
  status: 'pendente' | 'cumprido' | 'perdido';
  responsavelId: string;
  responsavelNome: string | null;
  alertasEnviados: { dias: number[]; enviados: string[] } | null;
}

export function listarPrazos(filtros?: { status?: string; responsavelId?: string }) {
  const params = new URLSearchParams();
  if (filtros?.status) params.set('status', filtros.status);
  if (filtros?.responsavelId) params.set('responsavelId', filtros.responsavelId);
  const q = params.toString();
  return request<PrazoRow[]>(`/api/prazos${q ? `?${q}` : ''}`);
}

export function criarPrazo(data: {
  processoId: string;
  descricao: string;
  dataFatal: string;
  tipoPrazo: 'ncpc' | 'clt' | 'jec' | 'outros';
  responsavelId: string;
}) {
  return request<{ id: string }>('/api/prazos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarStatusPrazo(id: string, status: 'pendente' | 'cumprido' | 'perdido') {
  return request<{ ok: boolean }>(`/api/prazos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export function excluirPrazo(id: string) {
  return request<{ ok: boolean }>(`/api/prazos/${id}`, {
    method: 'DELETE',
  });
}

// === Configurações ===
export function getConfiguracoes() {
  return request<{
    topologia: 'solo' | 'escritorio';
    dbPath: string;
  }>('/api/configuracoes');
}

export function atualizarConfiguracoes(data: Partial<{ topologia: 'solo' | 'escritorio' }>) {
  return request<{ ok: boolean }>('/api/configuracoes', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// === Dashboard ===
export function getDashboardStats() {
  return request<{
    processosAtivos: number;
    clientes: number;
    prazosPendentes: number;
    prazosFatais: number;
    honorariosPendentes: number;
  }>('/api/dashboard');
}
