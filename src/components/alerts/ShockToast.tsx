'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import type { ShockToast as ShockToastType } from '@/hooks/useShockAlerts';

const AUTO_DISMISS_MS = 8000;

interface Props {
  toast: ShockToastType;
  onDismiss: (id: string) => void;
}

export default function ShockToast({ toast, onDismiss }: Props) {
  const { lang } = useLanguage();
  const { shock } = toast;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const headline = lang === 'he' ? shock.headline?.he : shock.headline?.en;
  const whatMoved = lang === 'he' ? shock.whatMoved?.he : shock.whatMoved?.en;

  const borderColor =
    shock.confidence === 'high'
      ? 'border-red-500/60'
      : shock.confidence === 'medium'
      ? 'border-yellow-500/60'
      : 'border-gray-600/60';

  const badgeColor =
    shock.confidence === 'high'
      ? 'bg-red-500/20 text-red-400'
      : shock.confidence === 'medium'
      ? 'bg-yellow-500/20 text-yellow-400'
      : 'bg-gray-700 text-gray-400';

  return (
    <div
      className={`w-80 rounded-xl bg-gray-900/95 backdrop-blur-md border ${borderColor} shadow-2xl p-4 flex flex-col gap-2
                  animate-in slide-in-from-right-5 duration-300`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-base">⚡</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeColor}`}>
            {lang === 'he' ? 'זעזוע חדש' : 'New Shock'}
          </span>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-gray-600 hover:text-gray-400 transition-colors"
          aria-label="dismiss"
        >
          ✕
        </button>
      </div>

      {/* Headline */}
      <p className="text-sm font-semibold text-white leading-snug line-clamp-2" dir={lang === 'he' ? 'rtl' : 'ltr'}>
        {headline}
      </p>

      {/* What moved */}
      {whatMoved && (
        <p className="text-xs text-gray-400 line-clamp-2" dir={lang === 'he' ? 'rtl' : 'ltr'}>
          {whatMoved}
        </p>
      )}

      {/* Delta */}
      {shock.delta !== undefined && (
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-gray-500">{lang === 'he' ? 'שינוי:' : 'Δ:'}</span>
          <span className={`font-bold ${shock.delta > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {shock.delta > 0 ? '+' : ''}{shock.delta}%
          </span>
          <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${badgeColor}`}>
            {shock.confidence}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400/50 rounded-full"
          style={{ animation: `shrink ${AUTO_DISMISS_MS}ms linear forwards` }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
