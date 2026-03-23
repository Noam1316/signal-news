'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/i18n/context';

interface CountryData {
  code: string;
  name: { he: string; en: string };
  cx: number; // SVG x coordinate (0-1000)
  cy: number; // SVG y coordinate (0-500)
  articles: number;
  sources: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  lensCategory: string;
}

interface MapData {
  countries: CountryData[];
  total: number;
}

// Country positions on a simplified world map (Mercator-ish projection)
const COUNTRY_COORDS: Record<string, { cx: number; cy: number; name: { he: string; en: string } }> = {
  IL: { cx: 590, cy: 210, name: { he: 'ישראל', en: 'Israel' } },
  US: { cx: 210, cy: 180, name: { he: 'ארה"ב', en: 'United States' } },
  UK: { cx: 460, cy: 140, name: { he: 'בריטניה', en: 'United Kingdom' } },
  FR: { cx: 475, cy: 165, name: { he: 'צרפת', en: 'France' } },
  DE: { cx: 495, cy: 150, name: { he: 'גרמניה', en: 'Germany' } },
  QA: { cx: 615, cy: 230, name: { he: 'קטאר', en: 'Qatar' } },
  AE: { cx: 625, cy: 235, name: { he: 'איחוד האמירויות', en: 'UAE' } },
  SA: { cx: 605, cy: 240, name: { he: 'ערב הסעודית', en: 'Saudi Arabia' } },
  // Additional ME countries for context
  IR: { cx: 630, cy: 205, name: { he: 'איראן', en: 'Iran' } },
  LB: { cx: 585, cy: 200, name: { he: 'לבנון', en: 'Lebanon' } },
  SY: { cx: 590, cy: 195, name: { he: 'סוריה', en: 'Syria' } },
  EG: { cx: 565, cy: 230, name: { he: 'מצרים', en: 'Egypt' } },
  JO: { cx: 590, cy: 215, name: { he: 'ירדן', en: 'Jordan' } },
  IQ: { cx: 610, cy: 200, name: { he: 'עיראק', en: 'Iraq' } },
  TR: { cx: 565, cy: 180, name: { he: 'טורקיה', en: 'Turkey' } },
  RU: { cx: 650, cy: 120, name: { he: 'רוסיה', en: 'Russia' } },
  UA: { cx: 560, cy: 150, name: { he: 'אוקראינה', en: 'Ukraine' } },
  CN: { cx: 760, cy: 195, name: { he: 'סין', en: 'China' } },
  PS: { cx: 587, cy: 212, name: { he: 'פלסטין', en: 'Palestine' } },
};

// Region mention keywords → country codes
const REGION_KEYWORDS: Record<string, string[]> = {
  IL: ['israel', 'israeli', 'idf', 'netanyahu', 'tel aviv', 'jerusalem', 'ישראל', 'צה"ל', 'נתניהו'],
  IR: ['iran', 'iranian', 'tehran', 'ayatollah', 'khamenei', 'איראן', 'טהרן'],
  LB: ['lebanon', 'lebanese', 'hezbollah', 'nasrallah', 'beirut', 'לבנון', 'חיזבאללה'],
  SY: ['syria', 'syrian', 'damascus', 'assad', 'סוריה'],
  PS: ['palestinian', 'gaza', 'hamas', 'west bank', 'ramallah', 'פלסטיני', 'עזה', 'חמאס'],
  SA: ['saudi', 'riyadh', 'mbs', 'סעודיה'],
  EG: ['egypt', 'egyptian', 'cairo', 'sisi', 'מצרים'],
  JO: ['jordan', 'amman', 'ירדן'],
  IQ: ['iraq', 'iraqi', 'baghdad', 'עיראק'],
  US: ['united states', 'american', 'washington', 'biden', 'trump', 'congress', 'white house'],
  UK: ['britain', 'british', 'london', 'uk'],
  RU: ['russia', 'russian', 'putin', 'moscow', 'רוסיה'],
  UA: ['ukraine', 'ukrainian', 'kyiv', 'zelensky', 'אוקראינה'],
  TR: ['turkey', 'turkish', 'erdogan', 'ankara', 'טורקיה'],
  CN: ['china', 'chinese', 'beijing', 'סין'],
  FR: ['france', 'french', 'paris', 'macron'],
  DE: ['germany', 'german', 'berlin'],
  QA: ['qatar', 'doha', 'קטאר'],
  AE: ['uae', 'emirates', 'dubai', 'abu dhabi', 'אמירויות'],
};

const SENTIMENT_COLORS = {
  positive: { fill: '#22c55e', glow: '#22c55e40' },
  negative: { fill: '#ef4444', glow: '#ef444440' },
  neutral: { fill: '#a3a3a3', glow: '#a3a3a340' },
  mixed: { fill: '#f59e0b', glow: '#f59e0b40' },
};

