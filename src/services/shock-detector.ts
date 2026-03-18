/**
 * Dynamic Shock Detector
 * Automatically detects shock events from RSS article analysis:
 * 1. Likelihood Shocks — sudden spike in article volume on a topic
 * 2. Narrative Shocks — dramatic sentiment shift on a topic
 * 3. Fragmentation Shocks — divergence between lenses on same topic
 *
 * No external API needed — pure statistical analysis on RSS data.
 */

import type { FetchedArticle } from './rss-fetcher';
import type { ShockEvent, Confidence, ShockType, LocalizedText } from '@/lib/types';
import { analyzeArticle, type ArticleAnalysis, type PoliticalLeaning } from './ai-analyzer';

// ── Entity dictionary for richer shock descriptions ──

const ENTITY_DICT: Record<string, { he: string; en: string; type: 'person' | 'org' | 'country' }> = {
  // Israeli Politicians
  'netanyahu': { he: 'בנימין נתניהו', en: 'Benjamin Netanyahu', type: 'person' },
  'ביבי': { he: 'בנימין נתניהו', en: 'Benjamin Netanyahu', type: 'person' },
  'נתניהו': { he: 'בנימין נתניהו', en: 'Benjamin Netanyahu', type: 'person' },
  'gallant': { he: 'יואב גלנט', en: 'Yoav Gallant', type: 'person' },
  'גלנט': { he: 'יואב גלנט', en: 'Yoav Gallant', type: 'person' },
  'smotrich': { he: 'בצלאל סמוטריץ\'', en: 'Bezalel Smotrich', type: 'person' },
  'סמוטריץ': { he: 'בצלאל סמוטריץ\'', en: 'Bezalel Smotrich', type: 'person' },
  'ben gvir': { he: 'איתמר בן גביר', en: 'Itamar Ben Gvir', type: 'person' },
  'בן גביר': { he: 'איתמר בן גביר', en: 'Itamar Ben Gvir', type: 'person' },
  'lapid': { he: 'יאיר לפיד', en: 'Yair Lapid', type: 'person' },
  'לפיד': { he: 'יאיר לפיד', en: 'Yair Lapid', type: 'person' },
  'gantz': { he: 'בני גנץ', en: 'Benny Gantz', type: 'person' },
  'גנץ': { he: 'בני גנץ', en: 'Benny Gantz', type: 'person' },

  // International Leaders
  'biden': { he: 'ביידן', en: 'Biden', type: 'person' },
  'trump': { he: 'טראמפ', en: 'Trump', type: 'person' },
  'טראמפ': { he: 'טראמפ', en: 'Trump', type: 'person' },
  'putin': { he: 'פוטין', en: 'Putin', type: 'person' },
  'mbs': { he: 'מוחמד בן סלמאן', en: 'Mohammed bin Salman', type: 'person' },
  'khamenei': { he: 'חמינאי', en: 'Khamenei', type: 'person' },
  'sinwar': { he: 'סינוואר', en: 'Sinwar', type: 'person' },
  'סינוואר': { he: 'סינוואר', en: 'Sinwar', type: 'person' },
  'nasrallah': { he: 'נסראללה', en: 'Nasrallah', type: 'person' },
  'נסראללה': { he: 'נסראללה', en: 'Nasrallah', type: 'person' },
  'zelensky': { he: 'זלנסקי', en: 'Zelensky', type: 'person' },
  'erdogan': { he: 'ארדואן', en: 'Erdogan', type: 'person' },
  'macron': { he: 'מקרון', en: 'Macron', type: 'person' },

  // Organizations
  'hamas': { he: 'חמאס', en: 'Hamas', type: 'org' },
  'חמאס': { he: 'חמאס', en: 'Hamas', type: 'org' },
  'hezbollah': { he: 'חיזבאללה', en: 'Hezbollah', type: 'org' },
  'חיזבאללה': { he: 'חיזבאללה', en: 'Hezbollah', type: 'org' },
  'idf': { he: 'צה"ל', en: 'IDF', type: 'org' },
  'צה"ל': { he: 'צה"ל', en: 'IDF', type: 'org' },
  'iaea': { he: 'סבא"א', en: 'IAEA', type: 'org' },
  'nato': { he: 'נאט"ו', en: 'NATO', type: 'org' },
  'un': { he: 'או"ם', en: 'UN', type: 'org' },
  'shin bet': { he: 'שב"כ', en: 'Shin Bet', type: 'org' },
  'שב"כ': { he: 'שב"כ', en: 'Shin Bet', type: 'org' },
  'mossad': { he: 'מוסד', en: 'Mossad', type: 'org' },
  'מוסד': { he: 'מוסד', en: 'Mossad', type: 'org' },

  // Countries
  'iran': { he: 'איראן', en: 'Iran', type: 'country' },
  'איראן': { he: 'איראן', en: 'Iran', type: 'country' },
  'saudi': { he: 'סעודיה', en: 'Saudi Arabia', type: 'country' },
  'סעודיה': { he: 'סעודיה', en: 'Saudi Arabia', type: 'country' },
  'russia': { he: 'רוסיה', en: 'Russia', type: 'country' },
  'china': { he: 'סין', en: 'China', type: 'country' },
  'turkey': { he: 'טורקיה', en: 'Turkey', type: 'country' },
  'egypt': { he: 'מצרים', en: 'Egypt', type: 'country' },
  'jordan': { he: 'ירדן', en: 'Jordan', type: 'country' },
  'syria': { he: 'סוריה', en: 'Syria', type: 'country' },
  'lebanon': { he: 'לבנון', en: 'Lebanon', type: 'country' },
  'ukraine': { he: 'אוקראינה', en: 'Ukraine', type: 'country' },
};

