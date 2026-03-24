import { getCachedArticles } from '@/services/article-cache';
import { generateStories } from '@/services/story-clusterer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://signal-news-noam1316s-projects.vercel.app';

function getLikelihoodColor(pct: number): string {
  if (pct >= 70) return '#22c55e';
  if (pct >= 45) return '#f59e0b';
  return '#6b7280';
}

export const revalidate = 300; // refresh every 5 min

export default async function EmbedWidget() {
  let story = null;
  try {
    const articles = await getCachedArticles();
    const stories = generateStories(articles);
    story = stories.sort((a, b) =>
      b.likelihood * Math.log(b.sources.length + 1) - a.likelihood * Math.log(a.sources.length + 1)
    )[0] ?? null;
  } catch { /* silent fallback */ }

  const headline = story
    ? (typeof story.headline === 'string' ? story.headline : story.headline?.he ?? story.headline?.en ?? '')
    : 'טוען נתונים...';
  const summary = story
    ? (typeof story.summary === 'string' ? story.summary : story.summary?.he ?? story.summary?.en ?? '')
    : '';
  const likelihood = story?.likelihood ?? 0;
  const delta = story?.delta ?? 0;
  const sources = Array.isArray(story?.sources) ? story.sources.length : 0;
  const color = getLikelihoodColor(likelihood);

  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Signal News — סיגנל היום</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #0a0f1e;
            color: #f1f5f9;
            direction: rtl;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 12px;
          }
          .card {
            background: #111827;
            border: 1px solid #1e293b;
            border-radius: 14px;
            padding: 18px 20px;
            max-width: 420px;
            width: 100%;
            font-size: 14px;
          }
          .brand {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          .brand-name {
            font-size: 11px;
            font-weight: 700;
            color: #6366f1;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .signal-badge {
            font-size: 10px;
            background: #422006;
            color: #fbbf24;
            padding: 2px 8px;
            border-radius: 20px;
            font-weight: 700;
          }
          .label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }
          .headline {
            font-size: 16px;
            font-weight: 800;
            line-height: 1.4;
            color: #f1f5f9;
            margin-bottom: 8px;
          }
          .summary {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 14px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .stats {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
          }
          .likelihood {
            font-size: 28px;
            font-weight: 900;
            line-height: 1;
          }
          .likelihood-label {
            font-size: 10px;
            color: #64748b;
          }
          .bar-wrap {
            flex: 1;
          }
          .bar-bg {
            background: #0f172a;
            border-radius: 6px;
            height: 6px;
            width: 100%;
          }
          .bar-fill {
            height: 6px;
            border-radius: 6px;
            transition: width 1s ease;
          }
          .delta {
            font-size: 13px;
            font-weight: 700;
            margin-top: 4px;
          }
          .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px solid #1e293b;
          }
          .sources-txt {
            font-size: 11px;
            color: #475569;
          }
          .cta {
            font-size: 12px;
            font-weight: 700;
            color: #6366f1;
            text-decoration: none;
          }
          .cta:hover { color: #818cf8; }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="brand">
            <span className="brand-name">⚡ Signal News</span>
            <span className="signal-badge">סיגנל היום</span>
          </div>

          <div className="label">📋 הסיפור המוביל</div>
          <div className="headline">{headline}</div>
          {summary && <div className="summary">{summary}</div>}

          <div className="stats">
            <div>
              <div className="likelihood" style={{ color }}>{likelihood}%</div>
              <div className="likelihood-label">סבירות</div>
            </div>
            <div className="bar-wrap">
              <div className="bar-bg">
                <div className="bar-fill" style={{ width: `${likelihood}%`, background: color }} />
              </div>
              {delta !== 0 && (
                <div className="delta" style={{ color: delta > 0 ? '#22c55e' : '#ef4444' }}>
                  {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}% מאתמול
                </div>
              )}
            </div>
          </div>

          <div className="footer">
            <span className="sources-txt">📰 {sources} מקורות</span>
            <a href={`${SITE_URL}/dashboard`} target="_blank" rel="noopener noreferrer" className="cta">
              לדשבורד המלא →
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
