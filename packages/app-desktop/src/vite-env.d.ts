/// <reference types="vite/client" />

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare const __APP_VERSION__: string;

type UpdateUserChoice = 'install-now' | 'install-later' | 'ignore';

interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'restarting' | 'error' | 'not-available';
  version?: string;
  releaseNotes?: string;
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  error?: string;
  /** Se true, o download está ocorrendo em segundo plano (sem overlay) */
  background?: boolean;
}

interface CausaElectronAPI {
  getInstallConfig: () => Promise<{ topologia: string; postgresUrl?: string }>;
  getApiStatus: () => Promise<{ started: boolean }>;
  getAppVersion: () => Promise<string>;
  checkForUpdate: () => Promise<void>;
  respondToUpdate: (choice: UpdateUserChoice) => Promise<void>;
  restartAndUpdate: () => Promise<void>;
  getUpdateStatus: () => Promise<UpdateStatus>;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void;
  shellOpenPath: (folderPath: string) => Promise<void>;
  logToMain: (level: string, message: string) => void;
  getGhToken: () => Promise<string>;
  setGhToken: (token: string) => Promise<{ ok: boolean }>;
}

interface Window {
  causaElectron?: CausaElectronAPI;
}
