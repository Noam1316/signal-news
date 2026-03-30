'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';

interface DigestItem {
  type: 'alpha' | 'shock' | 'blindspot';
  icon: string;
  labelHe: string;
  labelEn: string;
  headlineHe: string;
  headlineEn: string;
  detailHe: string;
  detailEn: string;
  score?: number;
  scoreColor?: string;
}

function buildAlphaItem(polyData: any): DigestItem | null {
  const matches = polyData?.matches;
  if (!matches?.length) return null;
  const top = [...matches].sort((a: any, b: any) => b.alphaScore - a.alphaScore)[0];
  if (!top) return null;
  const dir = top.alphaDirection === 'signal-higher' ? 'higher' : 'lower';
  const dirHe = top.alphaDirection === 'signal-higher' ? 'גבוהה יותר' : 'נמוכה יותר';
  return {
    type: 'alpha',
    icon: '📈',
    labelHe: 'הזדמנות Alpha מובילה',
    labelEn: 'Top Alpha Opportunity',
    headlineHe: top.topic || top.polymarketTitle,
    headlineEn: top.topic || top.polymarketTitle,
    detailHe: `Signal: ${top.signalLikelihood}% · שוק: ${top.marketProbability}% · פער: ${Math.abs(top.delta)}%  — Signal ${dirHe} מהשוק`,
    detailEn: `Signal: ${top.signalLikelihood}% · Market: ${top.marketProbability}% · Gap: ${Math.abs(top.delta)}%  — Signal ${dir} than market`,
    score: top.alphaScore,
    scoreColor: top.alphaScore >= 60 ? 'text-yellow-400' : 'text-amber-400',
  };
}

function buildShockItem(shocksData: any): DigestItem | null {
  const shocks = shocksData?.shocks;
  if (!shocks?.length) return null;
  const top = shocks.find((s: any) => s.confidence === 'high') || shocks[0];
  if (!top) return null;
  const typeLabels: Record<string, { he: string; en: string }> = {
    'likelihood-spike': { he: 'קפיצת סבירות', en: 'Likelihood Spike' },
    'narrative-split':  { he: 'פיצול נרטיב',  en: 'Narrative Split' },
    'fragmentation':    { he: 'פיצול תקשורתי', en: 'Media Fragmentation' },
  };
  const typeLabel = typeLabels[top.type] ?? { he: top.type, en: top.type };
  const headlineHe = typeof top.headline === 'object' ? top.headline.he : top.headline;
  const headlineEn = typeof top.headline === 'object' ? top.headline.en : top.headline;
  return {
    type: 'shock',
    icon: '⚡',
    labelHe: 'זעזוע פעיל',
    labelEn: 'Active Shock',
    headlineHe: headlineHe || headlineEn,
    headlineEn: headlineEn || headlineHe,
    detailHe: `${typeLabel.he} · ${top.sourceCount || 0} מקורות · ביטחון: ${top.confidence === 'high' ? 'גבוה' : top.confidence === 'medium' ? 'בינוני' : 'נמוך'}`,
    detailEn: `${typeLabel.en} · ${top.sourceCount || 0} sources · confidence: ${top.confidence}`,
    score: top.confidence === 'high' ? 90 : top.confidence === 'medium' ? 60 : 30,
    scoreColor: top.confidence === 'high' ? 'text-red-400' : 'text-orange-400',
  };
}

function buildBlindspotItem(biasData: any): DigestItem | null {
  const gaps = biasData?.coverageGaps;
  if (!gaps?.length) return null;
  const top = gaps[0];
  if (!top) return null;
  const sidesHe = (top.coveredBySides || []).join(', ');
  const sidesEn = sidesHe;
  return {
    type: 'blindspot',
    icon: '🏛️',
    labelHe: 'נקודת עיוורון תקשורתית',
    labelEn: 'Media Blind Spot',
    headlineHe: top.topicHe || top.topic,
    headlineEn: top.topic,
    detailHe: `מכוסה רק ע"י ${sidesHe} · ${top.articleCount || 0} כתבות · ${top.missingFromSides?.join(', ') || ''} שותקים`,
    detailEn: `Covered only by ${sidesEn} · ${top.articleCount || 0} articles · ${top.missingFromSides?.join(', ') || ''} silent`,
    score: top.severity === 'high' ? 85 : top.severity === 'medium' ? 55 : 30,
    scoreColor: top.severity === 'high' ? 'text-purple-400' : 'text-violet-400',
  };
}

const TYPE_STYLES = {
  alpha: {
    border: 'border-yellow-400/25',
    bg: 'bg-yellow-400/5',
    accent: 'bg-yellow-400/20 text-yellow-300',
  },
  shock: {
    border: 'border-red-500/25',
    bg: 'bg-red-500/5',
    accent: 'bg-red-500/20 text-red-300',
  },
  blindspot: {
    border: 'border-purple-500/25',
    bg: 'bg-purple-500/5',
    accent: 'bg-purple-500/20 text-purple-300',
  },
};

export default function IntelDigest() {
  const { lang } = useLanguage();
  const [items, setItems] = useState<DigestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch('/api/polymarket').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/shocks').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/bias').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([polyData, shocksData, biasData]) => {
      if (cancelled) return;
      const built: DigestItem[] = [
        buildAlphaItem(polyData),
        buildShockItem(shocksData),
        buildBlindspotItem(biasData),
      ].filter(Boolean) as DigestItem[];
      setItems(built);
      setUpdatedAt(new Date().toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' }));
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [lang]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-3 animate-pulse">
        <div className="h-4 w-40 bg-gray-800 rounded" />
        {[0, 1, 2].map(i => (
          <div key={i} className="h-16 bg-gray-800/60 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            {lang === 'he' ? 'תדריך מודיעין' : 'Intelligence Digest'}
          </span>
        </div>
        <span className="text-[10px] text-gray-600">
          {lang === 'he' ? `עודכן ${updatedAt}` : `Updated ${updatedAt}`}
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-800/60">
        {items.map((item, idx) => {
          const styles = TYPE_STYLES[item.type];
          const headline = lang === 'he' ? item.headlineHe : item.headlineEn;
          const detail = lang === 'he' ? item.detailHe : item.detailEn;
          const label = lang === 'he' ? item.labelHe : item.labelEn;

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 px-4 py-3 ${styles.bg} border-s-2 ${styles.border} transition-all`}
            >
              {/* Icon */}
              <span className="text-base mt-0.5 shrink-0">{item.icon}</span>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${styles.accent}`}>
                    {label}
                  </span>
                  {item.score !== undefined && (
                    <span className={`text-[10px] font-mono font-bold ${item.scoreColor}`}>
                      {item.score}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-white truncate">{headline}</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">{detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-800 bg-gray-900/30">
        <p className="text-[10px] text-gray-600">
          {lang === 'he'
            ? 'מחושב מ-28+ מקורות RSS · ניתוח keyword-based · ללא LLM'
            : 'Computed from 28+ RSS feeds · keyword-based analysis · no LLM'}
        </p>
      </div>
    </div>
  );
}
