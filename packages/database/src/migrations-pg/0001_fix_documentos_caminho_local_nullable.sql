-- Torna caminho_local nullable (conteúdo agora fica em base64 na coluna conteudo)
ALTER TABLE "documentos" ALTER COLUMN "caminho_local" DROP NOT NULL;
