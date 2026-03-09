CREATE TABLE `parcelas` (
  `id` text PRIMARY KEY NOT NULL,
  `honorario_id` text NOT NULL REFERENCES `honorarios`(`id`),
  `numero_parcela` integer NOT NULL,
  `valor` real NOT NULL,
  `vencimento` text NOT NULL,
  `status` text NOT NULL DEFAULT 'pendente',
  `data_pagamento` text,
  `valor_pago` real,
  `forma_pagamento` text,
  `comprovante_doc_id` text REFERENCES `documentos`(`id`),
  `juros` real,
  `multa` real,
  `desconto` real,
  `observacoes` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `despesas` (
  `id` text PRIMARY KEY NOT NULL,
  `processo_id` text REFERENCES `processos`(`id`),
  `cliente_id` text REFERENCES `clientes`(`id`),
  `tipo` text NOT NULL,
  `descricao` text NOT NULL,
  `valor` real NOT NULL,
  `data` text NOT NULL,
  `antecipado_por` text NOT NULL,
  `reembolsavel` integer NOT NULL DEFAULT 1,
  `reembolsado` integer NOT NULL DEFAULT 0,
  `data_reembolso` text,
  `comprovante_doc_id` text REFERENCES `documentos`(`id`),
  `responsavel_id` text NOT NULL REFERENCES `users`(`id`),
  `status` text NOT NULL DEFAULT 'pendente',
  `created_at` text NOT NULL
);
--> statement-breakpoint
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
  `ativo` integer NOT NULL DEFAULT 1,
  `created_at` text NOT NULL
);