// ── Topic display names ──
const TOPIC_DISPLAY: Record<string, LocalizedText> = {
  'Iran Nuclear': { he: 'הגרעין האיראני', en: 'Iran Nuclear' },
  'Gaza Conflict': { he: 'עימות בעזה', en: 'Gaza Conflict' },
  'Lebanon/Hezbollah': { he: 'לבנון/חיזבאללה', en: 'Lebanon/Hezbollah' },
  'Saudi Normalization': { he: 'נורמליזציה עם סעודיה', en: 'Saudi Normalization' },
  'US Politics': { he: 'פוליטיקה אמריקאית', en: 'US Politics' },
  'West Bank': { he: 'יהודה ושומרון', en: 'West Bank' },
  'Syria': { he: 'סוריה', en: 'Syria' },
  'Economy': { he: 'כלכלה', en: 'Economy' },
  'Technology': { he: 'טכנולוגיה', en: 'Technology' },
  'Climate': { he: 'אקלים', en: 'Climate' },
  'Ukraine/Russia': { he: 'אוקראינה/רוסיה', en: 'Ukraine/Russia' },
  'Judicial Reform': { he: 'רפורמה משפטית', en: 'Judicial Reform' },
  'Security': { he: 'ביטחון', en: 'Security' },
  'Diplomacy': { he: 'דיפלומטיה', en: 'Diplomacy' },
};

interface TopicStats {
  topic: string;
  articles: { article: FetchedArticle; analysis: ArticleAnalysis }[];
  sentimentCounts: Record<string, number>;
  leaningCounts: Record<PoliticalLeaning, number>;
  lensSet: Set<string>;
  sourceSet: Set<string>;
  signalCount: number;
  avgSignalScore: number;
}

/**
 * Extract key entities mentioned in articles for a topic
 */
function extractEntities(articles: FetchedArticle[]): { he: string; en: string }[] {
  const combined = articles.map((a) => `${a.title} ${a.description}`).join(' ').toLowerCase();
  const found: { he: string; en: string }[] = [];
  const seen = new Set<string>();

  for (const [key, entity] of Object.entries(ENTITY_DICT)) {
    if (combined.includes(key.toLowerCase()) && !seen.has(entity.en)) {
      found.push({ he: entity.he, en: entity.en });
      seen.add(entity.en);
    }
  }
  return found.slice(0, 5);
}

/**
 * Gather stats per topic from analyzed articles
 */
