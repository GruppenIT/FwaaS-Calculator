import type { PermissionKey } from '@causa/shared';
import type { AuthService } from './auth';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export class RbacService {
  private permissionCache = new Map<string, Set<string>>();

  constructor(private authService: AuthService) {}

  /**
   * Verifica se o usuário tem a permissão especificada.
   * Resultado é cacheado por sessão para evitar queries repetidas.
   */
  async checkPermission(user: AuthenticatedUser, permission: PermissionKey): Promise<boolean> {
    const perms = await this.getUserPermissionSet(user.id);
    return perms.has(permission);
  }

  /**
   * Verifica se o usuário tem TODAS as permissões listadas.
   */
  async checkAllPermissions(user: AuthenticatedUser, requiredPermissions: PermissionKey[]): Promise<boolean> {
    const perms = await this.getUserPermissionSet(user.id);
    return requiredPermissions.every((p) => perms.has(p));
  }

  /**
   * Verifica se o usuário tem PELO MENOS UMA das permissões listadas.
   */
  async checkAnyPermission(user: AuthenticatedUser, requiredPermissions: PermissionKey[]): Promise<boolean> {
    const perms = await this.getUserPermissionSet(user.id);
    return requiredPermissions.some((p) => perms.has(p));
  }

  /**
   * Retorna todas as permissões do usuário como array.
   */
  async listPermissions(user: AuthenticatedUser): Promise<string[]> {
    return Array.from(await this.getUserPermissionSet(user.id));
  }

  /**
   * Limpa o cache de permissões (chamar após mudança de papel/permissões).
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.permissionCache.delete(userId);
    } else {
      this.permissionCache.clear();
    }
  }

  private async getUserPermissionSet(userId: string): Promise<Set<string>> {
    const cached = this.permissionCache.get(userId);
    if (cached) return cached;

    const perms = new Set(await this.authService.getUserPermissions(userId));
    this.permissionCache.set(userId, perms);
    return perms;
  }
}
