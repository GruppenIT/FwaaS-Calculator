import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from './api';

interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean | null;
  /** Erro de conexão com o servidor */
  serverError: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  setConfigured: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    configured: null,
    serverError: null,
  });
  const navigate = useNavigate();

  // Check system status on mount (retry while API is starting)
  useEffect(() => {
    let cancelled = false;

    async function pollHealth(retries = 15, delay = 500) {
      for (let i = 0; i < retries; i++) {
        if (cancelled) return;
        try {
          const health = await api.checkHealth();

          if (cancelled) return;

          if (!health.configured) {
            setState({ user: null, loading: false, configured: false, serverError: null });
            return;
          }

          setState((prev) => ({ ...prev, configured: true, serverError: null }));

          if (api.getAccessToken()) {
            const me = await api.getMe();
            setState({
              user: { id: me.sub, email: me.email, role: me.role, permissions: me.permissions },
              loading: false,
              configured: true,
              serverError: null,
            });
          } else {
            setState((prev) => ({ ...prev, loading: false }));
          }
          return;
        } catch {
          // API not ready yet — wait and retry
          if (i < retries - 1) {
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }

      // All retries exhausted — servidor inacessível
      if (!cancelled) {
        setState({
          user: null,
          loading: false,
          configured: false,
          serverError:
            'Não foi possível conectar ao serviço interno do CAUSA. ' +
            'O servidor pode não ter iniciado corretamente. ' +
            'Tente reiniciar a aplicação.',
        });
      }
    }

    pollHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  const loginFn = useCallback(
    async (email: string, senha: string) => {
      await api.login(email, senha);
      const me = await api.getMe();
      setState({
        user: { id: me.sub, email: me.email, role: me.role, permissions: me.permissions },
        loading: false,
        configured: true,
        serverError: null,
      });
      navigate('/app');
    },
    [navigate],
  );

  const logout = useCallback(() => {
    api.clearTokens();
    setState((prev) => ({ ...prev, user: null }));
    navigate('/login');
  }, [navigate]);

  const setConfigured = useCallback(() => {
    setState((prev) => ({ ...prev, configured: true }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login: loginFn, logout, setConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
