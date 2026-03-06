export const SYSTEM_ROLES = [
  'admin',
  'socio',
  'advogado',
  'estagiario',
  'secretaria',
  'financeiro',
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export interface Role {
  id: string;
  nome: string;
  descricao: string;
  isSystemRole: boolean;
}

export type Recurso =
  | 'processos'
  | 'clientes'
  | 'financeiro'
  | 'conectores'
  | 'usuarios'
  | 'licenca'
  | 'relatorios'
  | 'agenda'
  | 'tema';

export type Acao =
  | 'criar'
  | 'ler_todos'
  | 'ler_proprios'
  | 'editar'
  | 'excluir'
  | 'executar'
  | 'gerenciar'
  | 'gerenciar_todos'
  | 'alternar';

export interface Permission {
  id: string;
  recurso: Recurso;
  acao: Acao;
  descricao: string;
}

export type PermissionKey = `${Recurso}:${Acao}`;

/**
 * Matriz de permissões padrão por papel do sistema.
 * true = permitido, false = negado
 */
export const DEFAULT_PERMISSIONS: Record<SystemRole, PermissionKey[]> = {
  admin: [
    'processos:criar',
    'processos:ler_todos',
    'processos:ler_proprios',
    'processos:editar',
    'processos:excluir',
    'conectores:executar',
    'financeiro:ler_todos',
    'financeiro:editar',
    'clientes:criar',
    'clientes:ler_todos',
    'usuarios:gerenciar',
    'licenca:gerenciar',
    'relatorios:gerenciar',
    'agenda:gerenciar_todos',
    'tema:alternar',
  ],
  socio: [
    'processos:criar',
    'processos:ler_todos',
    'processos:ler_proprios',
    'processos:editar',
    'processos:excluir',
    'conectores:executar',
    'financeiro:ler_todos',
    'financeiro:editar',
    'clientes:criar',
    'clientes:ler_todos',
    'relatorios:gerenciar',
    'agenda:gerenciar_todos',
    'tema:alternar',
  ],
  advogado: [
    'processos:criar',
    'processos:ler_proprios',
    'processos:editar',
    'conectores:executar',
    'financeiro:ler_proprios',
    'clientes:criar',
    'clientes:ler_todos',
    'tema:alternar',
  ],
  estagiario: [
    'processos:ler_proprios',
    'clientes:ler_todos',
    'tema:alternar',
  ],
  secretaria: [
    'processos:ler_todos',
    'processos:ler_proprios',
    'clientes:criar',
    'clientes:ler_todos',
    'agenda:gerenciar_todos',
    'tema:alternar',
  ],
  financeiro: [
    'processos:ler_todos',
    'processos:ler_proprios',
    'financeiro:ler_todos',
    'financeiro:editar',
    'clientes:ler_todos',
    'relatorios:gerenciar',
    'tema:alternar',
  ],
};
