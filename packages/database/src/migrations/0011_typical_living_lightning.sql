CREATE TABLE `contatos` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`tipo` text NOT NULL,
	`cpf_cnpj` text,
	`oab_numero` text,
	`oab_seccional` text,
	`email` text,
	`telefone` text,
	`whatsapp` text,
	`especialidade` text,
	`comarcas_atuacao` text,
	`endereco` text,
	`observacoes` text,
	`avaliacao` integer,
	`ativo` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `despesas` (
	`id` text PRIMARY KEY NOT NULL,
	`processo_id` text,
	`cliente_id` text,
	`tipo` text NOT NULL,
	`descricao` text NOT NULL,
	`valor` real NOT NULL,
	`data` text NOT NULL,
	`antecipado_por` text NOT NULL,
	`reembolsavel` integer DEFAULT true NOT NULL,
	`reembolsado` integer DEFAULT false NOT NULL,
	`data_reembolso` text,
	`comprovante_doc_id` text,
	`responsavel_id` text NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`processo_id`) REFERENCES `processos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`comprovante_doc_id`) REFERENCES `documentos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`responsavel_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kpi_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`processos_ativos` integer NOT NULL,
	`clientes` integer NOT NULL,
	`prazos_pendentes` integer NOT NULL,
	`prazos_fatais` integer NOT NULL,
	`tarefas_pendentes` integer NOT NULL,
	`movimentacoes_nao_lidas` integer NOT NULL,
	`honorarios_pendentes` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `parcelas` (
	`id` text PRIMARY KEY NOT NULL,
	`honorario_id` text NOT NULL,
	`numero_parcela` integer NOT NULL,
	`valor` real NOT NULL,
	`vencimento` text NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`data_pagamento` text,
	`valor_pago` real,
	`forma_pagamento` text,
	`comprovante_doc_id` text,
	`juros` real,
	`multa` real,
	`desconto` real,
	`observacoes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`honorario_id`) REFERENCES `honorarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`comprovante_doc_id`) REFERENCES `documentos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tarefas` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text,
	`processo_id` text,
	`cliente_id` text,
	`criado_por` text NOT NULL,
	`responsavel_id` text NOT NULL,
	`prioridade` text DEFAULT 'normal' NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`categoria` text,
	`data_limite` text,
	`data_conclusao` text,
	`tempo_estimado_min` integer,
	`tempo_gasto_min` integer,
	`observacoes` text,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`processo_id`) REFERENCES `processos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`criado_por`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`responsavel_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `timesheets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`processo_id` text,
	`cliente_id` text,
	`tarefa_id` text,
	`data` text NOT NULL,
	`duracao_minutos` integer NOT NULL,
	`descricao` text NOT NULL,
	`tipo_atividade` text NOT NULL,
	`faturavel` integer DEFAULT true NOT NULL,
	`taxa_horaria_aplicada` real,
	`valor_calculado` real,
	`aprovado` integer DEFAULT false NOT NULL,
	`aprovado_por` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`processo_id`) REFERENCES `processos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`aprovado_por`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_documentos` (
	`id` text PRIMARY KEY NOT NULL,
	`processo_id` text,
	`cliente_id` text,
	`nome` text NOT NULL,
	`descricao` text,
	`caminho_local` text,
	`tipo_mime` text NOT NULL,
	`tamanho_bytes` integer NOT NULL,
	`versao` integer DEFAULT 1 NOT NULL,
	`hash_sha256` text NOT NULL,
	`categoria` text,
	`tags` text,
	`confidencial` integer DEFAULT false NOT NULL,
	`data_referencia` text,
	`conteudo` text,
	`conteudo_texto` text,
	`drive_file_id` text,
	`drive_synced_at` text,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`processo_id`) REFERENCES `processos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_documentos`("id", "processo_id", "cliente_id", "nome", "descricao", "caminho_local", "tipo_mime", "tamanho_bytes", "versao", "hash_sha256", "categoria", "tags", "confidencial", "data_referencia", "conteudo", "conteudo_texto", "drive_file_id", "drive_synced_at", "uploaded_by", "created_at", "updated_at") SELECT "id", "processo_id", "cliente_id", "nome", "descricao", "caminho_local", "tipo_mime", "tamanho_bytes", "versao", "hash_sha256", "categoria", "tags", "confidencial", "data_referencia", "conteudo", "conteudo_texto", "drive_file_id", "drive_synced_at", "uploaded_by", "created_at", "updated_at" FROM `documentos`;--> statement-breakpoint
