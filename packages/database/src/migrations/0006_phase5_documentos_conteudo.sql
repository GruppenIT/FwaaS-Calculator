-- Armazena conteúdo do arquivo diretamente no banco (base64)
ALTER TABLE `documentos` ADD COLUMN `conteudo` text;
