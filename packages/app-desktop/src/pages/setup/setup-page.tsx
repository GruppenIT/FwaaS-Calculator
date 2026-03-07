import { useState } from 'react';
import { StepTopologia } from './step-topologia';
import { StepAdmin } from './step-admin';
import { StepConclusao } from './step-conclusao';

export type Topologia = 'solo' | 'escritorio';

export interface SetupData {
  topologia: Topologia | null;
  admin: {
    nome: string;
    email: string;
    senha: string;
    oabNumero: string;
    oabSeccional: string;
  } | null;
}

const STEPS = ['Topologia', 'Administrador', 'Conclusão'] as const;

export function SetupPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SetupData>({
    topologia: null,
    admin: null,
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-8">
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
        <p className="text-sm-causa text-[var(--color-text-muted)] italic font-[var(--font-brand)]">
          A sua causa, no seu escritório.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs-causa font-semibold
                ${i <= step
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
            {i < STEPS.length - 1 && (
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
        {step === 0 && (
          <StepTopologia
            selected={data.topologia}
            onSelect={(topologia) => {
              setData((prev) => ({ ...prev, topologia }));
              setStep(1);
            }}
          />
        )}
        {step === 1 && (
          <StepAdmin
            onBack={() => setStep(0)}
            onSubmit={(admin) => {
              setData((prev) => ({ ...prev, admin }));
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <StepConclusao
            data={data}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
}
