import { v4 as uuid } from 'uuid';
import { createDatabase, type SqliteDatabase } from '../client.js';
import { roles, permissions, rolePermissions } from '../schema/index.js';
import { DEFAULT_PERMISSIONS, SYSTEM_ROLES, type PermissionKey } from '@causa/shared';

const db = createDatabase({
  topologia: 'solo',
  sqlitePath: 'causa-dev.db',
}) as SqliteDatabase;

console.log('Iniciando seed de papéis e permissões...');

// Descrições dos papéis
const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Sócio administrador. Acesso total. Gerencia usuários, licença e configurações.',
  socio: 'Sócio sem privilégios de admin. Acesso total a todos os processos e financeiro.',
  advogado:
    'Acesso pleno a processos próprios. Leitura de processos da equipe. Sem acesso a financeiro de terceiros.',
  estagiario: 'Leitura de processos atribuídos. Sem peticionamento. Sem acesso financeiro.',
  secretaria: 'Gestão de agenda, clientes, documentos. Sem acesso a financeiro nem conectores.',
  financeiro: 'Acesso exclusivo ao módulo financeiro. Leitura de processos (sem movimentações).',
};

// 1. Criar papéis
const roleMap = new Map<string, string>();

for (const roleName of SYSTEM_ROLES) {
  const id = uuid();
  roleMap.set(roleName, id);

  db.insert(roles)
    .values({
      id,
      nome: roleName,
      descricao: ROLE_DESCRIPTIONS[roleName] ?? '',
      isSystemRole: true,
    })
    .onConflictDoNothing()
    .run();
}

console.log(`  ✓ ${SYSTEM_ROLES.length} papéis criados`);

// 2. Criar permissões únicas
const allPermissionKeys = new Set<PermissionKey>();
for (const roleName of SYSTEM_ROLES) {
  for (const p of DEFAULT_PERMISSIONS[roleName]) {
    allPermissionKeys.add(p);
  }
}

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  'processos:criar': 'Criar novos processos',
  'processos:ler_todos': 'Visualizar todos os processos do escritório',
  'processos:ler_proprios': 'Visualizar processos onde é responsável ou participante',
  'processos:editar': 'Editar dados de processos',
  'processos:excluir': 'Excluir processos',
  'conectores:executar': 'Executar conectores de tribunal manualmente',
  'financeiro:ler_todos': 'Visualizar dados financeiros de todos',
  'financeiro:ler_proprios': 'Visualizar dados financeiros próprios',
  'financeiro:editar': 'Editar dados financeiros',
  'clientes:criar': 'Cadastrar novos clientes',
  'clientes:ler_todos': 'Visualizar todos os clientes',
  'clientes:editar': 'Editar dados de clientes',
  'clientes:excluir': 'Excluir clientes',
  'usuarios:gerenciar': 'Gerenciar usuários do sistema',
  'licenca:gerenciar': 'Gerenciar licença do software',
  'relatorios:gerenciar': 'Acessar relatórios financeiros',
  'agenda:gerenciar_todos': 'Gerenciar agenda de todos os usuários',
  'tema:alternar': 'Alternar entre modo claro e escuro',
};

const permissionMap = new Map<PermissionKey, string>();

for (const key of allPermissionKeys) {
  const [recurso, acao] = key.split(':') as [string, string];
  const id = uuid();
  permissionMap.set(key, id);

  db.insert(permissions)
    .values({
      id,
      recurso,
      acao,
      descricao: PERMISSION_DESCRIPTIONS[key] ?? `${recurso} — ${acao}`,
    })
    .onConflictDoNothing()
    .run();
}

console.log(`  ✓ ${allPermissionKeys.size} permissões criadas`);

// 3. Vincular papéis ↔ permissões
let vinculacoes = 0;

for (const roleName of SYSTEM_ROLES) {
  const roleId = roleMap.get(roleName);
  if (!roleId) continue;

  for (const permKey of DEFAULT_PERMISSIONS[roleName]) {
    const permissionId = permissionMap.get(permKey);
    if (!permissionId) continue;

    db.insert(rolePermissions).values({ roleId, permissionId }).onConflictDoNothing().run();
    vinculacoes++;
  }
}

console.log(`  ✓ ${vinculacoes} vinculações papel↔permissão criadas`);
console.log('Seed concluído com sucesso.');