/**
 * Tension Index per country: composite of article volume, negative sentiment ratio, source diversity.
 * Returns 0-100 score.
 */
function computeTension(country: CountryData, maxArticles: number): number {
  const volumeScore = Math.min(40, (country.articles / Math.max(1, maxArticles)) * 40);
  const negScore = country.sentiment === 'negative' ? 35 : country.sentiment === 'mixed' ? 20 : 5;
  const diversityScore = Math.min(25, country.sources.length * 5);
  return Math.round(volumeScore + negScore + diversityScore);
}

function getTensionLabel(tension: number): { he: string; en: string; color: string } {
  if (tension >= 70) return { he: 'מתח גבוה', en: 'High Tension', color: 'text-red-400' };
  if (tension >= 40) return { he: 'מתח בינוני', en: 'Moderate', color: 'text-yellow-400' };
  return { he: 'יציב', en: 'Stable', color: 'text-emerald-400' };
}

interface RawArticle {
  title: string;
  link: string;
  sourceName: string;
  pubDate: string;
  description: string;
}

export default function GeoMap() {
  const { lang, dir } = useLanguage();
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [allArticles, setAllArticles] = useState<RawArticle[]>([]);

  const fetchMapData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rss/latest?limit=200');
      if (!res.ok) throw new Error('Failed');
      const { articles } = await res.json();
      setAllArticles((articles as RawArticle[]).slice(0, 200));

      // Count articles per country (by source country + content mentions)
      const countryMap = new Map<string, {
        articles: number;
        sources: Set<string>;
        sentiments: string[];
        lensCategory: string;
      }>();

      for (const article of articles) {
        // Source country
        const sourceCountry = article.lensCategory?.startsWith('il-') ? 'IL' :
          Object.entries(COUNTRY_COORDS).find(([code]) => {
            // Match by checking if any RSS source from this country
            return false; // Will be handled by keyword matching
          })?.[0] || 'US';

        // Count mentions of countries in content
        const text = `${article.title} ${article.description}`.toLowerCase();
        for (const [code, keywords] of Object.entries(REGION_KEYWORDS)) {
          if (keywords.some(kw => text.includes(kw))) {
            if (!countryMap.has(code)) {
              countryMap.set(code, { articles: 0, sources: new Set(), sentiments: [], lensCategory: article.lensCategory });
            }
            const entry = countryMap.get(code)!;
            entry.articles++;
            entry.sources.add(article.sourceName);
            // Simple sentiment from title
            const neg = ['war', 'attack', 'kill', 'crisis', 'threat', 'מלחמה', 'פיגוע', 'משבר'].some(w => text.includes(w));
            const pos = ['peace', 'deal', 'agreement', 'progress', 'שלום', 'הסכם'].some(w => text.includes(w));
            entry.sentiments.push(neg && pos ? 'mixed' : neg ? 'negative' : pos ? 'positive' : 'neutral');
          }
        }
      }

      const countries: CountryData[] = Array.from(countryMap.entries())
        .filter(([code]) => COUNTRY_COORDS[code])
        .map(([code, data]) => {
          const coords = COUNTRY_COORDS[code];
          const sentCounts: Record<string, number> = {};
          for (const s of data.sentiments) sentCounts[s] = (sentCounts[s] || 0) + 1;
          const topSent = Object.entries(sentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as CountryData['sentiment'] || 'neutral';
          return {
            code,
            name: coords.name,
            cx: coords.cx,
            cy: coords.cy,
            articles: data.articles,
            sources: Array.from(data.sources),
            sentiment: topSent,
            lensCategory: data.lensCategory,
          };
        })
        .sort((a, b) => b.articles - a.articles);

      setMapData({ countries, total: articles.length });
    } catch {
      setMapData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  const maxArticles = useMemo(() =>
    mapData ? Math.max(...mapData.countries.map(c => c.articles), 1) : 1,
    [mapData]
  );

  return (
    <div dir={dir} className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>🗺️</span>
            {lang === 'he' ? 'מפה גיאופוליטית' : 'Geopolitical Map'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {lang === 'he' ? 'צפיפות כתבות וסנטימנט לפי מדינה' : 'Article density & sentiment by country'}
          </p>
        </div>
        <button onClick={fetchMapData} disabled={loading}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-50">
          {loading ? '...' : (lang === 'he' ? 'רענן' : 'Refresh')}
        </button>
      </header>

      {loading && !mapData && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
        </div>
      )}

      {mapData && (
        <>
          {/* SVG Map */}
          <div className="relative rounded-xl bg-gray-900 border border-gray-800 p-4 overflow-hidden">
            <svg viewBox="100 80 650 250" className="w-full h-auto" style={{ minHeight: '280px' }}>
              {/* Grid lines */}
              {[120, 160, 200, 240, 280].map(y => (
                <line key={`h${y}`} x1="100" y1={y} x2="750" y2={y} stroke="#1f2937" strokeWidth="0.5" strokeDasharray="4 4" />
              ))}
              {[200, 300, 400, 500, 600, 700].map(x => (
                <line key={`v${x}`} x1={x} y1="80" x2={x} y2="330" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="4 4" />
              ))}

              {/* Simplified land outlines (decorative) */}
              {/* Europe/Africa rough shape */}
              <path d="M440,100 L480,95 L520,100 L560,95 L580,110 L600,105 L560,130 L540,145 L500,160 L470,170 L450,165 L440,150 L430,130 Z"
                fill="#1a2332" stroke="#2d3748" strokeWidth="0.5" />
              {/* Middle East rough shape */}
              <path d="M560,170 L600,160 L640,170 L660,185 L650,210 L630,230 L610,250 L580,260 L560,250 L550,230 L560,200 Z"
                fill="#1a2332" stroke="#2d3748" strokeWidth="0.5" />
              {/* North America rough shape */}
              <path d="M130,100 L200,90 L280,95 L320,110 L300,140 L270,170 L250,200 L220,210 L190,200 L160,180 L140,150 L130,120 Z"
                fill="#1a2332" stroke="#2d3748" strokeWidth="0.5" />
              {/* Asia rough shape */}
              <path d="M660,100 L720,95 L780,110 L800,140 L790,170 L770,190 L740,200 L700,195 L680,180 L660,150 Z"
                fill="#1a2332" stroke="#2d3748" strokeWidth="0.5" />

              {/* Connection lines between mentioned countries */}
              {mapData.countries.length > 1 && mapData.countries.slice(0, 6).map((country, i) => {
                // Draw lines from Israel to other mentioned countries
                const israel = mapData.countries.find(c => c.code === 'IL');
                if (!israel || country.code === 'IL') return null;
                return (
                  <line
                    key={`line-${country.code}`}
                    x1={israel.cx} y1={israel.cy}
                    x2={country.cx} y2={country.cy}
                    stroke="#fbbf2420"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* Country bubbles */}
              {mapData.countries.map((country) => {
                const radius = Math.max(8, Math.min(32, (country.articles / maxArticles) * 32));
                const colors = SENTIMENT_COLORS[country.sentiment];
                const isHovered = hoveredCountry?.code === country.code;
                const isSelected = selectedCountry === country.code;

                return (
                  <g key={country.code}
                    onMouseEnter={() => setHoveredCountry(country)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    onClick={() => setSelectedCountry(isSelected ? null : country.code)}
                    className="cursor-pointer"
                  >
                    {/* Glow effect */}
                    <circle
                      cx={country.cx} cy={country.cy}
                      r={radius + 4}
                      fill={colors.glow}
                      className={isHovered || isSelected ? 'opacity-80' : 'opacity-40'}
                    />
                    {/* Pulse ring for high-activity */}
                    {country.articles > maxArticles * 0.5 && (
                      <circle
                        cx={country.cx} cy={country.cy}
                        r={radius + 8}
                        fill="none"
                        stroke={colors.fill}
                        strokeWidth="1"
                        opacity="0.3"
                        className="animate-ping"
                        style={{ transformOrigin: `${country.cx}px ${country.cy}px`, animationDuration: '3s' }}
                      />
                    )}
                    {/* Main circle */}
                    <circle
                      cx={country.cx} cy={country.cy}
                      r={radius}
                      fill={colors.fill}
                      opacity={isHovered || isSelected ? 1 : 0.7}
                      stroke={isSelected ? '#fbbf24' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                      className="transition-all duration-200"
                    />
                    {/* Article count */}
                    {radius > 12 && (
                      <text
                        x={country.cx} y={country.cy + 1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize={radius > 20 ? "10" : "8"}
                        fontWeight="bold"
                        style={{ pointerEvents: 'none' }}
                      >
                        {country.articles}
                      </text>
                    )}
                    {/* Country label */}
                    <text
                      x={country.cx}
                      y={country.cy + radius + 12}
                      textAnchor="middle"
                      fill="#9ca3af"
                      fontSize="9"
                      style={{ pointerEvents: 'none' }}
                      className={isHovered || isSelected ? 'opacity-100' : 'opacity-60'}
                    >
                      {lang === 'he' ? country.name.he : country.name.en}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover tooltip */}
            {hoveredCountry && (
              <div className="absolute top-4 start-4 bg-gray-950/95 border border-gray-700 rounded-lg p-3 text-xs space-y-1.5 max-w-[200px] z-10"
                style={{ backdropFilter: 'blur(8px)' }}>
                <div className="font-bold text-white text-sm">
                  {lang === 'he' ? hoveredCountry.name.he : hoveredCountry.name.en}
                </div>
                {/* Tension Index */}
                {(() => {
                  const tension = computeTension(hoveredCountry, maxArticles);
                  const tLabel = getTensionLabel(tension);
                  return (
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${tLabel.color}`}>{tension}</span>
                      <span className={`text-[10px] ${tLabel.color}`}>{lang === 'he' ? tLabel.he : tLabel.en}</span>
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${tension >= 70 ? 'bg-red-500' : tension >= 40 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                          style={{ width: `${tension}%` }} />
                      </div>
                    </div>
                  );
                })()}
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-mono font-bold">{hoveredCountry.articles}</span>
                  <span className="text-gray-400">{lang === 'he' ? 'אזכורים' : 'mentions'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS[hoveredCountry.sentiment].fill }} />
                  <span className="text-gray-400 capitalize">{hoveredCountry.sentiment}</span>
                </div>
                <div className="text-gray-500 pt-1 border-t border-gray-800">
                  {hoveredCountry.sources.slice(0, 3).join(', ')}
                  {hoveredCountry.sources.length > 3 && ` +${hoveredCountry.sources.length - 3}`}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 px-2">
            {Object.entries(SENTIMENT_COLORS).map(([sentiment, colors]) => (
              <div key={sentiment} className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.fill }} />
                <span className="text-gray-400 capitalize">
                  {lang === 'he'
                    ? { positive: 'חיובי', negative: 'שלילי', neutral: 'ניטרלי', mixed: 'מעורב' }[sentiment]
                    : sentiment}
                </span>
              </div>
            ))}
            <span className="text-[10px] text-gray-600 ms-auto">
              {lang === 'he' ? 'גודל = כמות אזכורים' : 'Size = mention count'}
            </span>
          </div>

          {/* Top countries table */}
          <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-start text-xs text-gray-500 font-medium p-3">{lang === 'he' ? 'מדינה' : 'Country'}</th>
                  <th className="text-center text-xs text-gray-500 font-medium p-3">{lang === 'he' ? 'מתח' : 'Tension'}</th>
                  <th className="text-center text-xs text-gray-500 font-medium p-3">{lang === 'he' ? 'אזכורים' : 'Mentions'}</th>
                  <th className="text-center text-xs text-gray-500 font-medium p-3">{lang === 'he' ? 'סנטימנט' : 'Sentiment'}</th>
                  <th className="text-start text-xs text-gray-500 font-medium p-3">{lang === 'he' ? 'מקורות' : 'Sources'}</th>
                </tr>
              </thead>
              <tbody>
                {mapData.countries.slice(0, 8).map((country) => (
                  <tr key={country.code}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer ${selectedCountry === country.code ? 'bg-yellow-400/5' : ''}`}
                    onClick={() => setSelectedCountry(selectedCountry === country.code ? null : country.code)}>
                    <td className="p-3 font-medium text-white">
                      {lang === 'he' ? country.name.he : country.name.en}
                    </td>
                    <td className="p-3 text-center">
                      {(() => {
                        const t = computeTension(country, maxArticles);
                        const tl = getTensionLabel(t);
                        return (
                          <span className={`text-xs font-bold ${tl.color}`} title={lang === 'he' ? tl.he : tl.en}>
                            {t}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-bold text-yellow-400">{country.articles}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS[country.sentiment].fill }} />
                        <span className="text-xs text-gray-400 capitalize">{country.sentiment}</span>
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {country.sources.slice(0, 3).join(', ')}
                      {country.sources.length > 3 && ` +${country.sources.length - 3}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Country article drill-down */}
          {selectedCountry && (() => {
            const selectedData = mapData.countries.find(c => c.code === selectedCountry);
            const keywords = REGION_KEYWORDS[selectedCountry] || [];
            const relatedArticles = allArticles.filter(a => {
              const text = `${a.title} ${a.description}`.toLowerCase();
              return keywords.some(kw => text.includes(kw));
            }).slice(0, 5);

            if (relatedArticles.length === 0) return null;

            return (
              <div className="rounded-xl bg-gray-900 border border-yellow-400/20 overflow-hidden mt-3">
                <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-yellow-400">
                    {lang === 'he'
                      ? `כתבות על ${selectedData?.name.he}`
                      : `Articles about ${selectedData?.name.en}`}
                  </h3>
                  <button onClick={() => setSelectedCountry(null)} className="text-xs text-gray-500 hover:text-gray-300">✕</button>
                </div>
                <div className="divide-y divide-gray-800/50">
                  {relatedArticles.map((a, i) => (
                    <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
                       onClick={e => e.stopPropagation()}
                       className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-800/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-200 line-clamp-1">{a.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{a.sourceName}</p>
                      </div>
                      <span className="text-gray-600 text-xs shrink-0">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
