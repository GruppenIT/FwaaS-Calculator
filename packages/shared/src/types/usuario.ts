export interface Usuario {
  id: string;
  nome: string;
  email: string;
  oabNumero: string | null;
  oabSeccional: string | null;
  roleId: string;
  certificadoA1Path: string | null;
  ativo: boolean;
  createdAt: Date;
}

export interface UsuarioCriacao {
  nome: string;
  email: string;
  senha: string;
  oabNumero?: string;
  oabSeccional?: string;
  roleId: string;
}
