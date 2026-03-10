-- SQLite não suporta ALTER COLUMN, então recriamos a tabela
-- para tornar caminho_local nullable (conteúdo agora fica em base64 na coluna conteudo)

CREATE TABLE `documentos_new` (
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
	`confidencial` integer NOT NULL DEFAULT 0,
	`data_referencia` text,
	`conteudo` text,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`processo_id`) REFERENCES `processos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `documentos_new`
  SELECT `id`, `processo_id`, `cliente_id`, `nome`, `descricao`, `caminho_local`,
         `tipo_mime`, `tamanho_bytes`, `versao`, `hash_sha256`, `categoria`, `tags`,
         `confidencial`, `data_referencia`, `conteudo`, `uploaded_by`, `created_at`, `updated_at`
  FROM `documentos`;
--> statement-breakpoint
DROP TABLE `documentos`;
--> statement-breakpoint
ALTER TABLE `documentos_new` RENAME TO `documentos`;
