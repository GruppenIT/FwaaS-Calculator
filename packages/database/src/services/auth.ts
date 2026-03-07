import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import type { CausaDatabase, DatabaseQueryBuilder } from '../client.js';
import type { CausaSchema } from '../schema-provider.js';

const BCRYPT_COST = 12;
const JWT_EXPIRY = '8h';
const REFRESH_EXPIRY = '7d';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CreateUserInput {
  nome: string;
  email: string;
  senha: string;
  oabNumero?: string;
  oabSeccional?: string;
  roleId: string;
}

export class AuthService {
  private users;
  private roles;
  private rolePermissions;
  private permissions;

  constructor(
    private db: CausaDatabase,
    private jwtSecret: string,
    schema: CausaSchema,
  ) {
    this.users = schema.users;
    this.roles = schema.roles;
    this.rolePermissions = schema.rolePermissions;
    this.permissions = schema.permissions;
  }

  async hashPassword(senha: string): Promise<string> {
    return bcrypt.hash(senha, BCRYPT_COST);
  }

  async verifyPassword(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }

  async createUser(input: CreateUserInput): Promise<string> {
    const [existing] = await (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.users)
      .where(eq(this.users.email, input.email));
    if (existing) {
      throw new Error('Email já cadastrado.');
    }

    const id = uuid();
    const senhaHash = await this.hashPassword(input.senha);

    await (this.db as unknown as DatabaseQueryBuilder).insert(this.users).values({
      id,
      nome: input.nome,
      email: input.email,
      senhaHash,
      oabNumero: input.oabNumero ?? null,
      oabSeccional: input.oabSeccional ?? null,
      roleId: input.roleId,
      ativo: true,
    });

    return id;
  }

  async login(email: string, senha: string): Promise<AuthTokens> {
    const [user] = await (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.users)
      .where(eq(this.users.email, email));

    if (!user) {
      throw new Error('Credenciais inválidas.');
    }

    if (!user.ativo) {
      throw new Error('Usuário desativado.');
    }

    const valid = await this.verifyPassword(senha, user.senhaHash);
    if (!valid) {
      throw new Error('Credenciais inválidas.');
    }

    // Buscar nome do papel
    const [role] = await (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.roles)
      .where(eq(this.roles.id, user.roleId));

    return this.generateTokens(user.id, user.email, role?.nome ?? 'unknown');
  }

  generateTokens(userId: string, email: string, role: string): AuthTokens {
    const accessToken = jwt.sign({ sub: userId, email, role, jti: uuid() }, this.jwtSecret, {
      expiresIn: JWT_EXPIRY,
    });

    const refreshToken = jwt.sign({ sub: userId, type: 'refresh', jti: uuid() }, this.jwtSecret, {
      expiresIn: REFRESH_EXPIRY,
    });

    return { accessToken, refreshToken };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch {
      throw new Error('Token inválido ou expirado.');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string; type?: string };
    try {
      payload = jwt.verify(refreshToken, this.jwtSecret) as { sub: string; type?: string };
    } catch {
      throw new Error('Refresh token inválido ou expirado.');
    }

    if (payload.type !== 'refresh') {
      throw new Error('Token fornecido não é um refresh token.');
    }

    const [user] = await (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.users)
      .where(eq(this.users.id, payload.sub));
    if (!user || !user.ativo) {
      throw new Error('Usuário não encontrado ou desativado.');
    }

    const [role] = await (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.roles)
      .where(eq(this.roles.id, user.roleId));
    return this.generateTokens(user.id, user.email, role?.nome ?? 'unknown');
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const [user] = await (this.db as unknown as DatabaseQueryBuilder)
      .select()
      .from(this.users)
      .where(eq(this.users.id, userId));
    if (!user) return [];

    const results = await (this.db as unknown as DatabaseQueryBuilder)
      .select({
        recurso: this.permissions.recurso,
        acao: this.permissions.acao,
      })
      .from(this.rolePermissions)
      .innerJoin(this.permissions, eq(this.rolePermissions.permissionId, this.permissions.id))
      .where(eq(this.rolePermissions.roleId, user.roleId));

    return results.map((r: { recurso: string; acao: string }) => `${r.recurso}:${r.acao}`);
  }
}
