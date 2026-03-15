import { useState, useEffect } from 'react';
import { getFatalDeadlineSummary, type FatalDeadlineSummary } from '../lib/api';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useFatalDeadlines(): FatalDeadlineSummary {
  const [summary, setSummary] = useState<FatalDeadlineSummary>({ today: 0, tomorrow: 0 });

  useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
      try {
        const data = await getFatalDeadlineSummary();
        if (!cancelled) setSummary(data);
      } catch {
        // Silent failure — banner polling must never crash AppLayout
      }
    }

    fetchSummary();
    const interval = setInterval(fetchSummary, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return summary;
}
