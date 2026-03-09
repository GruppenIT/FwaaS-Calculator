ALTER TABLE clientes ADD COLUMN nome_social TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN rg TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN rg_orgao_emissor TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN data_nascimento TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN nacionalidade TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN estado_civil TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN profissao TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN email_secundario TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN telefone_secundario TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN whatsapp TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN endereco_comercial TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN observacoes TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN origem_captacao TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN indicado_por TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN status_cliente TEXT NOT NULL DEFAULT 'ativo';--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN data_contrato TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN contato_preferencial TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN tags TEXT;--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN updated_at TEXT;
