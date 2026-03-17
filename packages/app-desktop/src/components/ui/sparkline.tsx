interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'var(--color-primary)',
  fillOpacity = 0.1,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const padding = 2;
  const innerWidth = width;
  const innerHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  // Map a value to a y coordinate (inverted: higher value = lower y)
  function toY(value: number): number {
    if (range === 0) return padding + innerHeight / 2;
    return padding + innerHeight - ((value - min) / range) * innerHeight;
  }

  // Map an index to an x coordinate
  function toX(index: number): number {
    return (index / (data.length - 1)) * innerWidth;
  }

  const points = data.map((value, i) => `${toX(i)},${toY(value)}`).join(' ');

  // Polygon for fill area: line points + bottom-right + bottom-left
  const lastX = toX(data.length - 1);
  const firstX = toX(0);
  const bottomY = height - padding;
  const polygonPoints = `${points} ${lastX},${bottomY} ${firstX},${bottomY}`;

  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'inline-block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Filled area */}
      <polygon
        points={polygonPoints}
        fill={color}
        fillOpacity={fillOpacity}
        stroke="none"
      />
      {/* Trend line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
