'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/context';

interface SourceEvidence {
  sourceId: string;
  sourceName: string;
  factualRating: string;
  factualWeight: number;
  bias: string;
  isIndependent: boolean;
  title: string;
}

interface ContradictionAlert {
  topic: string;
  type: string;
  description: string;
  descriptionHe: string;
  severity: string;
  sideA: { sources: string[]; claim: string; sentiment: string };
  sideB: { sources: string[]; claim: string; sentiment: string };
  recommendation: string;
  recommendationHe: string;
}

interface MethodologyBreakdown {
  factor: string;
  factorHe: string;
  weight: number;
  rawValue: number;
  weightedValue: number;
  explanation: string;
  explanationHe: string;
  dataPoints: number;
  reliability: string;
}

interface Report {
  topic: string;
  overallGrade: string;
  overallScore: number;
  isReliable: boolean;
  sourceEvidence: SourceEvidence[];
  independentSourceCount: number;
  totalSourceCount: number;
  avgFactualRating: number;
  contradictions: ContradictionAlert[];
  hasContradictions: boolean;
  methodology: MethodologyBreakdown[];
  freshness: number;
  oldestArticleHoursAgo: number;
  newestArticleHoursAgo: number;
  decayPenalty: number;
  uncertaintyLevel: string;
  uncertaintyReason?: string;
  uncertaintyReasonHe?: string;
  displayRecommendation: string;
  warningMessage?: string;
  warningMessageHe?: string;
}

interface CredData {
  reports: Report[];
  summary: {
    totalTopics: number;
    avgCredibility: number;
    gradeDistribution: Record<string, number>;
    totalContradictions: number;
    topicsWithInsufficientData: number;
    reliableTopics: number;
  };
}

const GRADE_STYLE: Record<string, { bg: string; text: string }> = {
  A: { bg: 'bg-emerald-500', text: 'text-emerald-400' },
  B: { bg: 'bg-green-500', text: 'text-green-400' },
  C: { bg: 'bg-amber-500', text: 'text-amber-400' },
  D: { bg: 'bg-orange-500', text: 'text-orange-400' },
  F: { bg: 'bg-red-500', text: 'text-red-400' },
  INSUFFICIENT: { bg: 'bg-gray-600', text: 'text-gray-400' },
};

const UNCERTAINTY_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: '✓' },
  moderate: { bg: 'bg-amber-500/15', text: 'text-amber-400', icon: '⚠' },
  high: { bg: 'bg-red-500/15', text: 'text-red-400', icon: '⚠' },
  insufficient: { bg: 'bg-gray-800', text: 'text-gray-500', icon: '✗' },
};

const RELIABILITY_DOTS: Record<string, string> = {
  strong: 'bg-emerald-500',
  moderate: 'bg-amber-500',
  weak: 'bg-red-500',
};

const SEVERITY_STYLE: Record<string, string> = {
  low: 'border-amber-500/20 bg-amber-500/5',
  medium: 'border-orange-500/20 bg-orange-500/5',
  high: 'border-red-500/20 bg-red-500/5',
};