function gatherTopicStats(
  articles: FetchedArticle[],
  analyses: ArticleAnalysis[]
): Map<string, TopicStats> {
  const map = new Map<string, TopicStats>();

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const analysis = analyses[i];

    for (const topic of analysis.topics) {
      if (!map.has(topic)) {
        map.set(topic, {
          topic,
          articles: [],
          sentimentCounts: {},
          leaningCounts: { left: 0, 'center-left': 0, center: 0, 'center-right': 0, right: 0, unknown: 0 },
          lensSet: new Set(),
          sourceSet: new Set(),
          signalCount: 0,
          avgSignalScore: 0,
        });
      }
      const stats = map.get(topic)!;
      stats.articles.push({ article, analysis });
      stats.sentimentCounts[analysis.sentiment] = (stats.sentimentCounts[analysis.sentiment] || 0) + 1;
      stats.leaningCounts[analysis.politicalLeaning]++;
      stats.lensSet.add(article.lensCategory);
      stats.sourceSet.add(article.sourceId);
      if (analysis.isSignal) stats.signalCount++;
    }
  }

  // Calculate avg signal score
  for (const stats of map.values()) {
    stats.avgSignalScore =
      stats.articles.reduce((sum, a) => sum + a.analysis.signalScore, 0) / stats.articles.length;
  }

  return map;
}

/**
 * Detect LIKELIHOOD SHOCKS
 * A topic has a high volume of articles with high signal scores
 * Threshold: 5+ articles AND 60%+ are signals AND 3+ unique sources
 */
