import causaIcon from '../../assets/causa-icon.svg';

interface CausaLogoProps {
  /** Tamanho do ícone em pixels */
  size?: number;
  /** Mostrar texto "CAUSA" ao lado do ícone */
  showText?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

export function CausaLogo({ size = 40, showText = true, className = '' }: CausaLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={causaIcon}
        alt="CAUSA"
        width={size}
        height={size}
        className="rounded-[var(--radius-lg)]"
      />
      {showText && (
        <span className="text-2xl-causa text-[var(--color-text)] font-[var(--font-brand)]">
          CAUSA
        </span>
      )}
    </div>
  );
}
