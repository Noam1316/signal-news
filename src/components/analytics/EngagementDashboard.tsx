'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/context';

interface Agent {
  id: number;
  name: string;
  persona: string;
  location: string;
  language: string;
  interests: string[];
  avgSessionMinutes: number;
  sessionsPerWeek: number;
  sectionsVisited: string[];
  favoriteFeature: string;
  criticism: string;
  retentionTrigger: string;
  engagementScore: number;
  churnRisk: string;
  lastVisit: string;
  totalVisits: number;
}

interface Metrics {
  totalAgents: number;
  activeToday: number;
  avgSessionMinutes: number;
  bounceRate: number;
  returnRate: number;
  topSections: { section: string; views: number; avgDwell: number }[];
  topCriticisms: { text: string; count: number; severity: string }[];
  retentionDrivers: { driver: string; count: number; impact: number }[];
  churnDistribution: { low: number; medium: number; high: number };
  personaBreakdown: { persona: string; count: number; avgEngagement: number }[];
  hourlyTraffic: { hour: number; visitors: number }[];
  featureRequests: { feature: string; votes: number; priority: string }[];
}

const PERSONA_ICONS: Record<string, string> = {
  analyst: '🔍', journalist: '📰', investor: '📈', policy: '🏛️',
  student: '🎓', techie: '💻', casual: '👤', activist: '✊',
};

const PERSONA_COLORS: Record<string, string> = {
  analyst: 'bg-blue-500', journalist: 'bg-purple-500', investor: 'bg-green-500', policy: 'bg-amber-500',
  student: 'bg-cyan-500', techie: 'bg-pink-500', casual: 'bg-gray-500', activist: 'bg-red-500',
};

const CHURN_COLORS: Record<string, string> = {
  low: 'bg-emerald-500', medium: 'bg-amber-500', high: 'bg-red-500',
};

const PRIORITY_STYLE: Record<string, string> = {
  p0: 'bg-red-500/15 text-red-400 border-red-500/20',
  p1: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  p2: 'bg-gray-800 text-gray-400 border-gray-700',
};

