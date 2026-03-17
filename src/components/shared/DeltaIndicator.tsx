'use client';

interface DeltaIndicatorProps {
  delta: number;
}

export default function DeltaIndicator({ delta }: DeltaIndicatorProps) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;

  const color = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400';
  const arrow = isPositive ? '\u25B2' : isNegative ? '\u25BC' : '\u25CF';
  const formatted = isPositive ? `+${delta}` : `${delta}`;

  return (
    <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${color}`}>
      <span className="text-[10px]">{arrow}</span>
      {formatted}
    </span>
  );
}
