CREATE TABLE `tarefas` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text,
	`processo_id` text REFERENCES `processos`(`id`),
	`cliente_id` text REFERENCES `clientes`(`id`),
	`criado_por` text NOT NULL REFERENCES `users`(`id`),
	`responsavel_id` text NOT NULL REFERENCES `users`(`id`),
	`prioridade` text NOT NULL DEFAULT 'normal',
	`status` text NOT NULL DEFAULT 'pendente',
	`categoria` text,
	`data_limite` text,
	`data_conclusao` text,
	`tempo_estimado_min` integer,
	`tempo_gasto_min` integer,
	`observacoes` text,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
ALTER TABLE `documentos` ADD `descricao` text;
--> statement-breakpoint
ALTER TABLE `documentos` ADD `categoria` text;
--> statement-breakpoint
ALTER TABLE `documentos` ADD `tags` text;
--> statement-breakpoint
ALTER TABLE `documentos` ADD `confidencial` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `documentos` ADD `data_referencia` text;
--> statement-breakpoint
ALTER TABLE `documentos` ADD `updated_at` text;
