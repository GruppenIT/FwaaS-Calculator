import { useState, useEffect, useMemo } from 'react';

/**
 * Resolves a CSS custom property to its computed value on document.documentElement.
 * Returns a trimmed string — never a var() reference.
 */
export function resolveCssVar(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

export interface ChartTheme {
  colors: {
    primary: string;
    warning: string;
    success: string;
    danger: string;
    muted: string;
    amber: string;
    emerald: string;
  };
  gridProps: {
    strokeDasharray: string;
    stroke: string;
  };
  axisProps: {
    tick: {
      fontSize: number;
      fill: string;
    };
  };
  tooltipProps: {
    contentStyle: {
      background: string;
      border: string;
      borderRadius: string;
      fontSize: number;
      color: string;
    };
  };
}

/**
 * React hook that returns resolved CSS var values for Recharts components.
 *
 * Uses a MutationObserver on document.documentElement to detect theme class
 * changes (light/dark toggle) and re-resolves all color tokens automatically.
 *
 * All returned color values are resolved hex/rgb strings — never var() references,
 * since Recharts requires actual color values for SVG attributes.
 */
export function useChartTheme(): ChartTheme {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTick((t) => t + 1);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return useMemo(() => {
    const primary = resolveCssVar('--color-primary');
    const warning = resolveCssVar('--color-warning');
    const success = resolveCssVar('--color-success');
    const danger = resolveCssVar('--color-danger');
    const muted = resolveCssVar('--color-text-muted');
    const amber = resolveCssVar('--color-accent-amber');
    const emerald = resolveCssVar('--color-accent-emerald');
    const border = resolveCssVar('--color-border');
    const surface = resolveCssVar('--color-surface');
    const text = resolveCssVar('--color-text');

    return {
      colors: { primary, warning, success, danger, muted, amber, emerald },
      gridProps: {
        strokeDasharray: '3 3',
        stroke: border,
      },
      axisProps: {
        tick: {
          fontSize: 11,
          fill: muted,
        },
      },
      tooltipProps: {
        contentStyle: {
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: '6px',
          fontSize: 12,
          color: text,
        },
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
}
