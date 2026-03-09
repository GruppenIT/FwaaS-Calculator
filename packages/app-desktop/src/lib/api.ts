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
      { cause: networkErr },
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
      const isAlreadyConfigured = err instanceof Error && err.message.includes('já configurado');

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
export interface EnderecoJson {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  pais?: string;
}

export interface ClienteData {
  id: string;
  tipo: 'PF' | 'PJ';
  nome: string;
  nomeSocial: string | null;
  cpfCnpj: string | null;
  rg: string | null;
  rgOrgaoEmissor: string | null;
  dataNascimento: string | null;
  nacionalidade: string | null;
  estadoCivil: string | null;
  profissao: string | null;
  email: string | null;
  emailSecundario: string | null;
  telefone: string | null;
  telefoneSecundario: string | null;
  whatsapp: string | null;
  endereco: EnderecoJson | null;
  enderecoComercial: EnderecoJson | null;
  observacoes: string | null;
  origemCaptacao: string | null;
  indicadoPor: string | null;
  statusCliente: string;
  dataContrato: string | null;
  contatoPreferencial: string | null;
  tags: string[] | null;
  createdBy: string;
  updatedAt: string | null;
  createdAt: string;
}

export type CreateClienteData = {
  tipo: 'PF' | 'PJ';
  nome: string;
  nomeSocial?: string;
  cpfCnpj?: string;
  rg?: string;
  rgOrgaoEmissor?: string;
  dataNascimento?: string;
  nacionalidade?: string;
  estadoCivil?: string;
  profissao?: string;
  email?: string;
  emailSecundario?: string;
  telefone?: string;
  telefoneSecundario?: string;
  whatsapp?: string;
  endereco?: EnderecoJson;
  enderecoComercial?: EnderecoJson;
  observacoes?: string;
  origemCaptacao?: string;
  indicadoPor?: string;
  statusCliente?: string;
  dataContrato?: string;
  contatoPreferencial?: string;
  tags?: string[];
};

export function listarClientes(busca?: string) {
  const q = busca ? `?q=${encodeURIComponent(busca)}` : '';
  return request<ClienteData[]>(`/api/clientes${q}`);
}

export function obterCliente(id: string) {
  return request<ClienteData>(`/api/clientes/${id}`);
}

