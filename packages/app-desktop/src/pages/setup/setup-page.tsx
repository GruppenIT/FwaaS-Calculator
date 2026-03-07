import { useState, useMemo } from 'react';
import { StepTopologia } from './step-topologia';
import { StepPostgres } from './step-postgres';
import { StepAdmin } from './step-admin';
import { StepConclusao } from './step-conclusao';
import { CausaLogo } from '../../components/ui/causa-logo';

export type Topologia = 'solo' | 'escritorio';

export interface SetupData {
  topologia: Topologia | null;
  postgresUrl: string | null;
  admin: {
    nome: string;
    email: string;
    senha: string;
    oabNumero: string;
    oabSeccional: string;
  } | null;
}

type StepName = 'Topologia' | 'PostgreSQL' | 'Administrador' | 'Conclusão';

export function SetupPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SetupData>({
    topologia: null,
    postgresUrl: null,
    admin: null,
  });

  const steps: readonly StepName[] = useMemo(() => {
    if (data.topologia === 'escritorio') {
      return ['Topologia', 'PostgreSQL', 'Administrador', 'Conclusão'];
    }
    return ['Topologia', 'Administrador', 'Conclusão'];
  }, [data.topologia]);

  const currentStepName = steps[step];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <CausaLogo size={40} />
        </div>
        <p className="text-sm-causa text-[var(--color-text-muted)] italic font-[var(--font-brand)]">
          A sua causa, no seu escritório.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs-causa font-semibold
                ${
                  i <= step
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                }
              `}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm-causa ${
                i <= step ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-px ${
                  i < step ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card principal */}
      <div className="w-full max-w-lg bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-8">
        {currentStepName === 'Topologia' && (
          <StepTopologia
            selected={data.topologia}
            onSelect={(topologia) => {
              setData((prev) => ({
                ...prev,
                topologia,
                postgresUrl: topologia === 'solo' ? null : prev.postgresUrl,
              }));
              setStep(1);
            }}
          />
        )}
        {currentStepName === 'PostgreSQL' && (
          <StepPostgres
            postgresUrl={data.postgresUrl ?? ''}
            onBack={() => setStep(0)}
            onSubmit={(postgresUrl) => {
              setData((prev) => ({ ...prev, postgresUrl }));
              setStep(2);
            }}
          />
        )}
        {currentStepName === 'Administrador' && (
          <StepAdmin
            onBack={() => setStep(step - 1)}
            onSubmit={(admin) => {
              setData((prev) => ({ ...prev, admin }));
              setStep(step + 1);
            }}
          />
        )}
        {currentStepName === 'Conclusão' && (
          <StepConclusao data={data} onBack={() => setStep(step - 1)} />
        )}
      </div>
    </div>
  );
}
