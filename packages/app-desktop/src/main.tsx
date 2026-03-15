import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fontsource — self-hosted fonts for offline Electron
import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-ext-500.css';
import '@fontsource/inter/latin-ext-600.css';
import '@fontsource/inter/latin-ext-700.css';
import '@fontsource/lora/latin-ext-600.css';
import '@fontsource/jetbrains-mono/latin-ext-400.css';
import { App } from './app';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
