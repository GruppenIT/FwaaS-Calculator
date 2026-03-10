-- Campos para integração com Google Drive
ALTER TABLE "documentos" ADD COLUMN "drive_file_id" text;
ALTER TABLE "documentos" ADD COLUMN "drive_synced_at" text;
