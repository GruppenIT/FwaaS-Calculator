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
  | 'tarefas'
  | 'documentos'
  | 'tema';

export type Acao =
  | 'criar'
  | 'ler_todos'
  | 'ler_proprios'
  | 'editar'
  | 'editar_todos'
  | 'excluir'
  | 'executar'
  | 'gerenciar'
  | 'gerenciar_todos'
  | 'upload'
  | 'confidencial'
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
    'clientes:editar',
    'clientes:excluir',
    'usuarios:gerenciar',
    'licenca:gerenciar',
    'relatorios:gerenciar',
    'agenda:gerenciar_todos',
    'tarefas:criar',
    'tarefas:ler_todos',
    'tarefas:ler_proprios',
    'tarefas:editar_todos',
    'documentos:upload',
    'documentos:ler_todos',
    'documentos:confidencial',
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
    'clientes:editar',
    'clientes:excluir',
    'relatorios:gerenciar',
    'agenda:gerenciar_todos',
    'tarefas:criar',
    'tarefas:ler_todos',
    'tarefas:ler_proprios',
    'tarefas:editar_todos',
    'documentos:upload',
    'documentos:ler_todos',
    'documentos:confidencial',
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
    'clientes:editar',
    'tarefas:criar',
    'tarefas:ler_proprios',
    'documentos:upload',
    'documentos:ler_todos',
    'tema:alternar',
  ],
  estagiario: [
    'processos:ler_proprios',
    'clientes:ler_todos',
    'tarefas:criar',
    'tarefas:ler_proprios',
    'documentos:upload',
    'documentos:ler_todos',
    'tema:alternar',
  ],
  secretaria: [
    'processos:ler_todos',
    'processos:ler_proprios',
    'clientes:criar',
    'clientes:ler_todos',
    'clientes:editar',
    'agenda:gerenciar_todos',
    'tarefas:criar',
    'tarefas:ler_todos',
    'tarefas:ler_proprios',
    'documentos:upload',
    'documentos:ler_todos',
    'tema:alternar',
  ],
  financeiro: [
    'processos:ler_todos',
    'processos:ler_proprios',
    'financeiro:ler_todos',
    'financeiro:editar',
    'clientes:ler_todos',
    'relatorios:gerenciar',
    'documentos:ler_todos',
    'tema:alternar',
  ],
};
