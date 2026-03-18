/**
 * Story Clusterer
 * Groups RSS articles by shared topics into BriefStory objects.
 * No AI API needed — uses topic detection from ai-analyzer.
 */

import type { FetchedArticle } from './rss-fetcher';
import type { BriefStory, Confidence } from '@/lib/types';
import { analyzeArticle, type ArticleAnalysis } from './ai-analyzer';

interface ArticleWithAnalysis {
  article: FetchedArticle;
  analysis: ArticleAnalysis;
}

interface Cluster {
  topic: string;
  articles: ArticleWithAnalysis[];
}

// Topic → category labels
const TOPIC_CATEGORIES: Record<string, { he: string; en: string }> = {
  'Iran Nuclear':        { he: 'ביטחון לאומי',     en: 'National Security' },
  'Gaza Conflict':       { he: 'ביטחון',           en: 'Security' },
  'Lebanon/Hezbollah':   { he: 'ביטחון',           en: 'Security' },
  'Saudi Normalization':  { he: 'דיפלומטיה',       en: 'Diplomacy' },
  'US Politics':         { he: 'גיאופוליטיקה',    en: 'Geopolitics' },
  'West Bank':           { he: 'ביטחון',           en: 'Security' },
  'Syria':               { he: 'מזרח תיכון',      en: 'Middle East' },
  'Economy':             { he: 'כלכלה',            en: 'Economy' },
  'Technology':          { he: 'כלכלה וטכנולוגיה', en: 'Economy & Technology' },
  'Climate':             { he: 'סביבה',            en: 'Environment' },
  'Ukraine/Russia':      { he: 'גיאופוליטיקה',    en: 'Geopolitics' },
  'Judicial Reform':     { he: 'פוליטיקה',         en: 'Politics' },
  'Security':            { he: 'ביטחון',           en: 'Security' },
  'Diplomacy':           { he: 'דיפלומטיה',       en: 'Diplomacy' },
  'General':             { he: 'כללי',             en: 'General' },
};

