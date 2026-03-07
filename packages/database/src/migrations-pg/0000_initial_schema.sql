CREATE TABLE IF NOT EXISTS "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"recurso" text NOT NULL,
	"acao" text NOT NULL,
	"descricao" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"descricao" text NOT NULL,
	"is_system_role" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roles_nome_unique" ON "roles" ("nome");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	PRIMARY KEY("role_id", "permission_id"),
	FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"oab_numero" text,
	"oab_seccional" text,
	"role_id" text NOT NULL,
	"certificado_a1_path" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clientes" (
	"id" text PRIMARY KEY NOT NULL,
	"tipo" text NOT NULL,
	"nome" text NOT NULL,
	"cpf_cnpj" text,
	"email" text,
	"telefone" text,
	"endereco" jsonb,
	"created_by" text NOT NULL,
	"created_at" text NOT NULL,
	FOREIGN KEY ("created_by") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "clientes_cpf_cnpj_unique" ON "clientes" ("cpf_cnpj");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "processos" (
	"id" text PRIMARY KEY NOT NULL,
	"numero_cnj" text NOT NULL,
	"cliente_id" text NOT NULL,
	"advogado_responsavel_id" text NOT NULL,
	"tribunal_sigla" text NOT NULL,
	"plataforma" text NOT NULL,
	"area" text NOT NULL,
	"fase" text NOT NULL,
	"status" text DEFAULT 'ativo' NOT NULL,
	"polo_ativo" jsonb,
	"polo_passivo" jsonb,
	"valor_causa" double precision,
	"ultimo_sync_at" text,
	"created_at" text NOT NULL,
	FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("advogado_responsavel_id") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "processos_numero_cnj_unique" ON "processos" ("numero_cnj");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movimentacoes" (
	"id" text PRIMARY KEY NOT NULL,
	"processo_id" text NOT NULL,
	"data_movimento" text NOT NULL,
	"descricao" text NOT NULL,
	"tipo" text NOT NULL,
	"origem" text NOT NULL,
	"lido" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prazos" (
	"id" text PRIMARY KEY NOT NULL,
	"processo_id" text NOT NULL,
	"movimentacao_id" text,
	"descricao" text NOT NULL,
	"data_fatal" text NOT NULL,
	"tipo_prazo" text NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"responsavel_id" text NOT NULL,
	"alertas_enviados" jsonb,
	FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("movimentacao_id") REFERENCES "movimentacoes"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "honorarios" (
	"id" text PRIMARY KEY NOT NULL,
	"processo_id" text,
	"cliente_id" text,
	"tipo" text NOT NULL,
	"valor" double precision NOT NULL,
	"percentual_exito" double precision,
	"status" text DEFAULT 'pendente' NOT NULL,
	"vencimento" text,
	"created_at" text NOT NULL,
	FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agenda" (
	"id" text PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"tipo" text NOT NULL,
	"data_hora_inicio" text NOT NULL,
	"data_hora_fim" text,
	"processo_id" text,
	"participantes" jsonb,
	"local" text,
	"created_at" text NOT NULL,
	FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documentos" (
	"id" text PRIMARY KEY NOT NULL,
	"processo_id" text,
	"cliente_id" text,
	"nome" text NOT NULL,
	"caminho_local" text NOT NULL,
	"tipo_mime" text NOT NULL,
	"tamanho_bytes" integer NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"hash_sha256" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" text NOT NULL,
	FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON UPDATE no action ON DELETE no action,
	FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "connector_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"processo_id" text NOT NULL,
	"conector_nome" text NOT NULL,
	"maquina_hostname" text NOT NULL,
	"status" text NOT NULL,
	"detalhes" jsonb,
	"duracao_ms" integer NOT NULL,
	"executado_at" text NOT NULL,
	FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "licencas" (
	"id" text PRIMARY KEY NOT NULL,
	"chave_licenca" text NOT NULL,
	"plano" text NOT NULL,
	"seats_contratados" integer DEFAULT 1 NOT NULL,
	"validade_ate" text NOT NULL,
	"features_ativas" jsonb
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "licencas_chave_licenca_unique" ON "licencas" ("chave_licenca");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"acao" text NOT NULL,
	"recurso" text NOT NULL,
	"recurso_id" text,
	"payload_anterior" jsonb,
	"created_at" text NOT NULL,
	FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
);
