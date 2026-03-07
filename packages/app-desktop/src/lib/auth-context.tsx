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
  });
  const navigate = useNavigate();

  // Check system status on mount
  useEffect(() => {
    api
      .checkHealth()
      .then(async (health) => {
        if (!health.configured) {
          setState({ user: null, loading: false, configured: false });
          return;
        }
        setState((prev) => ({ ...prev, configured: true }));

        // If we have a token, try to fetch user
        if (api.getAccessToken()) {
          const me = await api.getMe();
          setState({
            user: { id: me.sub, email: me.email, role: me.role, permissions: me.permissions },
            loading: false,
            configured: true,
          });
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }
      })
      .catch(() => {
        setState({ user: null, loading: false, configured: null });
      });
  }, []);

  const loginFn = useCallback(
    async (email: string, senha: string) => {
      await api.login(email, senha);
      const me = await api.getMe();
      setState({
        user: { id: me.sub, email: me.email, role: me.role, permissions: me.permissions },
        loading: false,
        configured: true,
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
