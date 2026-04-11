'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/context';
import type { MarketInstrument } from '@/services/market-data';

interface MarketPulseProps {
  topics?: string[];   // filter by topic — show only relevant instruments
  showAll?: boolean;   // override: show all instruments regardless of topic
}

const CATEGORY_LABEL: Record<string, { he: string; en: string; icon: string }> = {
  'energy':     { he: 'אנרגיה',      en: 'Energy',       icon: '🛢️' },
  'safe-haven': { he: 'נכסי מקלט',   en: 'Safe Haven',   icon: '🛡️' },
  'israel':     { he: 'שוק ישראלי',  en: 'Israeli Market', icon: '🇮🇱' },
  'defense':    { he: 'מניות ביטחון', en: 'Defense',      icon: '🎯' },
  'bonds':      { he: 'אג"ח',        en: 'Bonds',         icon: '📊' },
};

function ChangeChip({ pct, currency }: { pct: number; currency: string }) {
  const positive = pct > 0;
  const neutral = Math.abs(pct) < 0.05;
  const color = neutral
    ? 'text-gray-400 bg-gray-800'
    : positive
      ? 'text-emerald-400 bg-emerald-400/10'
      : 'text-red-400 bg-red-400/10';
  const arrow = neutral ? '—' : positive ? '▲' : '▼';
  // For bonds/VIX: rising is bad (red), for others: rising is good (green)
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold font-mono ${color}`}>
      {arrow} {Math.abs(pct).toFixed(2)}%
    </span>
  );
}

function formatPrice(price: number, currency: string, symbol: string): string {
  if (currency === '%' || symbol === '^TNX') return `${price.toFixed(2)}%`;
  if (currency === 'ILS') {
    if (symbol === 'ILS=X') return `₪${price.toFixed(3)}`;
    return `₪${price.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
  }
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${price.toFixed(2)}`;
}

export default function MarketPulse({ topics, showAll = false }: MarketPulseProps) {
  const { lang, dir } = useLanguage();
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string>('');

  useEffect(() => {
    fetch('/api/market-data')
      .then(r => r.json())
      .then(d => {
        let data: MarketInstrument[] = d.instruments ?? [];
        // Filter by relevant topics unless showAll
        if (!showAll && topics && topics.length > 0) {
          const topicSet = new Set(topics);
          data = data.filter(inst =>
            inst.relevantTopics.some(t => topicSet.has(t))
          );
        }
        setInstruments(data);
        setFetchedAt(d.fetchedAt ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [topics, showAll]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600 text-xs py-4 justify-center">
        <span className="animate-pulse">⏳</span>
        {lang === 'he' ? 'טוען נתוני שוק...' : 'Loading market data...'}
      </div>
    );
  }

  if (instruments.length === 0) {
    return (
      <div className="text-gray-600 text-xs text-center py-3">
        {lang === 'he' ? 'אין נתוני שוק זמינים' : 'No market data available'}
      </div>
    );
  }

  // Group by category
  const byCategory = instruments.reduce<Record<string, MarketInstrument[]>>((acc, inst) => {
    if (!acc[inst.category]) acc[inst.category] = [];
    acc[inst.category].push(inst);
    return acc;
  }, {});

  const categoryOrder = ['energy', 'safe-haven', 'israel', 'defense', 'bonds'];

  return (
    <div dir={dir} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
          {lang === 'he' ? 'מדדי שוק רלוונטיים' : 'Relevant Market Indicators'}
        </h3>
        {fetchedAt && (
          <span className="text-[10px] text-gray-600">
            {lang === 'he' ? 'עודכן' : 'Updated'}{' '}
            {new Date(fetchedAt).toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Categories */}
      {categoryOrder
        .filter(cat => byCategory[cat]?.length > 0)
        .map(cat => {
          const label = CATEGORY_LABEL[cat];
          const items = byCategory[cat];
          return (
            <div key={cat}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">{label.icon}</span>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {lang === 'he' ? label.he : label.en}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map(inst => (
                  <div
                    key={inst.symbol}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-white truncate">
                        {lang === 'he' ? inst.nameHe : inst.name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {formatPrice(inst.price, inst.currency, inst.symbol)}
                      </div>
                    </div>
                    <ChangeChip pct={inst.changePct} currency={inst.currency} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      {/* Overall market sentiment summary */}
      <MarketSentimentBar instruments={instruments} lang={lang} />
    </div>
  );
}

function MarketSentimentBar({ instruments, lang }: { instruments: MarketInstrument[]; lang: string }) {
  if (instruments.length < 3) return null;

  // Risk-on vs risk-off analysis
  const vix = instruments.find(i => i.symbol === '^VIX');
  const gold = instruments.find(i => i.symbol === 'GC=F');
  const oil = instruments.find(i => i.symbol === 'CL=F');
  const ils = instruments.find(i => i.symbol === 'ILS=X');

  const riskSignals: string[] = [];
  let riskScore = 0; // positive = more risk/fear

  if (vix && vix.changePct > 3) { riskScore += 2; riskSignals.push(lang === 'he' ? 'VIX עולה חדות' : 'VIX surging'); }
  if (gold && gold.changePct > 0.5) { riskScore += 1; riskSignals.push(lang === 'he' ? 'זהב עולה' : 'Gold rising'); }
  if (oil && oil.changePct > 2) { riskScore += 1; riskSignals.push(lang === 'he' ? 'נפט קופץ' : 'Oil spiking'); }
  if (ils && ils.changePct > 0.3) { riskScore += 1; riskSignals.push(lang === 'he' ? 'שקל נחלש' : 'Shekel weakening'); }
  if (vix && vix.changePct < -3) { riskScore -= 2; }
  if (gold && gold.changePct < -0.5) { riskScore -= 1; }

  if (riskSignals.length === 0) return null;

  const sentiment = riskScore >= 3
    ? { label: lang === 'he' ? 'שווקים מתמחרים סיכון גבוה' : 'Markets pricing HIGH risk', color: 'text-red-400 border-red-400/20 bg-red-400/5' }
    : riskScore >= 1
      ? { label: lang === 'he' ? 'אותות סיכון מתונים בשווקים' : 'Moderate risk signals in markets', color: 'text-amber-400 border-amber-400/20 bg-amber-400/5' }
      : { label: lang === 'he' ? 'שווקים רגועים יחסית' : 'Markets relatively calm', color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' };

  return (
    <div className={`px-3 py-2 rounded-lg border text-xs ${sentiment.color}`}>
      <span className="font-bold">{sentiment.label}</span>
      {riskSignals.length > 0 && (
        <span className="text-gray-400 ms-2">· {riskSignals.join(', ')}</span>
      )}
    </div>
  );
}
