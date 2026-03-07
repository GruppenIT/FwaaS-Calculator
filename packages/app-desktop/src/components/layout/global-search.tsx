import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, Users, DollarSign } from 'lucide-react';
import * as api from '../../lib/api';

interface SearchResult {
  id: string;
  type: 'processo' | 'cliente' | 'honorario';
  label: string;
  sublabel?: string | undefined;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [processos, clientes] = await Promise.all([
          api.listarProcessos(query),
          api.listarClientes(query),
        ]);
        const r: SearchResult[] = [
          ...processos.slice(0, 5).map((p) => ({
            id: p.id,
            type: 'processo' as const,
            label: p.numeroCnj,
            sublabel: p.clienteNome ?? undefined,
          })),
          ...clientes.slice(0, 5).map((c) => ({
            id: c.id,
            type: 'cliente' as const,
            label: c.nome,
            sublabel: c.cpfCnpj ?? undefined,
          })),
        ];
        setResults(r);
        setOpen(r.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(r: SearchResult) {
    setOpen(false);
    setQuery('');
    if (r.type === 'processo') navigate(`/app/processos/${r.id}`);
    else if (r.type === 'cliente') navigate(`/app/clientes/${r.id}`);
  }

  const iconMap = {
    processo: Briefcase,
    cliente: Users,
    honorario: DollarSign,
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
      <input
        type="text"
        placeholder="Buscar processos, clientes..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value.length >= 2) setOpen(true);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-md)] bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] text-sm-causa focus-causa transition-causa placeholder:text-[var(--color-text-muted)]/60"
      />
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] max-h-64 overflow-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)]">
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm-causa text-[var(--color-text-muted)]">
              Nenhum resultado.
            </div>
          ) : (
            results.map((r) => {
              const Icon = iconMap[r.type];
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="w-full text-left px-4 py-2.5 hover:bg-causa-surface-alt transition-causa cursor-pointer flex items-center gap-3"
                >
                  <Icon size={14} className="text-[var(--color-text-muted)] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm-causa text-[var(--color-text)] font-medium truncate">
                      {r.label}
                    </div>
                    {r.sublabel && (
                      <div className="text-xs-causa text-[var(--color-text-muted)] truncate">
                        {r.sublabel}
                      </div>
                    )}
                  </div>
                  <span className="ml-auto text-xs-causa text-[var(--color-text-muted)] capitalize shrink-0">
                    {r.type}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
