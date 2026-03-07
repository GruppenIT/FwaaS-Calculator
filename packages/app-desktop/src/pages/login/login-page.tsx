import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useTheme } from '../../hooks/use-theme';
import { Moon, Sun } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: chamar AuthService.login via IPC
      // Simulação por enquanto
      await new Promise((r) => setTimeout(r, 500));
      if (!email || !senha) {
        setError('Preencha todos os campos.');
        return;
      }
      // TODO: navegar para dashboard após login
      setError('Login ainda não conectado ao backend.');
    } catch {
      setError('Credenciais inválidas.');
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

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--color-primary)] flex items-center justify-center">
            <span className="text-white font-bold text-xl font-[var(--font-brand)]">C</span>
          </div>
          <h1 className="text-2xl-causa text-[var(--color-text)] font-[var(--font-brand)]">
            CAUSA
          </h1>
        </div>
      </div>

      {/* Card de login */}
      <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-8">
        <h2 className="text-xl-causa text-[var(--color-text)] mb-1 text-center">
          Entrar
        </h2>
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
        CAUSA v0.1.0
      </p>
    </div>
  );
}
