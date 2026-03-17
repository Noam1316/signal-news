'use client';

import { useState } from 'react';
import { TimelinePoint } from '@/lib/types';
import { useLanguage } from '@/i18n/context';
import { likelihoodColor } from '@/lib/utils';

interface LikelihoodTimelineProps {
  timeline: TimelinePoint[];
  currentValue: number;
}

export default function LikelihoodTimeline({ timeline, currentValue }: LikelihoodTimelineProps) {
  const { t, lang } = useLanguage();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (timeline.length === 0) return null;

  const padding = { top: 20, right: 60, bottom: 40, left: 40 };
  const width = 600;
  const height = 200;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const yMin = 0;
  const yMax = 100;
  const yTicks = [0, 25, 50, 75, 100];

  const xScale = (i: number) => padding.left + (i / (timeline.length - 1)) * chartW;
  const yScale = (v: number) => padding.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  const points = timeline.map((p, i) => ({ x: xScale(i), y: yScale(p.value) }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  const areaPath =
    linePath +
    ` L${points[points.length - 1].x},${padding.top + chartH}` +
    ` L${points[0].x},${padding.top + chartH} Z`;

  const gradientId = 'timeline-gradient';
  const color = likelihoodColor(currentValue);

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Show ~5 x-axis labels evenly spaced
  const labelIndices: number[] = [];
  const step = Math.max(1, Math.floor((timeline.length - 1) / 4));
  for (let i = 0; i < timeline.length; i += step) {
    labelIndices.push(i);
  }
  if (!labelIndices.includes(timeline.length - 1)) {
    labelIndices.push(timeline.length - 1);
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: 200 }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={yScale(tick)}
              x2={padding.left + chartW}
              y2={yScale(tick)}
              stroke="#1f2937"
              strokeWidth={1}
            />
            <text
              x={padding.left - 8}
              y={yScale(tick) + 4}
              textAnchor="end"
              className="fill-gray-500"
              fontSize={10}
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} />

        {/* Data points */}
        {points.map((p, i) => {
          const hasEvent = !!timeline[i].event;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hasEvent ? 5 : 3}
                fill={hasEvent ? color : '#1f2937'}
                stroke={color}
                strokeWidth={hasEvent ? 2 : 1.5}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {/* Tooltip */}
              {hoveredIndex === i && hasEvent && (
                <g>
                  <rect
                    x={Math.min(p.x - 80, width - padding.right - 170)}
                    y={p.y - 36}
                    width={160}
                    height={24}
                    rx={4}
                    fill="#111827"
                    stroke="#374151"
                    strokeWidth={1}
                  />
                  <text
                    x={Math.min(p.x, width - padding.right - 90)}
                    y={p.y - 20}
                    textAnchor="middle"
                    className="fill-gray-200"
                    fontSize={10}
                  >
                    {t(timeline[i].event!)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* X-axis date labels */}
        {labelIndices.map((i) => (
          <text
            key={i}
            x={xScale(i)}
            y={padding.top + chartH + 20}
            textAnchor="middle"
            className="fill-gray-500"
            fontSize={10}
          >
            {formatShortDate(timeline[i].date)}
          </text>
        ))}

        {/* Current value label */}
        <text
          x={width - 10}
          y={yScale(currentValue) + 6}
          textAnchor="end"
          fill={color}
          fontSize={22}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {currentValue}
        </text>
      </svg>
    </div>
  );
}