export default function EngagementDashboard() {
  const { lang } = useLanguage();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'agents' | 'criticisms' | 'features'>('overview');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents?view=full');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setAgents(data.agents);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !metrics) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-gray-800/50" />)}
        </div>
        <div className="h-64 rounded-xl bg-gray-800/50" />
      </div>
    );
  }

  const maxTraffic = Math.max(...metrics.hourlyTraffic.map(h => h.visitors));

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-yellow-400">📊</span>
            {lang === 'he' ? 'לוח מעורבות — 100 סוכנים' : 'Engagement Dashboard — 100 Agents'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {lang === 'he'
              ? 'סימולציית משתמשים דמו — ביקורות, שימור, ובקשות פיצ\'רים'
              : 'Demo user simulation — criticisms, retention & feature requests'}
          </p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          DEMO SIMULATION
        </span>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: lang === 'he' ? 'סה"כ סוכנים' : 'Total Agents', value: metrics.totalAgents, icon: '👥' },
          { label: lang === 'he' ? 'פעילים היום' : 'Active Today', value: metrics.activeToday, icon: '🟢' },
          { label: lang === 'he' ? 'שיעור חזרה' : 'Return Rate', value: `${metrics.returnRate}%`, icon: '🔄' },
          { label: lang === 'he' ? 'זמן ממוצע' : 'Avg Session', value: `${metrics.avgSessionMinutes}m`, icon: '⏱️' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase">{kpi.label}</span>
              <span className="text-sm">{kpi.icon}</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-900/80 rounded-xl p-1 border border-gray-800">
        {([
          { id: 'overview', en: 'Overview', he: 'סקירה', icon: '📊' },
          { id: 'agents', en: 'Agents (100)', he: 'סוכנים (100)', icon: '👥' },
          { id: 'criticisms', en: 'Criticisms', he: 'ביקורות', icon: '⚠️' },
          { id: 'features', en: 'Feature Requests', he: 'בקשות פיצ\'רים', icon: '✨' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-gray-800 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <span className="text-xs">{t.icon}</span>
            <span className="hidden sm:inline">{lang === 'he' ? t.he : t.en}</span>
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Hourly traffic chart */}
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">
              {lang === 'he' ? 'תעבורה שעתית (ישראל)' : 'Hourly Traffic (Israel Time)'}
            </h3>
            <div className="flex items-end gap-1 h-32">
              {metrics.hourlyTraffic.map((h) => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[8px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {h.visitors}
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-yellow-500/80 to-yellow-400/40 rounded-t transition-all"
                    style={{ height: `${(h.visitors / maxTraffic) * 100}%` }}
                  />
                  <span className="text-[8px] text-gray-600">{h.hour}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Persona breakdown + Churn distribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Persona breakdown */}
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">
                {lang === 'he' ? 'פילוח פרסונות' : 'Persona Breakdown'}
              </h3>
              <div className="space-y-2">
                {metrics.personaBreakdown.map(p => (
                  <div key={p.persona} className="flex items-center gap-2">
                    <span className="text-sm w-6 text-center">{PERSONA_ICONS[p.persona] || '👤'}</span>
                    <span className="text-xs text-gray-400 w-20 capitalize">{p.persona}</span>
                    <div className="flex-1 h-4 bg-gray-800 rounded-md overflow-hidden">
                      <div
                        className={`h-full ${PERSONA_COLORS[p.persona] || 'bg-gray-600'} rounded-md transition-all duration-700`}
                        style={{ width: `${p.count}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 w-6 text-end">{p.count}</span>
                    <span className="text-[10px] text-gray-600 w-10 text-end">{p.avgEngagement}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Churn risk */}
            <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">
                {lang === 'he' ? 'סיכון נטישה' : 'Churn Risk Distribution'}
              </h3>
              <div className="flex h-40 items-end gap-6 justify-center">
                {(['low', 'medium', 'high'] as const).map(level => {
                  const count = metrics.churnDistribution[level];
                  return (
                    <div key={level} className="flex flex-col items-center gap-2">
                      <span className="text-xl font-bold text-white">{count}</span>
                      <div
                        className={`w-16 ${CHURN_COLORS[level]} rounded-t-lg transition-all duration-700`}
                        style={{ height: `${count}%` }}
                      />
                      <span className="text-[10px] text-gray-500 capitalize">{level}</span>
                    </div>
                  );
                })}
              </div>

              {/* Top section usage */}
              <h3 className="text-sm font-semibold text-gray-300 pt-3 border-t border-gray-800">
                {lang === 'he' ? 'סקשנים פופולריים' : 'Top Sections'}
              </h3>
              <div className="space-y-1.5">
                {metrics.topSections.slice(0, 5).map(s => (
                  <div key={s.section} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 capitalize">{s.section}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{s.views} views</span>
                      <span className="text-gray-600">{s.avgDwell}s dwell</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Retention drivers */}
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">
              {lang === 'he' ? 'מה יגרום להם לחזור?' : 'What Would Bring Them Back?'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {metrics.retentionDrivers.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
                  <span className="text-lg font-bold text-yellow-400">{r.count}</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-300">{r.driver}</p>
                    <p className="text-[10px] text-gray-600">Impact Score: {r.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Agents Tab ── */}
      {tab === 'agents' && (
        <div className="space-y-3">
          {selectedAgent ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-xs text-yellow-400 hover:text-yellow-300"
              >
                ← {lang === 'he' ? 'חזרה לרשימה' : 'Back to list'}
              </button>
              <div className="p-5 rounded-xl bg-gray-900 border border-gray-800 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{PERSONA_ICONS[selectedAgent.persona] || '👤'}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedAgent.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">
                      {selectedAgent.persona} · {selectedAgent.location} · {selectedAgent.language}
                    </p>
                  </div>
                  <div className="ms-auto text-end">
                    <p className="text-2xl font-bold text-white">{selectedAgent.engagementScore}%</p>
                    <p className={`text-[10px] ${selectedAgent.churnRisk === 'low' ? 'text-emerald-400' : selectedAgent.churnRisk === 'medium' ? 'text-amber-400' : 'text-red-400'}`}>
                      {selectedAgent.churnRisk} churn risk
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">{lang === 'he' ? 'נושאים' : 'Interests'}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAgent.interests.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">{lang === 'he' ? 'סקשנים' : 'Sections'}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAgent.sectionsVisited.map(s => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center p-3 rounded-lg bg-gray-800/50">
                  <div>
                    <p className="text-lg font-bold text-white">{selectedAgent.totalVisits}</p>
                    <p className="text-[10px] text-gray-500">{lang === 'he' ? 'ביקורים' : 'Visits'}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{selectedAgent.avgSessionMinutes}m</p>
                    <p className="text-[10px] text-gray-500">{lang === 'he' ? 'זמן ממוצע' : 'Avg Session'}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{selectedAgent.sessionsPerWeek}/w</p>
                    <p className="text-[10px] text-gray-500">{lang === 'he' ? 'ביקורים בשבוע' : 'Visits/Week'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                    <p className="text-[10px] text-yellow-400 font-semibold mb-1">⭐ {lang === 'he' ? 'פיצ\'ר אהוב' : 'Favorite Feature'}</p>
                    <p className="text-xs text-gray-300">{selectedAgent.favoriteFeature}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <p className="text-[10px] text-red-400 font-semibold mb-1">⚠️ {lang === 'he' ? 'ביקורת' : 'Criticism'}</p>
                    <p className="text-xs text-gray-300">{selectedAgent.criticism}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-[10px] text-emerald-400 font-semibold mb-1">🔄 {lang === 'he' ? 'מה יחזיר אותי' : 'What Would Bring Me Back'}</p>
                    <p className="text-xs text-gray-300">{selectedAgent.retentionTrigger}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 transition-colors text-start"
                >
                  <span className="text-lg">{PERSONA_ICONS[agent.persona] || '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{agent.persona} · {agent.location}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-end">
                      <p className="text-sm font-bold text-white">{agent.engagementScore}%</p>
                      <p className="text-[10px] text-gray-600">{agent.totalVisits} visits</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${CHURN_COLORS[agent.churnRisk]}`} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Criticisms Tab ── */}
      {tab === 'criticisms' && (
        <div className="space-y-3">
          {metrics.topCriticisms.map((c, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-start gap-3">
              <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-bold ${
                c.severity === 'high'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                  : c.severity === 'medium'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}>
                {c.count}x
              </span>
              <p className="text-sm text-gray-300">{c.text}</p>
              <span className={`ms-auto text-[10px] capitalize ${
                c.severity === 'high' ? 'text-red-400' : c.severity === 'medium' ? 'text-amber-400' : 'text-gray-500'
              }`}>
                {c.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Feature Requests Tab ── */}
      {tab === 'features' && (
        <div className="space-y-3">
          {metrics.featureRequests.map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center gap-3">
              <span className="text-xl font-bold text-yellow-400 w-10 text-center">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{f.feature}</p>
                <p className="text-[10px] text-gray-500">{f.votes} {lang === 'he' ? 'הצבעות' : 'votes'}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${PRIORITY_STYLE[f.priority]}`}>
                {f.priority.toUpperCase()}
              </span>
              {/* Vote bar */}
              <div className="w-24 h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500/80 to-yellow-400/40 rounded-full"
                  style={{ width: `${(f.votes / 34) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
