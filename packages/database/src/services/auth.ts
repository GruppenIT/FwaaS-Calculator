import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import type { CausaDatabase } from '../client';
import { users } from '../schema/usuarios';
import { roles, rolePermissions, permissions } from '../schema/rbac';

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
  constructor(
    private db: CausaDatabase,
    private jwtSecret: string,
  ) {}

  async hashPassword(senha: string): Promise<string> {
    return bcrypt.hash(senha, BCRYPT_COST);
  }

  async verifyPassword(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }

  async createUser(input: CreateUserInput): Promise<string> {
    const existing = this.db.select().from(users).where(eq(users.email, input.email)).get();
    if (existing) {
      throw new Error('Email já cadastrado.');
    }

    const id = uuid();
    const senhaHash = await this.hashPassword(input.senha);

    this.db
      .insert(users)
      .values({
        id,
        nome: input.nome,
        email: input.email,
        senhaHash,
        oabNumero: input.oabNumero ?? null,
        oabSeccional: input.oabSeccional ?? null,
        roleId: input.roleId,
        ativo: true,
      })
      .run();

    return id;
  }

  async login(email: string, senha: string): Promise<AuthTokens> {
    const user = this.db.select().from(users).where(eq(users.email, email)).get();

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
    const role = this.db.select().from(roles).where(eq(roles.id, user.roleId)).get();

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

  refreshAccessToken(refreshToken: string): AuthTokens {
    let payload: { sub: string; type?: string };
    try {
      payload = jwt.verify(refreshToken, this.jwtSecret) as { sub: string; type?: string };
    } catch {
      throw new Error('Refresh token inválido ou expirado.');
    }

    if (payload.type !== 'refresh') {
      throw new Error('Token fornecido não é um refresh token.');
    }

    const user = this.db.select().from(users).where(eq(users.id, payload.sub)).get();
    if (!user || !user.ativo) {
      throw new Error('Usuário não encontrado ou desativado.');
    }

    const role = this.db.select().from(roles).where(eq(roles.id, user.roleId)).get();
    return this.generateTokens(user.id, user.email, role?.nome ?? 'unknown');
  }

  getUserPermissions(userId: string): string[] {
    const user = this.db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return [];

    const results = this.db
      .select({
        recurso: permissions.recurso,
        acao: permissions.acao,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId))
      .all();

    return results.map((r) => `${r.recurso}:${r.acao}`);
  }
}
