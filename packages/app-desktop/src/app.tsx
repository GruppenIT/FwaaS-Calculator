import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SetupPage } from './pages/setup/setup-page';
import { LoginPage } from './pages/login/login-page';
import { AppLayout } from './components/layout/app-layout';
import { DashboardPage } from './pages/dashboard/dashboard-page';
import { ProcessosPage } from './pages/processos/processos-page';
import { ClientesPage } from './pages/clientes/clientes-page';
import { AgendaPage } from './pages/agenda/agenda-page';
import { FinanceiroPage } from './pages/financeiro/financeiro-page';
import { ConectoresPage } from './pages/conectores/conectores-page';
import { UsuariosPage } from './pages/usuarios/usuarios-page';
import { ConfiguracoesPage } from './pages/configuracoes/configuracoes-page';

export function App() {
  // TODO: verificar se já foi configurado (primeiro uso vs login)
  return (
    <BrowserRouter>
      <Routes>
        {/* Público */}
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Autenticado — layout com sidebar */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="processos" element={<ProcessosPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="conectores" element={<ConectoresPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
