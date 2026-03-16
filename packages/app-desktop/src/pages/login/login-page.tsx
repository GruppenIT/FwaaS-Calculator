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
    window.causaElectron
      ?.getAppVersion()
      .then((v) => setAppVersion(v))
      .catch(() => {});
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
    <div className="min-h-screen flex">
      {/* Painel esquerdo — sempre escuro, ignora tema */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-between p-10"
        style={{ backgroundColor: '#0F1829' }}
      >
        {/* Logo CAUSA em branco */}
        <CausaLogo
          size={48}
          showText
          className="[&_img]:brightness-0 [&_img]:invert [&_span]:!text-white"
        />

        {/* Conteúdo central */}
        <div className="flex flex-col justify-center gap-6 flex-1 mt-10">
          <p
            className="font-[var(--font-brand)]"
            style={{ fontSize: '20px', color: 'white' }}
          >
            A sua causa, no seu escritório.
          </p>

          <ul className="space-y-3 text-sm-causa" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <li>— Gestão de prazos e processos</li>
            <li>— Controle financeiro completo</li>
            <li>— Monitoramento processual automático</li>
          </ul>
        </div>

        {/* Versão */}
        <p
          style={{ color: 'rgba(255,255,255,0.3)' }}
          className="text-xs-causa"
        >
          CAUSA {appVersion ? `v${appVersion}` : ''}
        </p>
      </div>

      {/* Painel direito — respeita tema */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--color-bg)] relative">
        {/* Toggle tema — canto superior direito */}
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-4 right-4 w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--color-text-muted)] hover:bg-causa-surface-alt transition-causa focus-causa cursor-pointer"
          title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Formulário de login */}
        <div className="w-full max-w-sm">
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
      </div>
    </div>
  );
}
