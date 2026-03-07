import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context';
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
import { PrazosPage } from './pages/prazos/prazos-page';
import { ServerErrorPage } from './pages/server-error-page';

function AppRoutes() {
  const { user, loading, configured, serverError } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-[var(--color-text-muted)] text-sm-causa">Carregando...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Público */}
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/server-error" element={<ServerErrorPage message={serverError} />} />

      {/* Autenticado — layout com sidebar */}
      <Route path="/app" element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<DashboardPage />} />
        <Route path="processos" element={<ProcessosPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="financeiro" element={<FinanceiroPage />} />
        <Route path="conectores" element={<ConectoresPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="prazos" element={<PrazosPage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
      </Route>

      <Route
        path="*"
        element={
          serverError ? (
            <Navigate to="/server-error" replace />
          ) : configured === false ? (
            <Navigate to="/setup" replace />
          ) : user ? (
            <Navigate to="/app" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
