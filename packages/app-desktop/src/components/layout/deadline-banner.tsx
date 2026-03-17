import { useNavigate } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { useFatalDeadlines } from '../../hooks/use-fatal-deadlines';

export function DeadlineBanner() {
  const { today, tomorrow } = useFatalDeadlines();
  const navigate = useNavigate();

  if (today === 0 && tomorrow === 0) return null;

  return (
    <div
      role="alert"
      onClick={() => navigate('/app/prazos?tier=fatal')}
      className="mx-6 mt-4 mb-0 rounded-[var(--radius-md)] border border-causa-tier-fatal/30 bg-causa-tier-fatal/8 p-4 cursor-pointer hover:bg-causa-tier-fatal/12 transition-causa"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert size={20} className="text-causa-tier-fatal mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          {today > 0 && (
            <p className="text-sm-causa font-medium text-causa-tier-fatal">
              {today} {today === 1 ? 'prazo fatal vence' : 'prazos fatais vencem'} hoje
            </p>
          )}
          {tomorrow > 0 && (
            <p
              className={`text-sm-causa font-medium text-causa-tier-fatal ${today > 0 ? 'mt-0.5' : ''}`}
            >
              {tomorrow} {tomorrow === 1 ? 'prazo fatal vence' : 'prazos fatais vencem'} amanha
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