DROP TABLE `documentos`;--> statement-breakpoint
ALTER TABLE `__new_documentos` RENAME TO `documentos`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `users` ADD `oab_tipo` text;--> statement-breakpoint
ALTER TABLE `users` ADD `telefone` text;--> statement-breakpoint
ALTER TABLE `users` ADD `area_atuacao` text;--> statement-breakpoint
ALTER TABLE `users` ADD `especialidade` text;--> statement-breakpoint
ALTER TABLE `users` ADD `taxa_horaria` real;--> statement-breakpoint
ALTER TABLE `users` ADD `data_admissao` text;--> statement-breakpoint
ALTER TABLE `users` ADD `certificado_a1_validade` text;--> statement-breakpoint
ALTER TABLE `users` ADD `certificado_a3_configurado` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar_path` text;--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `nome_social` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `rg` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `rg_orgao_emissor` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `data_nascimento` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `nacionalidade` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `estado_civil` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `profissao` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `email_secundario` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `telefone_secundario` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `whatsapp` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `endereco_comercial` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `observacoes` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `origem_captacao` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `indicado_por` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `status_cliente` text DEFAULT 'ativo' NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` ADD `data_contrato` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `contato_preferencial` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `movimentacoes` ADD `teor` text;--> statement-breakpoint
ALTER TABLE `movimentacoes` ADD `urgente` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `movimentacoes` ADD `gera_prazo` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `movimentacoes` ADD `prazo_gerado_id` text;--> statement-breakpoint
ALTER TABLE `movimentacoes` ADD `link_externo` text;--> statement-breakpoint
ALTER TABLE `movimentacoes` ADD `lido_por` text;--> statement-breakpoint
ALTER TABLE `movimentacoes` ADD `lido_at` text;--> statement-breakpoint
ALTER TABLE `movimentacoes` ADD `documento_anexo_id` text;--> statement-breakpoint
ALTER TABLE `prazos` ADD `data_inicio` text;--> statement-breakpoint
ALTER TABLE `prazos` ADD `dias_prazo` integer;--> statement-breakpoint
ALTER TABLE `prazos` ADD `tipo_contagem` text;--> statement-breakpoint
ALTER TABLE `prazos` ADD `categoria_prazo` text;--> statement-breakpoint
ALTER TABLE `prazos` ADD `prioridade` text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `prazos` ADD `fatal` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `prazos` ADD `suspenso` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `prazos` ADD `motivo_suspensao` text;--> statement-breakpoint
ALTER TABLE `prazos` ADD `data_suspensao` text;--> statement-breakpoint
ALTER TABLE `prazos` ADD `data_retomada` text;--> statement-breakpoint
ALTER TABLE `prazos` ADD `responsaveis_secundarios` text;--> statement-breakpoint
ALTER TABLE `prazos` ADD `observacoes` text;--> statement-breakpoint
ALTER TABLE `prazos` ADD `data_cumprimento` text;--> statement-breakpoint
ALTER TABLE `prazos` ADD `cumprido_por` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `numero_antigo` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `cliente_qualidade` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `advogados_secundarios` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `grau` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `comarca` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `vara` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `juiz` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `classe_processual` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `classe_descricao` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `assunto_principal` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `assunto_descricao` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `subarea` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `rito` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `prioridade` text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `processos` ADD `segredo_justica` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `processos` ADD `justica_gratuita` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `processos` ADD `valor_condenacao` real;--> statement-breakpoint
ALTER TABLE `processos` ADD `data_distribuicao` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `data_transito_julgado` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `data_encerramento` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `processo_relacionado_id` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `tipo_relacao` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `observacoes` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `advogado_contrario` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `oab_contrario` text;--> statement-breakpoint
ALTER TABLE `processos` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `honorarios` ADD `descricao` text;--> statement-breakpoint
ALTER TABLE `honorarios` ADD `valor_base_exito` real;--> statement-breakpoint
ALTER TABLE `honorarios` ADD `parcelamento` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `honorarios` ADD `numero_parcelas` integer;--> statement-breakpoint
ALTER TABLE `honorarios` ADD `contrato_documento_id` text;--> statement-breakpoint
ALTER TABLE `honorarios` ADD `indice_correcao` text;--> statement-breakpoint
ALTER TABLE `honorarios` ADD `observacoes` text;--> statement-breakpoint
ALTER TABLE `honorarios` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `agenda` ADD `descricao` text;--> statement-breakpoint
ALTER TABLE `agenda` ADD `dia_inteiro` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `agenda` ADD `cliente_id` text REFERENCES clientes(id);--> statement-breakpoint
ALTER TABLE `agenda` ADD `link_videoconferencia` text;--> statement-breakpoint
ALTER TABLE `agenda` ADD `cor` text;--> statement-breakpoint
ALTER TABLE `agenda` ADD `recorrencia` text;--> statement-breakpoint
ALTER TABLE `agenda` ADD `lembretes` text;--> statement-breakpoint
ALTER TABLE `agenda` ADD `status_agenda` text DEFAULT 'agendado' NOT NULL;--> statement-breakpoint
ALTER TABLE `agenda` ADD `resultado` text;--> statement-breakpoint
ALTER TABLE `agenda` ADD `criado_por` text REFERENCES users(id);