export default function CredibilityDashboard() {
  const { lang } = useLanguage();
  const [data, setData] = useState<CredData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [view, setView] = useState<'overview' | 'reports'>('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/credibility');
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-gray-800/50" />)}
        </div>
        <div className="h-64 rounded-xl bg-gray-800/50" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-8 text-gray-500 text-sm">Failed to load</div>;

  const { summary } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <header>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-yellow-400">🛡️</span>
          {lang === 'he' ? 'מנוע אמינות' : 'Credibility Engine'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {lang === 'he'
            ? '5 שכבות אימות — מקורות, סתירות, מתודולוגיה, עדכניות, אי-ודאות'
            : '5 verification layers — sources, contradictions, methodology, freshness, uncertainty'}
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: lang === 'he' ? 'ציון ממוצע' : 'Avg Score', value: summary.avgCredibility, suffix: '%', color: summary.avgCredibility >= 60 ? 'text-emerald-400' : 'text-amber-400' },
          { label: lang === 'he' ? 'נושאים אמינים' : 'Reliable', value: summary.reliableTopics, suffix: `/${summary.totalTopics}`, color: 'text-emerald-400' },
          { label: lang === 'he' ? 'סתירות' : 'Contradictions', value: summary.totalContradictions, suffix: '', color: summary.totalContradictions > 0 ? 'text-red-400' : 'text-emerald-400' },
          { label: lang === 'he' ? 'חסר נתונים' : 'Insufficient', value: summary.topicsWithInsufficientData, suffix: '', color: summary.topicsWithInsufficientData > 0 ? 'text-amber-400' : 'text-emerald-400' },
          { label: lang === 'he' ? 'נושאים' : 'Topics', value: summary.totalTopics, suffix: '', color: 'text-white' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/80 p-3 text-center">
            <p className="text-[10px] text-gray-500 uppercase">{kpi.label}</p>
            <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}{kpi.suffix}</p>
          </div>
        ))}
      </div>

      {/* Grade distribution */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          {lang === 'he' ? 'התפלגות ציונים' : 'Grade Distribution'}
        </h3>
        <div className="flex gap-2 h-16 items-end">
          {['A', 'B', 'C', 'D', 'F', 'INSUFFICIENT'].map(grade => {
            const count = summary.gradeDistribution[grade] || 0;
            const pct = summary.totalTopics > 0 ? (count / summary.totalTopics) * 100 : 0;
            const style = GRADE_STYLE[grade] || GRADE_STYLE.F;
            return (
              <div key={grade} className="flex-1 flex flex-col items-center gap-1">
                {count > 0 && <span className="text-xs font-bold text-white">{count}</span>}
                <div
                  className={`w-full ${style.bg} rounded-t transition-all duration-700`}
                  style={{ height: `${Math.max(4, pct * 1.5)}px` }}
                />
                <span className={`text-[8px] font-bold ${style.text}`}>{grade === 'INSUFFICIENT' ? '?' : grade}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button onClick={() => { setView('reports'); setSelectedReport(null); }} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${view === 'reports' ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-400' : 'border-gray-800 text-gray-500'}`}>
          {lang === 'he' ? 'דוחות מפורטים' : 'Detailed Reports'}
        </button>
        <button onClick={() => setView('overview')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${view === 'overview' ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-400' : 'border-gray-800 text-gray-500'}`}>
          {lang === 'he' ? 'סקירת סתירות' : 'Contradiction Overview'}
        </button>
      </div>

      {/* Overview: all contradictions */}
      {view === 'overview' && (
        <div className="space-y-3">
          {data.reports.filter(r => r.hasContradictions).length === 0 ? (
            <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
              <p className="text-emerald-400 font-semibold">✓ {lang === 'he' ? 'לא זוהו סתירות משמעותיות' : 'No significant contradictions detected'}</p>
              <p className="text-[10px] text-gray-500 mt-1">{lang === 'he' ? 'כל הנרטיבים עקביים בין המקורות' : 'All narratives consistent across sources'}</p>
            </div>
          ) : (
            data.reports
              .filter(r => r.hasContradictions)
              .flatMap(r => r.contradictions.map(c => ({ ...c, parentTopic: r.topic, parentGrade: r.overallGrade })))
              .map((c, i) => (
                <div key={i} className={`p-4 rounded-xl border ${SEVERITY_STYLE[c.severity] || SEVERITY_STYLE.low} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">{c.topic || c.parentTopic}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        c.severity === 'high' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {c.severity.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-500 capitalize">{c.type}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    {lang === 'he' ? c.descriptionHe : c.description}
                  </p>

                  {/* Side A vs Side B */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
                      <p className="text-[10px] text-gray-500 mb-1">
                        {c.sideA.sources.slice(0, 3).join(', ')}
                      </p>
                      <p className="text-[10px] text-gray-300 line-clamp-2">{c.sideA.claim}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800">
                      <p className="text-[10px] text-gray-500 mb-1">
                        {c.sideB.sources.slice(0, 3).join(', ')}
                      </p>
                      <p className="text-[10px] text-gray-300 line-clamp-2">{c.sideB.claim}</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-yellow-400 italic">
                    💡 {lang === 'he' ? c.recommendationHe : c.recommendation}
                  </p>
                </div>
              ))
          )}
        </div>
      )}

      {/* Reports view */}
      {view === 'reports' && !selectedReport && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {data.reports.map((r, i) => {
            const gradeStyle = GRADE_STYLE[r.overallGrade] || GRADE_STYLE.F;
            const uncStyle = UNCERTAINTY_STYLE[r.uncertaintyLevel] || UNCERTAINTY_STYLE.moderate;
            return (
              <button
                key={i}
                onClick={() => setSelectedReport(r)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 transition-colors text-start"
              >
                <span className={`w-9 h-9 rounded-lg ${gradeStyle.bg} flex items-center justify-center text-sm font-bold text-white`}>
                  {r.overallGrade === 'INSUFFICIENT' ? '?' : r.overallGrade}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{r.topic}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500">{r.totalSourceCount} sources</span>
                    {r.hasContradictions && <span className="text-[10px] text-red-400">⚠ contradictions</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${uncStyle.bg} ${uncStyle.text}`}>
                    {uncStyle.icon} {r.uncertaintyLevel}
                  </span>
                  <span className={`text-sm font-bold ${gradeStyle.text}`}>{r.overallScore}%</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detailed report */}
      {view === 'reports' && selectedReport && (
        <div className="space-y-4">
          <button onClick={() => setSelectedReport(null)} className="text-xs text-yellow-400 hover:text-yellow-300">
            ← {lang === 'he' ? 'חזרה לרשימה' : 'Back'}
          </button>

          {/* Header */}
          <div className="p-5 rounded-xl bg-gray-900 border border-gray-800 space-y-4">
            <div className="flex items-center gap-4">
              <span className={`w-14 h-14 rounded-xl ${GRADE_STYLE[selectedReport.overallGrade]?.bg || 'bg-gray-600'} flex items-center justify-center text-2xl font-bold text-white`}>
                {selectedReport.overallGrade === 'INSUFFICIENT' ? '?' : selectedReport.overallGrade}
              </span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{selectedReport.topic}</h3>
                <p className="text-xs text-gray-500">
                  {lang === 'he' ? 'ציון אמינות' : 'Credibility Score'}: <span className="text-white font-bold">{selectedReport.overallScore}%</span>
                </p>
              </div>
              {selectedReport.warningMessage && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 max-w-[200px]">
                  <p className="text-[10px] text-red-400">
                    ⚠ {lang === 'he' ? selectedReport.warningMessageHe : selectedReport.warningMessage}
                  </p>
                </div>
              )}
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-gray-800/50">
                <p className="text-lg font-bold text-white">{selectedReport.totalSourceCount}</p>
                <p className="text-[8px] text-gray-500">{lang === 'he' ? 'מקורות' : 'Sources'}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-800/50">
                <p className="text-lg font-bold text-white">{selectedReport.independentSourceCount}</p>
                <p className="text-[8px] text-gray-500">{lang === 'he' ? 'עצמאיים' : 'Independent'}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-800/50">
                <p className="text-lg font-bold text-white">{Math.round(selectedReport.freshness * 100)}%</p>
                <p className="text-[8px] text-gray-500">{lang === 'he' ? 'רעננות' : 'Freshness'}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-800/50">
                <p className="text-lg font-bold text-white">{selectedReport.contradictions.length}</p>
                <p className="text-[8px] text-gray-500">{lang === 'he' ? 'סתירות' : 'Conflicts'}</p>
              </div>
            </div>
          </div>

          {/* Layer 3: Methodology */}
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase">
              📐 {lang === 'he' ? 'מתודולוגיה — למה הציון הזה?' : 'Methodology — Why This Score?'}
            </h4>
            {selectedReport.methodology.map((m, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${RELIABILITY_DOTS[m.reliability] || 'bg-gray-500'}`} />
                  <span className="text-xs font-medium text-white">
                    {lang === 'he' ? m.factorHe : m.factor}
                  </span>
                  <span className="text-[10px] text-gray-600">({m.weight}%)</span>
                  <span className="ms-auto text-xs font-bold text-white">{m.rawValue}/100</span>
                </div>
                <div className="ms-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      m.reliability === 'strong' ? 'bg-emerald-500' : m.reliability === 'moderate' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${m.rawValue}%` }}
                  />
                </div>
                <p className="ms-4 text-[10px] text-gray-500">
                  {lang === 'he' ? m.explanationHe : m.explanation}
                </p>
              </div>
            ))}
          </div>

          {/* Layer 1: Source Evidence */}
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase">
              🧾 {lang === 'he' ? 'עדות מקורות' : 'Source Evidence'}
            </h4>
            {selectedReport.sourceEvidence.slice(0, 8).map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${s.isIndependent ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                <span className="text-gray-400 w-20 truncate">{s.sourceName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">{s.factualRating}</span>
                <span className="text-[10px] text-gray-600">{s.bias}</span>
                <span className="flex-1 text-gray-500 truncate text-[10px]">{s.title}</span>
              </div>
            ))}
            <p className="text-[10px] text-gray-600 mt-2">
              🟢 = {lang === 'he' ? 'מקור עצמאי' : 'independent'} · ⚫ = {lang === 'he' ? 'חלק מקבוצת תוכן' : 'content group member'}
            </p>
          </div>

          {/* Layer 4: Freshness */}
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              🔻 {lang === 'he' ? 'דעיכת ביטחון' : 'Confidence Decay'}
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    selectedReport.freshness > 0.7 ? 'bg-emerald-500' : selectedReport.freshness > 0.4 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${selectedReport.freshness * 100}%` }}
                />
              </div>
              <span className="text-xs text-white font-bold">{Math.round(selectedReport.freshness * 100)}%</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5">
              {lang === 'he'
                ? `כתבה אחרונה: לפני ${selectedReport.newestArticleHoursAgo} שעות · עתיקה ביותר: לפני ${selectedReport.oldestArticleHoursAgo} שעות · עונש דעיכה: ${Math.round(selectedReport.decayPenalty * 100)}%`
                : `Latest: ${selectedReport.newestArticleHoursAgo}h ago · Oldest: ${selectedReport.oldestArticleHoursAgo}h ago · Decay penalty: ${Math.round(selectedReport.decayPenalty * 100)}%`}
            </p>
          </div>

          {/* Layer 5: Uncertainty */}
          {selectedReport.uncertaintyReason && (
            <div className={`p-4 rounded-xl border ${UNCERTAINTY_STYLE[selectedReport.uncertaintyLevel]?.bg || 'bg-gray-800'} ${
              selectedReport.uncertaintyLevel === 'high' || selectedReport.uncertaintyLevel === 'insufficient'
                ? 'border-red-500/20'
                : 'border-amber-500/20'
            }`}>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                🚫 {lang === 'he' ? 'הערכת אי-ודאות' : 'Uncertainty Assessment'}
              </h4>
              <p className={`text-sm ${UNCERTAINTY_STYLE[selectedReport.uncertaintyLevel]?.text || 'text-gray-400'}`}>
                {UNCERTAINTY_STYLE[selectedReport.uncertaintyLevel]?.icon} {lang === 'he' ? selectedReport.uncertaintyReasonHe : selectedReport.uncertaintyReason}
              </p>
            </div>
          )}

          {/* Layer 2: Contradictions */}
          {selectedReport.contradictions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase">
                ⚖️ {lang === 'he' ? 'סתירות שזוהו' : 'Detected Contradictions'}
              </h4>
              {selectedReport.contradictions.map((c, i) => (
                <div key={i} className={`p-4 rounded-xl border ${SEVERITY_STYLE[c.severity]} space-y-2`}>
                  <p className="text-xs text-gray-300">{lang === 'he' ? c.descriptionHe : c.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-gray-900/80 text-[10px] text-gray-400">
                      <span className="text-gray-500">{c.sideA.sources.join(', ')}</span><br />
                      <span className="text-gray-300 line-clamp-2">{c.sideA.claim}</span>
                    </div>
                    <div className="p-2 rounded bg-gray-900/80 text-[10px] text-gray-400">
                      <span className="text-gray-500">{c.sideB.sources.join(', ')}</span><br />
                      <span className="text-gray-300 line-clamp-2">{c.sideB.claim}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-yellow-400 italic">💡 {lang === 'he' ? c.recommendationHe : c.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
