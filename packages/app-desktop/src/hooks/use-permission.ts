import { useCallback } from 'react';
import { useAuth } from '../lib/auth-context';

/**
 * Hook para verificar permissões RBAC do usuário autenticado.
 *
 * Uso:
 *   const { can, canAny, canAll } = usePermission();
 *   if (can('processos:criar')) { ... }
 */
export function usePermission() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];

  const can = useCallback(
    (permission: string): boolean => permissions.includes(permission),
    [permissions],
  );

  const canAny = useCallback(
    (perms: string[]): boolean => perms.some((p) => permissions.includes(p)),
    [permissions],
  );

  const canAll = useCallback(
    (perms: string[]): boolean => perms.every((p) => permissions.includes(p)),
    [permissions],
  );

  return { can, canAny, canAll, permissions };
}
