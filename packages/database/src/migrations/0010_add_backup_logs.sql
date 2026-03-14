-- Tabela de histórico de backups
CREATE TABLE IF NOT EXISTS `backup_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`destination_id` text NOT NULL,
	`destination_type` text NOT NULL,
	`destination_path` text,
	`status` text DEFAULT 'running' NOT NULL,
	`error_message` text,
	`file_size_bytes` integer,
	`file_name` text
);
