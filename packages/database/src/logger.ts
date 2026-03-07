import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Logger de debug para CAUSA.
 * Escreve logs em:
 *   Windows: C:\ProgramData\CAUSA\logs\
 *   Linux/macOS: ~/.causa/logs/
 */

let logDir: string | null = null;
let logFile: string | null = null;
let enabled = true;

function getLogDir(): string {
  if (logDir) return logDir;

  let dir: string;
  if (os.platform() === 'win32') {
    const programData = process.env.PROGRAMDATA || 'C:\\ProgramData';
    dir = path.join(programData, 'CAUSA', 'logs');
  } else {
    dir = path.join(os.homedir(), '.causa', 'logs');
  }

  logDir = dir;
  return dir;
}

function ensureLogDir(): boolean {
  try {
    const dir = getLogDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return true;
  } catch {
    // Sem permissão para criar diretório de log — desabilita silenciosamente
    enabled = false;
    return false;
  }
}

function getLogFile(): string {
  if (logFile) return logFile;

  const dir = getLogDir();
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
    return getLogDir();
  },
};
