import { useState, type FormEvent } from 'react';
import { ArrowLeft, Database, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface Props {
  postgresUrl: string;
  onBack: () => void;
  onSubmit: (postgresUrl: string) => void;
}

export function StepPostgres({ postgresUrl: initial, onBack, onSubmit }: Props) {
  const [mode, setMode] = useState<'url' | 'fields'>(initial ? 'url' : 'fields');
  const [url, setUrl] = useState(initial);
  const [fields, setFields] = useState({
    host: '192.168.1.100',
    port: '5432',
    database: 'causa',
    user: 'causa',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function buildUrl(): string {
    return `postgresql://${fields.user}:${encodeURIComponent(fields.password)}@${fields.host}:${fields.port}/${fields.database}`;
  }

  function validate(): boolean {
    const e: Record<string, string> = {};

    if (mode === 'url') {
      if (!url.trim()) {
        e.url = 'URL de conexão é obrigatória';
      } else if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
        e.url = 'URL deve começar com postgresql:// ou postgres://';
      }
    } else {
      if (!fields.host.trim()) e.host = 'Host é obrigatório';
      if (!fields.port.trim()) e.port = 'Porta é obrigatória';
      if (!fields.database.trim()) e.database = 'Nome do banco é obrigatório';
      if (!fields.user.trim()) e.user = 'Usuário é obrigatório';
      if (!fields.password.trim()) e.password = 'Senha é obrigatória';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit(mode === 'url' ? url : buildUrl());
  }

  function updateField(field: keyof typeof fields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm-causa text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Database size={20} className="text-[var(--color-primary)]" />
        <h2 className="text-xl-causa text-[var(--color-text)]">
          Conexão PostgreSQL
        </h2>
      </div>
      <p className="text-sm-causa text-[var(--color-text-muted)] mb-4">
        Configure a conexão com o servidor PostgreSQL do escritório.
      </p>

      {/* Aviso */}
      <div className="flex items-start gap-2 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-[var(--radius-md)] p-3 mb-5">
        <AlertCircle size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
        <div className="text-xs-causa text-[var(--color-text-muted)]">
          O banco PostgreSQL deve estar acessível na rede local. Certifique-se de que o banco
          <strong className="text-[var(--color-text)]"> causa</strong> já foi criado no servidor.
        </div>
      </div>

      {/* Modo de entrada */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('fields')}
          className={`flex-1 text-sm-causa py-1.5 rounded-[var(--radius-md)] border cursor-pointer transition-causa ${
            mode === 'fields'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
          }`}
        >
          Campos
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 text-sm-causa py-1.5 rounded-[var(--radius-md)] border cursor-pointer transition-causa ${
            mode === 'url'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
          }`}
        >
          URL direta
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {mode === 'url' ? (
          <Input
            label="URL de conexão"
            placeholder="postgresql://causa:senha@192.168.1.100:5432/causa"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={errors.url}
            autoFocus
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  label="Host / IP"
                  placeholder="192.168.1.100"
                  value={fields.host}
                  onChange={(e) => updateField('host', e.target.value)}
                  error={errors.host}
                  autoFocus
                />
              </div>
              <Input
                label="Porta"
                placeholder="5432"
                value={fields.port}
                onChange={(e) => updateField('port', e.target.value)}
                error={errors.port}
              />
            </div>
            <Input
              label="Nome do banco"
              placeholder="causa"
              value={fields.database}
              onChange={(e) => updateField('database', e.target.value)}
              error={errors.database}
            />
            <Input
              label="Usuário"
              placeholder="causa"
              value={fields.user}
              onChange={(e) => updateField('user', e.target.value)}
              error={errors.user}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Senha do banco PostgreSQL"
              value={fields.password}
              onChange={(e) => updateField('password', e.target.value)}
              error={errors.password}
            />
          </>
        )}

        <Button type="submit" className="mt-2">
          Continuar
        </Button>
      </div>
    </form>
  );
}
