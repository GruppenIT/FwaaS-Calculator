-- Phase 1.2: Enriquecimento Processos (+26 campos)
ALTER TABLE processos ADD COLUMN numero_antigo TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN cliente_qualidade TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN advogados_secundarios TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN grau TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN comarca TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN vara TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN juiz TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN classe_processual TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN classe_descricao TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN assunto_principal TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN assunto_descricao TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN subarea TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN rito TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN prioridade TEXT NOT NULL DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE processos ADD COLUMN segredo_justica INTEGER NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN justica_gratuita INTEGER NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN valor_condenacao REAL;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN data_distribuicao TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN data_transito_julgado TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN data_encerramento TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN processo_relacionado_id TEXT REFERENCES processos(id);--> statement-breakpoint
ALTER TABLE processos ADD COLUMN tipo_relacao TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN tags TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN observacoes TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN advogado_contrario TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN oab_contrario TEXT;--> statement-breakpoint
ALTER TABLE processos ADD COLUMN updated_at TEXT;--> statement-breakpoint
-- Phase 1.3: Enriquecimento Movimentações (+8 campos)
ALTER TABLE movimentacoes ADD COLUMN teor TEXT;--> statement-breakpoint
ALTER TABLE movimentacoes ADD COLUMN urgente INTEGER NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE movimentacoes ADD COLUMN gera_prazo INTEGER NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE movimentacoes ADD COLUMN prazo_gerado_id TEXT REFERENCES prazos(id);--> statement-breakpoint
ALTER TABLE movimentacoes ADD COLUMN link_externo TEXT;--> statement-breakpoint
ALTER TABLE movimentacoes ADD COLUMN lido_por TEXT REFERENCES users(id);--> statement-breakpoint
ALTER TABLE movimentacoes ADD COLUMN lido_at TEXT;--> statement-breakpoint
ALTER TABLE movimentacoes ADD COLUMN documento_anexo_id TEXT;--> statement-breakpoint
-- Phase 1.4: Enriquecimento Prazos (+14 campos)
ALTER TABLE prazos ADD COLUMN data_inicio TEXT;--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN dias_prazo INTEGER;--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN tipo_contagem TEXT;--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN categoria_prazo TEXT;--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN prioridade TEXT NOT NULL DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN fatal INTEGER NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN suspenso INTEGER NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN motivo_suspensao TEXT;--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN data_suspensao TEXT;--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN data_retomada TEXT;--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN responsaveis_secundarios TEXT;--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN observacoes TEXT;--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN data_cumprimento TEXT;--> statement-breakpoint
ALTER TABLE prazos ADD COLUMN cumprido_por TEXT REFERENCES users(id);--> statement-breakpoint
-- Phase 1.5: Enriquecimento Honorários (+8 campos)
ALTER TABLE honorarios ADD COLUMN descricao TEXT;--> statement-breakpoint
ALTER TABLE honorarios ADD COLUMN valor_base_exito REAL;--> statement-breakpoint
ALTER TABLE honorarios ADD COLUMN parcelamento INTEGER NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE honorarios ADD COLUMN numero_parcelas INTEGER;--> statement-breakpoint
ALTER TABLE honorarios ADD COLUMN contrato_documento_id TEXT;--> statement-breakpoint
ALTER TABLE honorarios ADD COLUMN indice_correcao TEXT;--> statement-breakpoint
ALTER TABLE honorarios ADD COLUMN observacoes TEXT;--> statement-breakpoint
ALTER TABLE honorarios ADD COLUMN updated_at TEXT;--> statement-breakpoint
-- Phase 1.6: Enriquecimento Agenda (+10 campos)
ALTER TABLE agenda ADD COLUMN descricao TEXT;--> statement-breakpoint
ALTER TABLE agenda ADD COLUMN dia_inteiro INTEGER NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE agenda ADD COLUMN cliente_id TEXT REFERENCES clientes(id);--> statement-breakpoint
ALTER TABLE agenda ADD COLUMN link_videoconferencia TEXT;--> statement-breakpoint
ALTER TABLE agenda ADD COLUMN cor TEXT;--> statement-breakpoint
ALTER TABLE agenda ADD COLUMN recorrencia TEXT;--> statement-breakpoint
ALTER TABLE agenda ADD COLUMN lembretes TEXT;--> statement-breakpoint
ALTER TABLE agenda ADD COLUMN status_agenda TEXT NOT NULL DEFAULT 'agendado';--> statement-breakpoint
ALTER TABLE agenda ADD COLUMN resultado TEXT;--> statement-breakpoint
ALTER TABLE agenda ADD COLUMN criado_por TEXT REFERENCES users(id);--> statement-breakpoint
-- Phase 1.7: Enriquecimento Usuários (+10 campos)
ALTER TABLE users ADD COLUMN oab_tipo TEXT;--> statement-breakpoint
ALTER TABLE users ADD COLUMN telefone TEXT;--> statement-breakpoint
ALTER TABLE users ADD COLUMN area_atuacao TEXT;--> statement-breakpoint
ALTER TABLE users ADD COLUMN especialidade TEXT;--> statement-breakpoint
ALTER TABLE users ADD COLUMN taxa_horaria REAL;--> statement-breakpoint
ALTER TABLE users ADD COLUMN data_admissao TEXT;--> statement-breakpoint
ALTER TABLE users ADD COLUMN certificado_a1_validade TEXT;--> statement-breakpoint
ALTER TABLE users ADD COLUMN certificado_a3_configurado INTEGER NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE users ADD COLUMN avatar_path TEXT;--> statement-breakpoint
ALTER TABLE users ADD COLUMN updated_at TEXT;