// Topic → headline templates (when building story headline from cluster)
const TOPIC_HEADLINES: Record<string, { he: string; en: string }> = {
  'Iran Nuclear':        { he: 'התפתחויות בתיק הגרעין האיראני',         en: 'Developments in the Iran Nuclear File' },
  'Gaza Conflict':       { he: 'עדכונים מהעימות בעזה',                  en: 'Updates from the Gaza Conflict' },
  'Lebanon/Hezbollah':   { he: 'מתיחות בגבול הצפוני',                   en: 'Northern Border Tensions' },
  'Saudi Normalization':  { he: 'התקדמות בתהליך הנורמליזציה',            en: 'Normalization Process Advances' },
  'US Politics':         { he: 'השפעת הפוליטיקה האמריקאית על האזור',     en: 'US Politics Impact on the Region' },
  'West Bank':           { he: 'התפתחויות ביהודה ושומרון',              en: 'West Bank Developments' },
  'Syria':               { he: 'המצב בסוריה',                          en: 'Situation in Syria' },
  'Economy':             { he: 'מגמות כלכליות',                         en: 'Economic Trends' },
  'Technology':          { he: 'חדשות טכנולוגיה',                       en: 'Technology News' },
  'Climate':             { he: 'שינויי אקלים ואנרגיה',                  en: 'Climate & Energy' },
  'Ukraine/Russia':      { he: 'המלחמה באוקראינה',                      en: 'Ukraine War Updates' },
  'Judicial Reform':     { he: 'הרפורמה המשפטית והמחאה',                en: 'Judicial Reform & Protests' },
  'Security':            { he: 'עדכוני ביטחון',                         en: 'Security Updates' },
  'Diplomacy':           { he: 'דיפלומטיה בינלאומית',                   en: 'International Diplomacy' },
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Cluster articles by primary topic
 */
function clusterByTopic(articles: FetchedArticle[]): Cluster[] {
  const topicMap = new Map<string, ArticleWithAnalysis[]>();

  for (const article of articles) {
    const analysis = analyzeArticle(article);
    const primaryTopic = analysis.topics[0] || 'General';

    if (!topicMap.has(primaryTopic)) {
      topicMap.set(primaryTopic, []);
    }
    topicMap.get(primaryTopic)!.push({ article, analysis });
  }

  return Array.from(topicMap.entries())
    .map(([topic, items]) => ({ topic, articles: items }))
    .filter((c) => c.articles.length >= 2) // Only clusters with 2+ articles
    .sort((a, b) => b.articles.length - a.articles.length);
}

/**
 * Pick best headline from cluster (highest signal score article)
 */
function pickHeadline(cluster: Cluster): { he: string; en: string } {
  // Find highest signal-score article
  const sorted = [...cluster.articles].sort(
    (a, b) => b.analysis.signalScore - a.analysis.signalScore
  );
  const best = sorted[0];

  // Use article title as headline, with fallback to topic template
  const template = TOPIC_HEADLINES[cluster.topic] || { he: cluster.topic, en: cluster.topic };

  // If best article is in Hebrew, use it for he and template for en, and vice versa
  if (best.article.language === 'he') {
    return { he: best.article.title, en: template.en };
  } else {
    return { he: template.he, en: best.article.title };
  }
}

/**
 * Build summary from top articles in cluster
 */
function buildSummary(cluster: Cluster): { he: string; en: string } {
  const heArticles = cluster.articles.filter((a) => a.article.language === 'he');
  const enArticles = cluster.articles.filter((a) => a.article.language !== 'he');

  // Pick top 2 descriptions per language
  const heSummary = heArticles
    .slice(0, 2)
    .map((a) => a.article.description.slice(0, 150))
    .join(' | ') || `${cluster.articles.length} כתבות על ${TOPIC_CATEGORIES[cluster.topic]?.he || cluster.topic}`;

  const enSummary = enArticles
    .slice(0, 2)
    .map((a) => a.article.description.slice(0, 150))
    .join(' | ') || `${cluster.articles.length} articles about ${cluster.topic}`;

  return { he: heSummary, en: enSummary };
}

/**
 * Calculate likelihood score for a cluster
 * Based on: number of sources, signal ratio, recency
 */
function calculateLikelihood(cluster: Cluster): { likelihood: number; delta: number } {
  const signalCount = cluster.articles.filter((a) => a.analysis.isSignal).length;
  const avgSignalScore = cluster.articles.reduce((sum, a) => sum + a.analysis.signalScore, 0) / cluster.articles.length;
  const uniqueSources = new Set(cluster.articles.map((a) => a.article.sourceId)).size;
  const uniqueLenses = new Set(cluster.articles.map((a) => a.article.lensCategory)).size;

  // Multi-source coverage boosts likelihood
  const sourceBonus = Math.min(uniqueSources * 5, 25);
  // Cross-lens coverage indicates broad significance
  const lensBonus = uniqueLenses >= 3 ? 15 : uniqueLenses >= 2 ? 8 : 0;
  // Signal ratio
  const signalBonus = (signalCount / cluster.articles.length) * 20;

  const likelihood = Math.min(95, Math.max(20, Math.round(avgSignalScore + sourceBonus + lensBonus + signalBonus)));

  // Delta: simulate change based on signal strength
  const delta = signalCount >= 3 ? Math.round(Math.random() * 8 + 4) :
                signalCount >= 1 ? Math.round(Math.random() * 6 + 1) :
                Math.round(Math.random() * 4 - 2);

  return { likelihood, delta };
}

/**
 * Determine lens (israel/world) from cluster articles
 */
function determineLens(cluster: Cluster): 'israel' | 'world' {
  const israelCount = cluster.articles.filter((a) => a.analysis.region === 'israel').length;
  return israelCount > cluster.articles.length / 2 ? 'israel' : 'world';
}

/**
 * Generate BriefStory objects from live RSS articles
 */
export function generateStories(articles: FetchedArticle[], maxStories = 8): BriefStory[] {
  if (articles.length === 0) return [];

  const clusters = clusterByTopic(articles);

  return clusters.slice(0, maxStories).map((cluster) => {
    const headline = pickHeadline(cluster);
    const summary = buildSummary(cluster);
    const { likelihood, delta } = calculateLikelihood(cluster);
    const lens = determineLens(cluster);
    const isSignal = cluster.articles.some((a) => a.analysis.isSignal);
    const category = TOPIC_CATEGORIES[cluster.topic] || { he: 'כללי', en: 'General' };

    // Collect unique sources
    const sourcesMap = new Map<string, string>();
    for (const { article } of cluster.articles) {
      if (!sourcesMap.has(article.sourceName)) {
        sourcesMap.set(article.sourceName, article.link);
      }
    }
    const sources = Array.from(sourcesMap.entries())
      .slice(0, 5)
      .map(([name, url]) => ({ name, url }));

    // Latest update time
    const latestArticle = cluster.articles
      .filter((a) => a.article.pubDate)
      .sort((a, b) => new Date(b.article.pubDate).getTime() - new Date(a.article.pubDate).getTime())[0];

    const likelihoodLabel: Confidence = likelihood >= 70 ? 'high' : likelihood >= 40 ? 'medium' : 'low';

    // Build "why" explanation
    const why = {
      he: `${cluster.articles.length} כתבות מ-${sourcesMap.size} מקורות שונים מכסות את הנושא. ${isSignal ? 'זוהה כסיגנל חדשותי משמעותי.' : ''}`,
      en: `${cluster.articles.length} articles from ${sourcesMap.size} different sources cover this topic. ${isSignal ? 'Identified as a significant news signal.' : ''}`,
    };

    return {
      slug: slugify(cluster.topic),
      headline,
      summary,
      likelihood,
      likelihoodLabel,
      delta,
      why,
      isSignal,
      category,
      lens,
      sources,
      updatedAt: latestArticle?.article.pubDate || new Date().toISOString(),
    };
  });
}
