import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context';
import { ToastProvider } from './components/ui/toast';
import { UpdateOverlay } from './components/update-overlay';
import { usePermission } from './hooks/use-permission';
import { SetupPage } from './pages/setup/setup-page';
import { LoginPage } from './pages/login/login-page';
import { AppLayout } from './components/layout/app-layout';
import { DashboardPage } from './pages/dashboard/dashboard-page';
import { ProcessosPage } from './pages/processos/processos-page';
import { ProcessoDetailPage } from './pages/processos/processo-detail-page';
import { ClientesPage } from './pages/clientes/clientes-page';
import { ClienteDetailPage } from './pages/clientes/cliente-detail-page';
import { AgendaPage } from './pages/agenda/agenda-page';
import { FinanceiroPage } from './pages/financeiro/financeiro-page';
import { ConectoresPage } from './pages/conectores/conectores-page';
import { UsuariosPage } from './pages/usuarios/usuarios-page';
import { ConfiguracoesPage } from './pages/configuracoes/configuracoes-page';
import { PrazosPage } from './pages/prazos/prazos-page';
import { TarefasPage } from './pages/tarefas/tarefas-page';
import { DocumentosPage } from './pages/documentos/documentos-page';
import { DespesasPage } from './pages/despesas/despesas-page';
import { ContatosPage } from './pages/contatos/contatos-page';
import { TimesheetPage } from './pages/timesheet/timesheet-page';
import { ServerErrorPage } from './pages/server-error-page';
import type { ReactNode } from 'react';
import { useFeatures } from './lib/auth-context';

/** Redireciona para /app se o usuário não tem nenhuma das permissões */
function RequirePermission({
  permissions,
  children,
}: {
  permissions: string[];
  children: ReactNode;
}) {
  const { canAny } = usePermission();
  if (!canAny(permissions)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading, configured, serverError } = useAuth();
  const features = useFeatures();

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
        <Route
          path="processos"
          element={
            <RequirePermission permissions={['processos:ler_todos', 'processos:ler_proprios']}>
              <ProcessosPage />
            </RequirePermission>
          }
        />
        <Route
          path="processos/:id"
          element={
            <RequirePermission permissions={['processos:ler_todos', 'processos:ler_proprios']}>
              <ProcessoDetailPage />
            </RequirePermission>
          }
        />
        <Route
          path="clientes"
          element={
            <RequirePermission permissions={['clientes:ler_todos']}>
              <ClientesPage />
            </RequirePermission>
          }
        />
        <Route
          path="clientes/:id"
          element={
            <RequirePermission permissions={['clientes:ler_todos']}>
              <ClienteDetailPage />
            </RequirePermission>
          }
        />
        <Route
          path="agenda"
          element={
            <RequirePermission permissions={['agenda:gerenciar_todos']}>
              <AgendaPage />
            </RequirePermission>
          }
        />
        {features.financeiro && (
          <Route
            path="financeiro"
            element={
              <RequirePermission permissions={['financeiro:ler_todos', 'financeiro:ler_proprios']}>
                <FinanceiroPage />
              </RequirePermission>
            }
          />
        )}
        <Route
          path="conectores"
          element={
            <RequirePermission permissions={['conectores:executar']}>
              <ConectoresPage />
            </RequirePermission>
          }
        />
        <Route
          path="usuarios"
          element={
            <RequirePermission permissions={['usuarios:gerenciar']}>
              <UsuariosPage />
            </RequirePermission>
          }
        />
        <Route
          path="prazos"
          element={
            <RequirePermission permissions={['processos:ler_todos', 'processos:ler_proprios']}>
              <PrazosPage />
            </RequirePermission>
          }
        />
        <Route
          path="tarefas"
          element={
            <RequirePermission permissions={['tarefas:ler_todos', 'tarefas:ler_proprios']}>
              <TarefasPage />
            </RequirePermission>
          }
        />
        <Route
          path="documentos"
          element={
            <RequirePermission permissions={['documentos:ler_todos']}>
              <DocumentosPage />
            </RequirePermission>
          }
        />
        <Route
          path="despesas"
          element={
            <RequirePermission permissions={['despesas:ler_todos']}>
              <DespesasPage />
            </RequirePermission>
          }
        />
        <Route
          path="contatos"
          element={
            <RequirePermission permissions={['contatos:gerenciar']}>
              <ContatosPage />
            </RequirePermission>
          }
        />
        <Route
          path="timesheet"
          element={
            <RequirePermission
              permissions={['timesheet:registrar', 'timesheet:ler_todos', 'timesheet:ler_proprios']}
            >
              <TimesheetPage />
            </RequirePermission>
          }
        />
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
        <ToastProvider>
          <UpdateOverlay />
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  );
}
