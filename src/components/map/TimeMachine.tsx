'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/i18n/context';

const RISK_HISTORY_KEY = 'signal_risk_history';

interface RiskSnapshot { v: number; t: number; }

function loadRiskHistory(): RiskSnapshot[] {
  try { return JSON.parse(localStorage.getItem(RISK_HISTORY_KEY) || '[]'); } catch { return []; }
}

function formatTs(ts: number, lang: string): string {
  try {
    return new Date(ts).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

function riskColor(v: number): string {
  if (v >= 66) return '#f87171';
  if (v >= 34) return '#fb923c';
  return '#34d399';
}

function riskLabel(v: number, lang: string): string {
  if (v >= 66) return lang === 'he' ? 'גבוה' : 'HIGH';
  if (v >= 34) return lang === 'he' ? 'בינוני' : 'MED';
  return lang === 'he' ? 'נמוך' : 'LOW';
}

export default function TimeMachine() {
  const { lang, dir } = useLanguage();
  const [history, setHistory] = useState<RiskSnapshot[]>([]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const h = loadRiskHistory();
    setHistory(h);
    setCursor(h.length > 0 ? h.length - 1 : 0);
  }, []);

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    setPlaying(true);
    setCursor(0);
    intervalRef.current = setInterval(() => {
      setCursor(prev => {
        if (prev >= history.length - 1) {
          stopPlayback();
          return history.length - 1;
        }
        return prev + 1;
      });
    }, 400);
  }, [history.length, stopPlayback]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  if (history.length < 2) {
    return (
      <div dir={dir} className="rounded-xl bg-gray-900 border border-gray-800 p-10 text-center space-y-3">
        <div className="text-4xl">🕰️</div>
        <p className="text-gray-400 text-sm font-medium">
          {lang === 'he'
            ? 'Time Machine יתמלא עם הביקורים הבאים'
            : 'Time Machine fills with future visits'}
        </p>
        <p className="text-gray-600 text-xs font-mono">
          {lang === 'he' ? 'צריך לפחות 2 נקודות היסטוריה — חזור מחר 📡' : 'Need ≥2 history points — come back tomorrow 📡'}
        </p>
      </div>
    );
  }

  const current = history[Math.min(cursor, history.length - 1)];
  const minV = Math.min(...history.map(h => h.v));
  const maxV = Math.max(...history.map(h => h.v));
  const range = maxV - minV || 1;

  return (
    <div dir={dir} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-lg">🕰️</span>
          <h3 className="font-bold text-white">
            {lang === 'he' ? 'Time Machine — היסטוריית מתח' : 'Time Machine — Tension History'}
          </h3>
        </div>
        <span className="text-[10px] text-gray-500 font-mono bg-gray-900 px-2 py-1 rounded border border-gray-800">
          {history.length} {lang === 'he' ? 'נקודות' : 'data points'}
        </span>
      </div>

      <div className="rounded-xl bg-gray-900 border border-gray-800 p-5 space-y-5">
        {/* Timestamp + position */}
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
            {formatTs(current.t, lang)}
          </span>
          <span className="text-gray-600">[{cursor + 1}/{history.length}]</span>
        </div>

        {/* Big gauge + stats */}
        <div className="flex items-center gap-6">
          <svg viewBox="0 0 80 50" width="110" height="70" className="shrink-0">
            {/* Track */}
            <path d="M 8 44 A 32 32 0 0 1 72 44" fill="none" stroke="#1f2937" strokeWidth="8" strokeLinecap="round" />
            {/* Fill */}
            <path
              d="M 8 44 A 32 32 0 0 1 72 44"
              fill="none" stroke={riskColor(current.v)} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(current.v / 100) * 100.5} 100.5`}
              style={{ transition: playing ? 'none' : 'stroke-dasharray 0.5s ease' }}
            />
            <text x="40" y="35" textAnchor="middle" fontSize="18" fontWeight="900"
              fill={riskColor(current.v)} fontFamily="monospace">
              {Math.round(current.v / 10)}
            </text>
            <text x="40" y="46" textAnchor="middle" fontSize="7" fill="#6b7280">
              /10
            </text>
          </svg>

          <div className="flex-1 space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono" style={{ color: riskColor(current.v) }}>
                {current.v}
              </span>
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: riskColor(current.v) }}>
                {riskLabel(current.v, lang)}
              </span>
            </div>
            {cursor > 0 && (() => {
              const delta = current.v - history[cursor - 1].v;
              const sign = delta > 0 ? '+' : '';
              const dColor = delta > 0 ? '#f87171' : delta < 0 ? '#34d399' : '#6b7280';
              return (
                <div className="text-xs font-mono" style={{ color: dColor }}>
                  {sign}{delta} {lang === 'he' ? 'מנקודה קודמת' : 'vs prev snapshot'}
                </div>
              );
            })()}
            <div className="flex gap-3 text-[10px] font-mono mt-1">
              <span className="text-gray-500">MIN <span className="text-emerald-400 font-bold">{minV}</span></span>
              <span className="text-gray-500">MAX <span className="text-red-400 font-bold">{maxV}</span></span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-20 flex items-end gap-px rounded overflow-hidden bg-gray-950/50 p-1">
          {history.map((snap, i) => {
            const heightPct = 10 + ((snap.v - minV) / range) * 85;
            const isCurrent = i === cursor;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm cursor-pointer transition-all duration-75"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isCurrent ? '#fbbf24' : riskColor(snap.v),
                  opacity: isCurrent ? 1 : i < cursor ? 0.6 : 0.25,
                  transform: isCurrent ? 'scaleY(1.05)' : 'scaleY(1)',
                }}
                onClick={() => { stopPlayback(); setCursor(i); }}
                title={`${snap.v} — ${formatTs(snap.t, lang)}`}
              />
            );
          })}
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={history.length - 1}
          value={cursor}
          onChange={e => { stopPlayback(); setCursor(Number(e.target.value)); }}
          className="w-full accent-yellow-400 cursor-pointer h-1"
        />

        {/* Playback controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { stopPlayback(); setCursor(0); }}
            className="px-2.5 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-400 hover:text-white text-xs transition-colors"
            title={lang === 'he' ? 'התחלה' : 'Reset to start'}
          >⏮</button>
          <button
            onClick={playing ? stopPlayback : startPlayback}
            className={`flex-1 py-1.5 rounded border text-xs font-bold transition-colors ${
              playing
                ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30'
                : 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20'
            }`}
          >
            {playing ? '⏸ ' : '▶ '}
            {playing
              ? (lang === 'he' ? 'עצור' : 'Pause')
              : (lang === 'he' ? 'הפעל' : 'Play')}
          </button>
          <button
            onClick={() => { stopPlayback(); setCursor(history.length - 1); }}
            className="px-2.5 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-400 hover:text-white text-xs transition-colors"
            title={lang === 'he' ? 'סוף' : 'Jump to end'}
          >⏭</button>
        </div>
      </div>
    </div>
  );
}
