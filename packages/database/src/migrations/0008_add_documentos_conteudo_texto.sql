-- Coluna para indexação de texto extraído do documento (busca full-text)
ALTER TABLE `documentos` ADD COLUMN `conteudo_texto` text;
