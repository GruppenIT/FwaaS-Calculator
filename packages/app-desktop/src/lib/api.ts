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

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && refreshToken) {
    // Try to refresh
    const refreshRes = await fetch(`${API_URL}/api/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const tokens = await refreshRes.json() as { accessToken: string; refreshToken: string };
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;

      // Retry original request
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retryRes = await fetch(`${API_URL}${path}`, { ...options, headers });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ error: 'Erro desconhecido' })) as { error: string };
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
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error: string };
    throw new Error(err.error);
  }

  return res.json() as Promise<T>;
}

// === Health ===
export function checkHealth() {
  return request<{ ok: boolean; configured: boolean }>('/api/health');
}

// === Setup ===
export function setupSystem(data: {
  topologia: 'solo' | 'escritorio';
  admin: {
    nome: string;
    email: string;
    senha: string;
    oabNumero?: string;
    oabSeccional?: string;
  };
}) {
  return request<{ ok: boolean; adminId: string }>('/api/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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
  return request<Array<{
    id: string;
    tipo: 'PF' | 'PJ';
    nome: string;
    cpfCnpj: string | null;
    email: string | null;
    telefone: string | null;
    createdAt: string;
  }>>(`/api/clientes${q}`);
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
  return request<Array<{
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
  }>>(`/api/processos${q}`);
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

export function excluirProcesso(id: string) {
  return request<{ ok: boolean }>(`/api/processos/${id}`, {
    method: 'DELETE',
  });
}

// === Usuarios ===
export function listarUsuarios() {
  return request<Array<{
    id: string;
    nome: string;
    email: string;
    oabNumero: string | null;
    oabSeccional: string | null;
    role: string | null;
    ativo: boolean;
    createdAt: string;
  }>>('/api/usuarios');
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

export function atualizarStatusHonorario(id: string, status: 'pendente' | 'recebido' | 'inadimplente') {
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
