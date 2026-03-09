CREATE TABLE IF NOT EXISTS timesheets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  processo_id TEXT REFERENCES processos(id),
  cliente_id TEXT REFERENCES clientes(id),
  tarefa_id TEXT REFERENCES tarefas(id),
  data TEXT NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  tipo_atividade TEXT NOT NULL DEFAULT 'outro',
  faturavel INTEGER NOT NULL DEFAULT 1,
  taxa_horaria_aplicada REAL,
  valor_calculado REAL,
  aprovado INTEGER NOT NULL DEFAULT 0,
  aprovado_por TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
