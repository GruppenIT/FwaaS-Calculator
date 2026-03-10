import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { CausaLogo } from '../../components/ui/causa-logo';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../lib/auth-context';
import { Moon, Sun } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [appVersion, setAppVersion] = useState(__APP_VERSION__);
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();

  useEffect(() => {
    window.causaElectron?.getAppVersion().then((v) => setAppVersion(v)).catch(() => {});
  }, []);

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError('');

    if (!email || !senha) {
      setError('Preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      await login(email, senha);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-8">
      {/* Toggle tema — canto superior direito */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--color-text-muted)] hover:bg-causa-surface-alt transition-causa cursor-pointer"
        title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      {/* Logo — apenas ícone, sem texto */}
      <div className="mb-8 flex justify-center">
        <CausaLogo size={120} showText={false} />
      </div>

      {/* Card de login */}
      <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-8">
        <h2 className="text-xl-causa text-[var(--color-text)] mb-1 text-center">Entrar</h2>
        <p className="text-sm-causa text-[var(--color-text-muted)] mb-6 text-center">
          Acesse seu escritório
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="advogado@escritorio.com"
            autoFocus
          />

          <Input
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {error && (
            <div className="text-sm-causa text-causa-danger bg-causa-danger/8 rounded-[var(--radius-md)] px-3 py-2 border border-causa-danger/20">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>

      {/* Versão */}
      <p className="mt-6 text-xs-causa text-[var(--color-text-muted)]/50">
        CAUSA {appVersion ? `v${appVersion}` : ''}
      </p>
    </div>
  );
}