function detectLikelihoodShocks(topicStats: Map<string, TopicStats>): ShockEvent[] {
  const shocks: ShockEvent[] = [];

  for (const [topic, stats] of topicStats) {
    if (topic === 'General') continue;

    const articleCount = stats.articles.length;
    const signalRatio = stats.signalCount / articleCount;
    const sourceCount = stats.sourceSet.size;

    // Threshold: significant volume + high signal ratio + multiple sources
    if (articleCount >= 5 && signalRatio >= 0.4 && sourceCount >= 3) {
      const entities = extractEntities(stats.articles.map((a) => a.article));
      const entityStr = entities.length > 0
        ? entities.map((e) => e.en).slice(0, 3).join(', ')
        : topic;
      const entityStrHe = entities.length > 0
        ? entities.map((e) => e.he).slice(0, 3).join(', ')
        : TOPIC_DISPLAY[topic]?.he || topic;

      const dominantSentiment = Object.entries(stats.sentimentCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

      // Calculate delta based on signal strength
      const delta = Math.round((signalRatio * 10) + (sourceCount * 2));

      // Confidence from source diversity and signal ratio
      const confidence: Confidence =
        sourceCount >= 5 && signalRatio >= 0.6 ? 'high' :
        sourceCount >= 3 && signalRatio >= 0.4 ? 'medium' : 'low';

      // Get top sources
      const topSources = Array.from(stats.sourceSet).slice(0, 3).map((sid) => {
        const art = stats.articles.find((a) => a.article.sourceId === sid);
        return { name: art?.article.sourceName || sid, url: art?.article.link || '#' };
      });

      // Latest article timestamp
      const latestTs = stats.articles
        .map((a) => a.article.pubDate)
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        || new Date().toISOString();

      shocks.push({
        id: `auto-likelihood-${topic.toLowerCase().replace(/\W+/g, '-')}`,
        type: 'likelihood',
        headline: {
          he: `זינוק בסיקור: ${articleCount} כתבות על ${entityStrHe} מ-${sourceCount} מקורות`,
          en: `Coverage Spike: ${articleCount} articles on ${entityStr} from ${sourceCount} sources`,
        },
        whatMoved: {
          he: `${articleCount} כתבות מ-${sourceCount} מקורות שונים מכסות את נושא ${TOPIC_DISPLAY[topic]?.he || topic}. ${Math.round(signalRatio * 100)}% מהכתבות זוהו כסיגנל חדשותי משמעותי. הסנטימנט הדומיננטי: ${dominantSentiment === 'negative' ? 'שלילי' : dominantSentiment === 'positive' ? 'חיובי' : 'מעורב'}.`,
          en: `${articleCount} articles from ${sourceCount} different sources cover ${topic}. ${Math.round(signalRatio * 100)}% identified as significant news signals. Dominant sentiment: ${dominantSentiment}.`,
        },
        delta: dominantSentiment === 'negative' ? delta : -delta,
        timeWindow: { he: 'שעות אחרונות', en: 'Last few hours' },
        confidence,
        whyNow: {
          he: `ריכוז חריג של כתבות מ-${sourceCount} מקורות בלתי תלויים מצביע על התפתחות משמעותית בזמן אמת.`,
          en: `Unusual concentration of articles from ${sourceCount} independent sources indicates a significant real-time development.`,
        },
        whoDriving: {
          he: entities.length > 0
            ? `שחקנים מרכזיים: ${entityStrHe}`
            : `מספר גורמים מעורבים בהתפתחות`,
          en: entities.length > 0
            ? `Key actors: ${entityStr}`
            : `Multiple actors involved in this development`,
        },
        sources: topSources,
        timestamp: latestTs,
      });
    }
  }

  return shocks;
}

/**
 * Detect NARRATIVE SHOCKS
 * A topic where one political side is overwhelmingly negative while the other is positive/neutral
 * Indicates a narrative framing war
 */
function detectNarrativeShocks(topicStats: Map<string, TopicStats>): ShockEvent[] {
  const shocks: ShockEvent[] = [];

  for (const [topic, stats] of topicStats) {
    if (topic === 'General' || stats.articles.length < 4) continue;

    // Split articles by political leaning
    const rightArticles = stats.articles.filter((a) =>
      a.analysis.politicalLeaning === 'right' || a.analysis.politicalLeaning === 'center-right'
    );
    const leftArticles = stats.articles.filter((a) =>
      a.analysis.politicalLeaning === 'left' || a.analysis.politicalLeaning === 'center-left'
    );

    if (rightArticles.length < 2 || leftArticles.length < 2) continue;

    // Calculate sentiment distribution for each side
    const rightNeg = rightArticles.filter((a) => a.analysis.sentiment === 'negative').length;
    const rightPos = rightArticles.filter((a) => a.analysis.sentiment === 'positive').length;
    const leftNeg = leftArticles.filter((a) => a.analysis.sentiment === 'negative').length;
    const leftPos = leftArticles.filter((a) => a.analysis.sentiment === 'positive').length;

    const rightNegRatio = rightNeg / rightArticles.length;
    const leftNegRatio = leftNeg / leftArticles.length;

    // Detect significant sentiment divergence between left and right
    const sentimentGap = Math.abs(rightNegRatio - leftNegRatio);

    if (sentimentGap >= 0.4) {
      const topicDisplay = TOPIC_DISPLAY[topic] || { he: topic, en: topic };
      const entities = extractEntities(stats.articles.map((a) => a.article));

      const topSources = Array.from(stats.sourceSet).slice(0, 3).map((sid) => {
        const art = stats.articles.find((a) => a.article.sourceId === sid);
        return { name: art?.article.sourceName || sid, url: art?.article.link || '#' };
      });

      const latestTs = stats.articles
        .map((a) => a.article.pubDate).filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        || new Date().toISOString();

      const confidence: Confidence = sentimentGap >= 0.6 ? 'high' : 'medium';

      shocks.push({
        id: `auto-narrative-${topic.toLowerCase().replace(/\W+/g, '-')}`,
        type: 'narrative',
        headline: {
          he: `פער נרטיבי: ימין ושמאל מתארים מציאות שונה בנושא ${topicDisplay.he}`,
          en: `Narrative Gap: Right and Left describe different realities on ${topicDisplay.en}`,
        },
        whatMoved: {
          he: `ניתוח אוטומטי של ${stats.articles.length} כתבות מזהה פער סנטימנט של ${Math.round(sentimentGap * 100)}% בין תקשורת ימין (${Math.round(rightNegRatio * 100)}% שלילי) לתקשורת שמאל (${Math.round(leftNegRatio * 100)}% שלילי). ` +
              `ימין: ${rightPos} חיובי, ${rightNeg} שלילי. שמאל: ${leftPos} חיובי, ${leftNeg} שלילי.`,
          en: `Automated analysis of ${stats.articles.length} articles identifies a ${Math.round(sentimentGap * 100)}% sentiment gap between right-wing media (${Math.round(rightNegRatio * 100)}% negative) and left-wing media (${Math.round(leftNegRatio * 100)}% negative). ` +
              `Right: ${rightPos} positive, ${rightNeg} negative. Left: ${leftPos} positive, ${leftNeg} negative.`,
        },
        delta: 0,
        timeWindow: { he: 'שעות אחרונות', en: 'Last few hours' },
        confidence,
        whyNow: {
          he: `פיצול נרטיבי חד בין צדדי הספקטרום הפוליטי מעיד על נושא שנוי במחלוקת עמוקה.`,
          en: `Sharp narrative split between political spectrum sides indicates a deeply contested issue.`,
        },
        whoDriving: {
          he: entities.length > 0
            ? `מעורבים: ${entities.map((e) => e.he).join(', ')}`
            : `פילוג פוליטי מבני`,
          en: entities.length > 0
            ? `Involved: ${entities.map((e) => e.en).join(', ')}`
            : `Structural political polarization`,
        },
        sources: topSources,
        timestamp: latestTs,
      });
    }
  }

  return shocks;
}

/**
 * Detect FRAGMENTATION SHOCKS
 * Same topic covered very differently by Israeli vs International media
 * High lens divergence = fragmentation
 */
function detectFragmentationShocks(topicStats: Map<string, TopicStats>): ShockEvent[] {
  const shocks: ShockEvent[] = [];

  for (const [topic, stats] of topicStats) {
    if (topic === 'General' || stats.articles.length < 4) continue;

    // Split by lens: Israeli vs International
    const israeliArticles = stats.articles.filter((a) =>
      a.article.lensCategory.startsWith('il-')
    );
    const internationalArticles = stats.articles.filter((a) =>
      a.article.lensCategory.startsWith('int-')
    );

    if (israeliArticles.length < 2 || internationalArticles.length < 2) continue;

    // Compare sentiment distributions
    const ilNegRatio = israeliArticles.filter((a) => a.analysis.sentiment === 'negative').length / israeliArticles.length;
    const intNegRatio = internationalArticles.filter((a) => a.analysis.sentiment === 'negative').length / internationalArticles.length;

    const coverageGap = Math.abs(ilNegRatio - intNegRatio);

    if (coverageGap >= 0.35) {
      const topicDisplay = TOPIC_DISPLAY[topic] || { he: topic, en: topic };

      const topSources = Array.from(stats.sourceSet).slice(0, 4).map((sid) => {
        const art = stats.articles.find((a) => a.article.sourceId === sid);
        return { name: art?.article.sourceName || sid, url: art?.article.link || '#' };
      });

      const latestTs = stats.articles
        .map((a) => a.article.pubDate).filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        || new Date().toISOString();

      const confidence: Confidence = coverageGap >= 0.5 ? 'high' : 'medium';
      const gapPercent = Math.round(coverageGap * 100);

      shocks.push({
        id: `auto-frag-${topic.toLowerCase().replace(/\W+/g, '-')}`,
        type: 'fragmentation',
        headline: {
          he: `פער ${gapPercent}% בין סיקור ישראלי לבינלאומי בנושא ${topicDisplay.he}`,
          en: `${gapPercent}% Gap Between Israeli and International Coverage of ${topicDisplay.en}`,
        },
        whatMoved: {
          he: `ניתוח ${stats.articles.length} כתבות מזהה פער של ${gapPercent}% בסנטימנט בין תקשורת ישראלית (${israeliArticles.length} כתבות, ${Math.round(ilNegRatio * 100)}% שלילי) לתקשורת בינלאומית (${internationalArticles.length} כתבות, ${Math.round(intNegRatio * 100)}% שלילי).`,
          en: `Analysis of ${stats.articles.length} articles identifies a ${gapPercent}% sentiment gap between Israeli media (${israeliArticles.length} articles, ${Math.round(ilNegRatio * 100)}% negative) and international media (${internationalArticles.length} articles, ${Math.round(intNegRatio * 100)}% negative).`,
        },
        delta: 0,
        timeWindow: { he: 'שעות אחרונות', en: 'Last few hours' },
        confidence,
        whyNow: {
          he: `הפער בין הסיקור הישראלי לבינלאומי מצביע על תפיסות שונות של אותו אירוע — מידע חשוב לניתוח אסטרטגי.`,
          en: `The gap between Israeli and international coverage points to different perceptions of the same event — critical for strategic analysis.`,
        },
        whoDriving: {
          he: `פערי תפיסה מבניים בין תקשורות שונות`,
          en: `Structural perception gaps between different media ecosystems`,
        },
        sources: topSources,
        timestamp: latestTs,
      });
    }
  }

  return shocks;
}

/**
 * Main: detect all shocks from articles
 * Returns sorted by confidence (high first), then by timestamp
 */
export function detectShocks(articles: FetchedArticle[]): ShockEvent[] {
  if (articles.length < 5) return [];

  const analyses = articles.map(analyzeArticle);
  const topicStats = gatherTopicStats(articles, analyses);

  const likelihoodShocks = detectLikelihoodShocks(topicStats);
  const narrativeShocks = detectNarrativeShocks(topicStats);
  const fragmentationShocks = detectFragmentationShocks(topicStats);

  const allShocks = [...likelihoodShocks, ...narrativeShocks, ...fragmentationShocks];

  // Sort: high confidence first, then by timestamp
  const confidenceOrder: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };
  allShocks.sort((a, b) => {
    const confDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    if (confDiff !== 0) return confDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return allShocks.slice(0, 10); // Max 10 shocks
}

/**
 * Get entity extraction results for articles (exposed for Entity Graph)
 */
export function extractArticleEntities(articles: FetchedArticle[]): {
  entity: { he: string; en: string; type: string };
  count: number;
  articles: string[];
}[] {
  const entityCounts = new Map<string, {
    entity: { he: string; en: string; type: string };
    count: number;
    articleIds: Set<string>;
  }>();

  for (const article of articles) {
    const text = `${article.title} ${article.description}`.toLowerCase();

    for (const [key, entity] of Object.entries(ENTITY_DICT)) {
      if (text.includes(key.toLowerCase())) {
        if (!entityCounts.has(entity.en)) {
          entityCounts.set(entity.en, {
            entity: { he: entity.he, en: entity.en, type: entity.type },
            count: 0,
            articleIds: new Set(),
          });
        }
        const entry = entityCounts.get(entity.en)!;
        if (!entry.articleIds.has(article.id)) {
          entry.count++;
          entry.articleIds.add(article.id);
        }
      }
    }
  }

  return Array.from(entityCounts.values())
    .map((e) => ({
      entity: e.entity,
      count: e.count,
      articles: Array.from(e.articleIds),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Entity co-occurrence: which entities appear together in articles
 */
export function getEntityCooccurrence(articles: FetchedArticle[]): {
  entity1: string;
  entity2: string;
  sharedArticles: number;
}[] {
  // Get entities per article
  const articleEntities = new Map<string, Set<string>>();

  for (const article of articles) {
    const text = `${article.title} ${article.description}`.toLowerCase();
    const entities = new Set<string>();

    for (const [key, entity] of Object.entries(ENTITY_DICT)) {
      if (text.includes(key.toLowerCase())) {
        entities.add(entity.en);
      }
    }
    if (entities.size >= 2) {
      articleEntities.set(article.id, entities);
    }
  }

  // Count co-occurrences
  const pairCounts = new Map<string, number>();
  for (const entities of articleEntities.values()) {
    const arr = Array.from(entities);
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const pair = [arr[i], arr[j]].sort().join('|||');
        pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
      }
    }
  }

  return Array.from(pairCounts.entries())
    .map(([pair, count]) => {
      const [entity1, entity2] = pair.split('|||');
      return { entity1, entity2, sharedArticles: count };
    })
    .filter((p) => p.sharedArticles >= 2)
    .sort((a, b) => b.sharedArticles - a.sharedArticles)
    .slice(0, 20);
}

export { ENTITY_DICT };
