'use client';

interface SparkLineProps {
  data: number[];        // likelihood values, e.g. [65, 68, 71, 70, 74]
  width?: number;
  height?: number;
}

export default function SparkLine({ data, width = 56, height = 20 }: SparkLineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const last = data[data.length - 1];
  const first = data[0];
  const trend = last > first + 1 ? 'up' : last < first - 1 ? 'down' : 'flat';
  const color = trend === 'up' ? '#34d399' : trend === 'down' ? '#f87171' : '#6b7280';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden="true"
    >
      {/* Area fill */}
      <defs>
        <linearGradient id={`sg-${trend}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
