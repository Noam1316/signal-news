'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import type { ShockEvent, ShockType, ShockStatus, BriefStory } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import ShockTypeBadge from '@/components/shocks/ShockTypeBadge';
import ConfidenceBadge from '@/components/shared/ConfidenceBadge';
import SourceList from '@/components/shared/SourceList';

interface ShockCardProps {
  shock: ShockEvent;
}

const STATUS_CONFIG: Record<ShockStatus, { icon: string; heLabel: string; enLabel: string; cls: string }> = {
  fresh:  { icon: '🔥', heLabel: 'חדש',    enLabel: 'Fresh',    cls: 'text-red-400 bg-red-500/10 border-red-500/30' },
  active: { icon: '🟡', heLabel: 'פעיל',   enLabel: 'Active',   cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  fading: { icon: '🔽', heLabel: 'דועך',   enLabel: 'Fading',   cls: 'text-gray-400 bg-gray-700/40 border-gray-600/30' },
};

const TYPE_CONFIG: Record<ShockType, {
  border: string;
  accentColor: string;
  bgBox: string;
  borderBox: string;
  icon: string;
  labelHe: string;
  labelEn: string;
  deltaLabelHe: string;
  deltaLabelEn: string;
}> = {
  likelihood: {
    border: 'border-l-orange-500',
    accentColor: 'text-orange-400',
    bgBox: 'bg-orange-500/8',
    borderBox: 'border-orange-500/20',
    icon: '📈',
    labelHe: 'זעזוע סבירות',
    labelEn: 'Likelihood Shock',
    deltaLabelHe: 'שינוי בסבירות',
    deltaLabelEn: 'likelihood shift',
  },
  narrative: {
    border: 'border-l-purple-500',
    accentColor: 'text-purple-400',
    bgBox: 'bg-purple-500/8',
    borderBox: 'border-purple-500/20',
    icon: '🗣️',
    labelHe: 'פיצול נרטיב',
    labelEn: 'Narrative Split',
    deltaLabelHe: 'פער בין נרטיבים',
    deltaLabelEn: 'narrative gap',
  },
  fragmentation: {
    border: 'border-l-teal-500',
    accentColor: 'text-teal-400',
    bgBox: 'bg-teal-500/8',
    borderBox: 'border-teal-500/20',
    icon: '💥',
    labelHe: 'פיצול כיסוי',
    labelEn: 'Coverage Burst',
    deltaLabelHe: 'עלייה בכיסוי',
    deltaLabelEn: 'coverage surge',
  },
};

/** Build the "core of dispute" text — specific per shock, not generic */
function buildDisputeCore(shock: ShockEvent, lang: 'he' | 'en'): string {
  const isHe = lang === 'he';
  const whyNow   = isHe ? (shock.whyNow?.he   || shock.whyNow?.en   || '') : (shock.whyNow?.en   || shock.whyNow?.he   || '');
  const whoDriv  = isHe ? (shock.whoDriving?.he || shock.whoDriving?.en || '') : (shock.whoDriving?.en || shock.whoDriving?.he || '');
  const whatMov  = isHe ? (shock.whatMoved?.he  || shock.whatMoved?.en  || '') : (shock.whatMoved?.en  || shock.whatMoved?.he  || '');
  const delta    = shock.delta;
  const absDelta = Math.abs(delta);

  if (shock.type === 'narrative') {
    // For narrative splits: "X argues A, while Y argues B" — derive from whyNow + whoDriving
    if (whyNow && whoDriv) {
      return isHe
        ? `המחלוקת: ${whatMov ? whatMov + ' — ' : ''}${whoDriv} ${whyNow}`
        : `The dispute: ${whatMov ? whatMov + ' — ' : ''}${whoDriv} ${whyNow}`;
    }
    return isHe
      ? `מחלוקת על: ${whatMov || 'ראה פרטים מטה'}`
      : `Dispute over: ${whatMov || 'see details below'}`;
  }

  if (shock.type === 'likelihood') {
    // "The core question: will X happen? Signal moved +N% because of Y"
    const dirHe = delta > 0 ? 'עלתה' : 'ירדה';
    const dirEn = delta > 0 ? 'rose' : 'fell';
    const becauseHe = whyNow ? ` — ${whyNow}` : '';
    const becauseEn = whyNow ? ` — ${whyNow}` : '';
    const driverHe  = whoDriv ? ` (מונע על ידי: ${whoDriv})` : '';
    const driverEn  = whoDriv ? ` (driven by: ${whoDriv})` : '';
    return isHe
      ? `הסבירות ${dirHe} ב-${absDelta}%${becauseHe}${driverHe}`
      : `Likelihood ${dirEn} by ${absDelta}%${becauseEn}${driverEn}`;
  }

  // fragmentation
  const srcHe = whoDriv ? `מקורות: ${whoDriv}` : '';
  const srcEn = whoDriv ? `Sources: ${whoDriv}` : '';
  const trigHe = whyNow ? `הטריגר: ${whyNow}` : '';
  const trigEn = whyNow ? `Trigger: ${whyNow}` : '';
  return isHe
    ? [srcHe, trigHe].filter(Boolean).join(' — ') || whatMov
    : [srcEn, trigEn].filter(Boolean).join(' — ') || whatMov;
}

/** Generic explanation of WHY this type = shock (statistical) */
function buildTypeExplanation(shock: ShockEvent, lang: 'he' | 'en', windowStr: string): string {
  const isHe = lang === 'he';
  const abs = Math.abs(shock.delta);

  if (shock.type === 'likelihood') {
    return isHe
      ? `שינוי של ${abs}% ${windowStr} חורג מרעש הרקע הסטטיסטי — המערכת מסמנת אנומליה.`
      : `A ${abs}% shift ${windowStr} exceeds normal statistical noise — system flags an anomaly.`;
  }
  if (shock.type === 'narrative') {
    return isHe
      ? `פער חריג בין מקורות שמאל לימין על אותו אירוע — ${windowStr}.`
      : `Unusual gap between left and right sources on the same event — ${windowStr}.`;
  }
  return isHe
    ? `נושא שנכנס בו-זמנית לכותרות מספר חריג של מקורות ${windowStr} — דפוס שוברי שגרה.`
    : `Topic appeared across an unusually high number of sources ${windowStr} — a breaking pattern.`;
}

export default function ShockCard({ shock }: ShockCardProps) {
  const { lang, dir, t, ui } = useLanguage();
  const [relatedStory, setRelatedStory] = useState<BriefStory | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!shock.relatedStorySlug) return;
    fetch('/api/stories')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const match = (data?.stories as BriefStory[] | undefined)?.find(
          s => s.slug === shock.relatedStorySlug
        );
        if (match) setRelatedStory(match);
      })
      .catch(() => {});
  }, [shock.relatedStorySlug]);

  const cfg = TYPE_CONFIG[shock.type];
  const isHigh = shock.confidence === 'high';
  const windowStr = t(shock.timeWindow);

  const disputeCore  = buildDisputeCore(shock, lang);
  const typeExplain  = buildTypeExplanation(shock, lang, windowStr);

  return (
    <article
      dir={dir}
      className={`rounded-xl bg-gray-900/80 border border-gray-800 border-l-4 ${cfg.border} p-5 space-y-3 shadow-lg ${isHigh ? 'animate-pulse-glow' : ''} card-glow`}
    >
      {/* ── Top row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShockTypeBadge type={shock.type} />
          {isHigh && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 animate-pulse">
              {lang === 'he' ? '⚠️ דחוף' : '⚠️ Urgent'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {shock.status && (() => {
            const sc = STATUS_CONFIG[shock.status];
            return (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${sc.cls}`}>
                {sc.icon} {lang === 'he' ? sc.heLabel : sc.enLabel}
              </span>
            );
          })()}
          <span className="text-xs text-gray-500">{timeAgo(shock.timestamp, lang)}</span>
        </div>
      </div>

      {/* ── Headline + delta ── */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug text-white flex-1">{t(shock.headline)}</h3>
        {shock.delta !== 0 && (
          <div className="shrink-0 text-center min-w-[60px]">
            <div className={`text-2xl font-black leading-none ${shock.delta > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
              {shock.delta > 0 ? '+' : ''}{shock.delta}%
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5 leading-tight">
              {lang === 'he' ? cfg.deltaLabelHe : cfg.deltaLabelEn}
            </div>
          </div>
        )}
      </div>

      {/* ── לב המחלוקת — SPECIFIC to this shock ── */}
      <div className={`rounded-lg px-3 py-2.5 border space-y-1.5 ${cfg.bgBox} ${cfg.borderBox}`}>
        {/* Title */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{cfg.icon}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.accentColor}`}>
            {lang === 'he' ? 'לב המחלוקת' : 'Core of the Dispute'}
          </span>
        </div>
        {/* Specific dispute text */}
        <p className="text-sm text-gray-200 leading-relaxed font-medium">{disputeCore}</p>
        {/* Divider */}
        <div className="border-t border-gray-700/40 pt-1.5">
          {/* Generic type explanation */}
          <p className="text-[11px] text-gray-400 leading-relaxed">{typeExplain}</p>
        </div>
      </div>

      {/* ── Related story ── */}
      {relatedStory && (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-yellow-400/5 border border-yellow-400/20 cursor-pointer hover:border-yellow-400/50 hover:bg-yellow-400/10 transition-colors"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[9px] text-yellow-400/70 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <span>📋</span>
              {lang === 'he' ? 'סיפור קשור מהתקציר' : 'Related story from Brief'}
            </p>
            <p className="text-xs text-yellow-100 font-medium truncate">
              {lang === 'he' ? relatedStory.headline?.he : relatedStory.headline?.en}
            </p>
          </div>
          <div className="shrink-0 text-center">
            <div className="text-sm font-bold text-yellow-400">{relatedStory.likelihood}%</div>
            <div className={`text-[9px] font-medium ${relatedStory.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {relatedStory.delta >= 0 ? '+' : ''}{relatedStory.delta}%
            </div>
          </div>
        </div>
      )}

      {/* ── Expand toggle ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-[11px] text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1 cursor-pointer pt-0.5"
      >
        {expanded ? '▲' : '▼'}
        {expanded
          ? (lang === 'he' ? 'פחות פרטים' : 'Less detail')
          : (lang === 'he' ? 'פרטים נוספים — מי מניע, מתי, מקורות' : 'More detail — drivers, timing, sources')}
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="space-y-3 pt-1 border-t border-gray-800/60">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium flex items-center gap-1 mb-1">
              🕐 {ui('whyNow')}
            </span>
            <p className="text-sm text-gray-300 leading-relaxed">{t(shock.whyNow)}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium flex items-center gap-1 mb-1">
              🎯 {ui('whoDriving')}
            </span>
            <p className="text-sm text-gray-300 leading-relaxed">{t(shock.whoDriving)}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <span className="text-xs text-gray-500">{t(shock.timeWindow)}</span>
            <ConfidenceBadge confidence={shock.confidence} />
          </div>
          <SourceList sources={shock.sources} />
        </div>
      )}

      {/* ── Collapsed: confidence + sources ── */}
      {!expanded && (
        <div className="flex items-center justify-between pt-0.5">
          <ConfidenceBadge confidence={shock.confidence} />
          <SourceList sources={shock.sources} />
        </div>
      )}
    </article>
  );
}