export function criarCliente(data: CreateClienteData) {
  return request<{ id: string }>('/api/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarCliente(id: string, data: Partial<CreateClienteData>) {
  return request<{ ok: boolean }>(`/api/clientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function excluirCliente(id: string) {
  return request<{ ok: boolean }>(`/api/clientes/${id}`, {
    method: 'DELETE',
  });
}

// === Processos ===
export interface ProcessoListRow {
  id: string;
  numeroCnj: string;
  clienteNome: string | null;
  advogadoNome: string | null;
  tribunalSigla: string;
  plataforma: string;
  area: string;
  fase: string;
  status: string;
  grau: string | null;
  comarca: string | null;
  prioridade: string;
  valorCausa: number | null;
  ultimoSyncAt: string | null;
  createdAt: string;
}

export interface ProcessoDetail {
  id: string;
  numeroCnj: string;
  numeroAntigo: string | null;
  clienteId: string | null;
  clienteQualidade: string | null;
  advogadoResponsavelId: string | null;
  advogadosSecundarios: string[] | null;
  tribunalSigla: string;
  plataforma: string;
  area: string;
  fase: string;
  status: string;
  grau: string | null;
  comarca: string | null;
  vara: string | null;
  juiz: string | null;
  classeProcessual: string | null;
  classeDescricao: string | null;
  assuntoPrincipal: string | null;
  assuntoDescricao: string | null;
  subarea: string | null;
  rito: string | null;
  prioridade: string;
  segredoJustica: boolean;
  justicaGratuita: boolean;
  poloAtivo: Array<{ nome: string; cpfCnpj?: string; tipo: string }> | null;
  poloPassivo: Array<{ nome: string; cpfCnpj?: string; tipo: string }> | null;
  valorCausa: number | null;
  valorCondenacao: number | null;
  dataDistribuicao: string | null;
  dataTransitoJulgado: string | null;
  dataEncerramento: string | null;
  processoRelacionadoId: string | null;
  tipoRelacao: string | null;
  tags: string[] | null;
  observacoes: string | null;
  advogadoContrario: string | null;
  oabContrario: string | null;
  ultimoSyncAt: string | null;
  updatedAt: string | null;
  createdAt: string;
}

export function listarProcessos(busca?: string) {
  const q = busca ? `?q=${encodeURIComponent(busca)}` : '';
  return request<ProcessoListRow[]>(`/api/processos${q}`);
}

export function obterProcesso(id: string) {
  return request<ProcessoDetail>(`/api/processos/${id}`);
}

export function listarPrazosDoProcesso(processoId: string) {
  return request<PrazoRow[]>(`/api/processos/${processoId}/prazos`);
}

export function listarHonorariosDoProcesso(processoId: string) {
  return request<HonorarioRow[]>(`/api/processos/${processoId}/honorarios`);
}

export function criarProcesso(data: Record<string, unknown>) {
  return request<{ id: string }>('/api/processos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarProcesso(id: string, data: Record<string, unknown>) {
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

// === Movimentações ===
export interface MovimentacaoRow {
  id: string;
  processoId: string;
  dataMovimento: string;
  descricao: string;
  teor: string | null;
  tipo: string;
  origem: string;
  lido: boolean;
  urgente: boolean;
  geraPrazo: boolean;
  linkExterno: string | null;
  lidoPor: string | null;
  lidoAt: string | null;
  createdAt: string;
}

export function listarMovimentacoes(processoId: string) {
  return request<MovimentacaoRow[]>(`/api/processos/${processoId}/movimentacoes`);
}

export function criarMovimentacao(
  processoId: string,
  data: {
    dataMovimento: string;
    descricao: string;
    teor?: string;
    tipo: string;
    origem: string;
    urgente?: boolean;
    geraPrazo?: boolean;
    linkExterno?: string;
  },
) {
  return request<{ id: string }>(`/api/processos/${processoId}/movimentacoes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarMovimentacao(id: string, data: Record<string, unknown>) {
  return request<{ ok: boolean }>(`/api/movimentacoes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function excluirMovimentacao(id: string) {
  return request<{ ok: boolean }>(`/api/movimentacoes/${id}`, {
    method: 'DELETE',
  });
}

// === Usuarios ===
export interface UsuarioRow {
  id: string;
  nome: string;
  email: string;
  oabNumero: string | null;
  oabSeccional: string | null;
  oabTipo: string | null;
  telefone: string | null;
  role: string | null;
  areaAtuacao: string | null;
  especialidade: string | null;
  taxaHoraria: number | null;
  dataAdmissao: string | null;
  certificadoA1Validade: string | null;
  certificadoA3Configurado: boolean;
  ativo: boolean;
  createdAt: string;
}

export function listarUsuarios() {
  return request<UsuarioRow[]>('/api/usuarios');
}

export function criarUsuario(data: {
  nome: string;
  email: string;
  senha: string;
  role: string;
  oabNumero?: string;
  oabSeccional?: string;
  oabTipo?: string;
  telefone?: string;
  areaAtuacao?: string;
  especialidade?: string;
  taxaHoraria?: number;
  dataAdmissao?: string;
}) {
  return request<{ id: string }>('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarUsuario(id: string, data: Record<string, unknown>) {
  return request<{ ok: boolean }>(`/api/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function desativarUsuario(id: string) {
  return request<{ ok: boolean }>(`/api/usuarios/${id}`, {
    method: 'DELETE',
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
  tipo: string;
  descricao: string | null;
  valor: number;
  valorBaseExito: number | null;
  percentualExito: number | null;
  parcelamento: boolean;
  numeroParcelas: number | null;
  status: string;
  vencimento: string | null;
  indiceCorrecao: string | null;
  observacoes: string | null;
  createdAt: string;
}

export function listarHonorarios() {
  return request<HonorarioRow[]>('/api/honorarios');
}

export function criarHonorario(data: Record<string, unknown>) {
  return request<{ id: string }>('/api/honorarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarHonorario(id: string, data: Record<string, unknown>) {
  return request<{ ok: boolean }>(`/api/honorarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** @deprecated Use atualizarHonorario instead */
export function atualizarStatusHonorario(
  id: string,
  status: 'pendente' | 'recebido' | 'inadimplente',
) {
  return atualizarHonorario(id, { status });
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
  descricao: string | null;
  tipo: string;
  dataHoraInicio: string;
  dataHoraFim: string | null;
  diaInteiro: boolean;
  processoId: string | null;
  numeroCnj: string | null;
  participantes: string[] | null;
  local: string | null;
  linkVideoconferencia: string | null;
  cor: string | null;
  statusAgenda: string;
  resultado: string | null;
  createdAt: string;
}

export function listarAgenda(inicio?: string, fim?: string) {
  const params = new URLSearchParams();
  if (inicio) params.set('inicio', inicio);
  if (fim) params.set('fim', fim);
  const q = params.toString();
  return request<AgendaRow[]>(`/api/agenda${q ? `?${q}` : ''}`);
}

export function criarEvento(data: Record<string, unknown>) {
  return request<{ id: string }>('/api/agenda', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarEvento(id: string, data: Record<string, unknown>) {
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
  dataInicio: string | null;
  diasPrazo: number | null;
  tipoContagem: string | null;
  tipoPrazo: string;
  categoriaPrazo: string | null;
  prioridade: string;
  fatal: boolean;
  status: string;
  suspenso: boolean;
  responsavelId: string;
  responsavelNome: string | null;
  observacoes: string | null;
  dataCumprimento: string | null;
  alertasEnviados: { dias: number[]; enviados: string[] } | null;
}

export function listarPrazos(filtros?: { status?: string; responsavelId?: string }) {
  const params = new URLSearchParams();
  if (filtros?.status) params.set('status', filtros.status);
  if (filtros?.responsavelId) params.set('responsavelId', filtros.responsavelId);
  const q = params.toString();
  return request<PrazoRow[]>(`/api/prazos${q ? `?${q}` : ''}`);
}

export function criarPrazo(data: Record<string, unknown>) {
  return request<{ id: string }>('/api/prazos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarPrazo(id: string, data: Record<string, unknown>) {
  return request<{ ok: boolean }>(`/api/prazos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** @deprecated Use atualizarPrazo instead */
export function atualizarStatusPrazo(id: string, status: 'pendente' | 'cumprido' | 'perdido') {
  return atualizarPrazo(id, { status });
}

export function excluirPrazo(id: string) {
  return request<{ ok: boolean }>(`/api/prazos/${id}`, {
    method: 'DELETE',
  });
}

// === Feature flags ===
export interface AppFeatures {
  financeiro: boolean;
}

export function getFeatures() {
  return request<AppFeatures>('/api/features');
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
