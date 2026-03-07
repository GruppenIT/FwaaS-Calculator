import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Logger de debug para CAUSA.
 *
 * Diretório de logs (por prioridade):
 *   1. Diretório configurado via setLogDirectory() (recomendado: getSharedDataDir())
 *   2. Windows: %PROGRAMDATA%\CAUSA SISTEMAS\CAUSA\logs (compartilhado entre usuários)
 *   3. Windows fallback: %LOCALAPPDATA%\CAUSA\logs (per-user)
 *   4. Linux/macOS: ~/.causa/logs/
 *
 * Fallback: se nenhum diretório for gravável, desabilita escrita em arquivo (mantém console).
 */

let logDir: string | null = null;
let logFile: string | null = null;
let enabled = true;

/**
 * Define o diretório de logs. Deve ser chamado antes do primeiro log.
 * Recomendado usar app.getPath('userData') do Electron.
 */
export function setLogDirectory(dir: string): void {
  logDir = path.join(dir, 'logs');
  logFile = null; // Reset para usar novo dir
}

function resolveLogDir(): string {
  if (logDir) return logDir;

  // Tentar diretórios que não precisam de permissão de admin
  const candidates: string[] = [];

  if (os.platform() === 'win32') {
    // %PROGRAMDATA% — compartilhado entre todos os usuários do sistema
    const programData = process.env.PROGRAMDATA || 'C:\\ProgramData';
    candidates.push(path.join(programData, 'CAUSA SISTEMAS', 'CAUSA', 'logs'));
    // Fallback: %LOCALAPPDATA% — per-user, sempre gravável
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      candidates.push(path.join(localAppData, 'CAUSA', 'logs'));
    }
  } else {
    candidates.push(path.join(os.homedir(), '.causa', 'logs'));
  }

  // Usar o primeiro diretório que conseguir criar
  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) {
        fs.mkdirSync(candidate, { recursive: true });
      }
      logDir = candidate;
      return candidate;
    } catch {
      // Tentar o próximo
    }
  }

  // Nenhum diretório disponível
  enabled = false;
  const fallback = candidates[0] ?? path.join(os.tmpdir(), 'causa-logs');
  logDir = fallback;
  return fallback;
}

function ensureLogDir(): boolean {
  if (!enabled) return false;
  try {
    const dir = resolveLogDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return true;
  } catch {
    enabled = false;
    return false;
  }
}

function getLogFile(): string {
  if (logFile) return logFile;

  const dir = resolveLogDir();
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const file = path.join(dir, `causa-${date}.log`);
  logFile = file;
  return file;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function writeLog(level: string, category: string, message: string, data?: unknown): void {
  const line = data !== undefined
    ? `[${formatTimestamp()}] [${level}] [${category}] ${message} ${JSON.stringify(data, null, 0)}`
    : `[${formatTimestamp()}] [${level}] [${category}] ${message}`;

  // Sempre escreve no console
  if (level === 'ERROR') {
    console.error(line);
  } else {
    console.log(line);
  }

  // Escreve no arquivo de log
  if (!enabled) return;
  try {
    if (!ensureLogDir()) return;
    fs.appendFileSync(getLogFile(), line + '\n');
  } catch {
    // Falha silenciosa para não impactar a aplicação
  }
}

export const logger = {
  info(category: string, message: string, data?: unknown) {
    writeLog('INFO', category, message, data);
  },
  warn(category: string, message: string, data?: unknown) {
    writeLog('WARN', category, message, data);
  },
  error(category: string, message: string, data?: unknown) {
    writeLog('ERROR', category, message, data);
  },
  debug(category: string, message: string, data?: unknown) {
    writeLog('DEBUG', category, message, data);
  },

  /** Retorna o caminho do diretório de logs */
  getLogDirectory(): string {
    return resolveLogDir();
  },
};
