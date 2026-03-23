/**
 * AI Article Analyzer
 * Analyzes RSS articles for: topics, sentiment, signal/noise classification
 * Uses Claude API when ANTHROPIC_API_KEY is set, otherwise falls back to keyword-based analysis
 */

import { FetchedArticle } from './rss-fetcher';
import { getEnrichment } from './article-enrichment';

export type PoliticalLeaning = 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'unknown';

export interface ArticleAnalysis {
  articleId: string;
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  isSignal: boolean;
  signalScore: number; // 0-100
  region: 'israel' | 'middle-east' | 'global';
  politicalLeaning: PoliticalLeaning;
  isEnriched?: boolean;
  summary?: string;
}

// ── Source → Political Leaning Mapping ──
// Based on well-known editorial positions of each outlet
const SOURCE_POLITICAL_MAP: Record<string, PoliticalLeaning> = {
  // Israeli – Left / Center-Left
  'haaretz': 'left',
  'haaretz-en': 'left',

  // Israeli – Center / Mainstream
  'ynet': 'center',
  'ynet-en': 'center',
  'mako': 'center',
  'kan': 'center',
  'walla': 'center',
  'calcalist': 'center',
  'globes': 'center',
  'timesofisrael': 'center',
  'i24news': 'center',
  'jpost': 'center-right',

  // Israeli – Right
  'israelhayom': 'right',
  'inn': 'right',
  'channel14': 'right',

  // International – Left / Center-Left
  'guardian-world': 'center-left',
  'nyt-world': 'center-left',
  'nyt-mideast': 'center-left',
  'bbc-world': 'center',
  'bbc-mideast': 'center',
  'france24': 'center',
  'dw': 'center',
  'sky-world': 'center-right',
  'reuters-world': 'center',
  'reuters-mideast': 'center',
  'cnn-world': 'center-left',
  'cnn-mideast': 'center-left',
  'economist': 'center-right',
  'foreignpolicy': 'center',

  // International – ME Regional
  'aljazeera': 'left',
  'almonitor': 'center',
  'middleeasteye': 'center-left',
  'thenational': 'center-right',
  'arabnews': 'center-right',
};

export interface TrendingTopic {
  topic: string;
  count: number;
  sources: string[];
  lenses: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  leaningBreakdown: Record<PoliticalLeaning, number>;
}

export interface TopicByLeaning {
  topic: string;
  leanings: Record<PoliticalLeaning, { count: number; sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' }>;
  totalCount: number;
}

// ── Keyword-based analysis (no API needed) ──

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'Iran Nuclear': ['iran', 'nuclear', 'iaea', 'uranium', 'enrichment', 'tehran', 'sanctions', 'jcpoa', 'איראן', 'גרעין'],
  'Gaza Conflict': ['gaza', 'hamas', 'ceasefire', 'hostages', 'idf', 'humanitarian', 'עזה', 'חמאס', 'חטופים'],
  'Lebanon/Hezbollah': ['lebanon', 'hezbollah', 'nasrallah', 'beirut', 'liban', 'לבנון', 'חיזבאללה'],
  'Saudi Normalization': ['saudi', 'normalization', 'mbs', 'abraham accords', 'סעודיה', 'נורמליזציה'],
  'US Politics': ['biden', 'trump', 'congress', 'white house', 'washington', 'senate', 'election'],
  'West Bank': ['west bank', 'settlements', 'jenin', 'ramallah', 'palestinian authority', 'יהודה ושומרון', 'התנחלויות'],
  'Syria': ['syria', 'assad', 'damascus', 'rebel', 'סוריה'],
  'Economy': ['economy', 'inflation', 'gdp', 'market', 'stock', 'trade', 'כלכלה', 'אינפלציה'],
  'Technology': ['tech', 'ai', 'artificial intelligence', 'cyber', 'startup', 'הייטק', 'סייבר'],
  'Climate': ['climate', 'emissions', 'renewable', 'green', 'energy', 'אקלים'],
  'Ukraine/Russia': ['ukraine', 'russia', 'putin', 'zelensky', 'nato', 'אוקראינה', 'רוסיה'],
  'Judicial Reform': ['judicial', 'supreme court', 'democracy', 'protest', 'רפורמה', 'בג"צ', 'מחאה'],
  'Security': ['security', 'terror', 'attack', 'missile', 'rocket', 'defense', 'ביטחון', 'טרור', 'טיל'],
  'Diplomacy': ['diplomat', 'summit', 'agreement', 'treaty', 'ambassador', 'un', 'דיפלומטיה'],
};

const NEGATIVE_WORDS = [
  // English
  'war', 'attack', 'kill', 'dead', 'death', 'bomb', 'strike', 'crisis', 'threat', 'terror',
  'conflict', 'violence', 'casualties', 'destruction', 'collapse', 'danger', 'fear', 'warn',
  'sanctions', 'escalation', 'invasion', 'shooting', 'explosion', 'hostage', 'siege',
  'recession', 'crash', 'panic', 'disaster', 'catastrophe', 'famine', 'drought',
  'assassination', 'coup', 'massacre', 'genocide', 'torture', 'arrest', 'detained',
  'missile', 'shelling', 'airstrike', 'wounded', 'injured', 'refugee', 'displacement',
  'scandal', 'corruption', 'fraud', 'breach', 'hack', 'leak', 'failure', 'shutdown',
  // Hebrew
  'מלחמה', 'פיגוע', 'הרוג', 'מוות', 'משבר', 'איום', 'אזהרה', 'הסלמה', 'פלישה',
  'ירי', 'פיצוץ', 'חטיפה', 'מצור', 'מיתון', 'קריסה', 'פאניקה', 'אסון', 'רעידת אדמה',
  'חיסול', 'הפיכה', 'טבח', 'עינויים', 'מעצר', 'עצור', 'טיל', 'הפגזה', 'תקיפה',
  'פצוע', 'נפגע', 'פליט', 'עקירה', 'שחיתות', 'הונאה', 'פריצה', 'דליפה', 'כשל',
];

const POSITIVE_WORDS = [
  // English
  'peace', 'agreement', 'deal', 'progress', 'success', 'growth', 'hope', 'breakthrough',
  'cooperation', 'ceasefire', 'release', 'rescue', 'reform', 'recovery', 'victory',
  'prosperity', 'innovation', 'milestone', 'historic', 'achievement', 'partnership',
  'alliance', 'boost', 'surge', 'improvement', 'resolved', 'stabilize', 'de-escalation',
  'reconciliation', 'liberation', 'reconstruction', 'aid', 'donation', 'investment',
  'record high', 'breakthrough', 'elected', 'approved', 'ratified', 'signed',
  // Hebrew
  'שלום', 'הסכם', 'התקדמות', 'הצלחה', 'פריצת דרך', 'שיתוף פעולה', 'ניצחון',
  'שגשוג', 'חדשנות', 'הישג', 'שותפות', 'ברית', 'עלייה', 'שיפור', 'ייצוב',
  'פיוס', 'שחרור', 'שיקום', 'סיוע', 'תרומה', 'השקעה', 'שיא', 'אושר', 'נחתם',
];

const SIGNAL_INDICATORS = [
  'breaking', 'exclusive', 'first time', 'unprecedented', 'major', 'significant',
  'dramatic', 'shift', 'reversal', 'surprise', 'shock', 'milestone',
  'בלעדי', 'חדשות', 'דרמטי', 'מפנה', 'תפנית', 'פריצת דרך',
];

// ── Political Leaning Keyword Dictionaries (for content-based classification) ──

const RIGHT_KEYWORDS = [
  // Hebrew
  'ריבונות', 'בטחון לאומי', 'התנחלויות', 'ארץ ישראל', 'הרתעה', 'תגובה נחרצת',
  'ציונות', 'יהודית', 'גוש אמונים', 'נאמנות', 'כוח צבאי', 'מבצע צבאי',
  'טרור', 'חיסול', 'הגנה עצמית', 'זכות קיום', 'מדינה יהודית',
  // English
  'sovereignty', 'national security', 'settlements', 'land of israel', 'deterrence',
  'decisive response', 'zionism', 'military operation', 'self-defense', 'jewish state',
  'strong response', 'zero tolerance', 'iron fist', 'preemptive', 'right to exist',
];

const LEFT_KEYWORDS = [
  // Hebrew
  'כיבוש', 'זכויות אדם', 'שתי מדינות', 'מחאה חברתית', 'צדק חברתי',
  'דמוקרטיה', 'חופש ביטוי', 'שוויון', 'מיעוטים', 'הומניטרי',
  'פליטים', 'עוני', 'אי-שוויון', 'חברה אזרחית', 'זכויות', 'דו-קיום',
  // English
  'occupation', 'human rights', 'two-state', 'social justice', 'democracy',
  'freedom of speech', 'equality', 'minorities', 'humanitarian', 'refugees',
  'poverty', 'inequality', 'civil society', 'coexistence', 'proportional',
  'disproportionate', 'civilian casualties', 'international law', 'war crimes',
];

const CENTER_KEYWORDS = [
  // Hebrew
  'פשרה', 'דיאלוג', 'משא ומתן', 'איזון', 'מתינות', 'שיתוף פעולה',
  'הסכמה', 'גישור', 'מו"מ', 'ביטחון ושלום',
  // English
  'compromise', 'dialogue', 'negotiation', 'balance', 'moderation', 'bipartisan',
  'cooperation', 'consensus', 'mediation', 'pragmatic',
];

/**
 * Classify political leaning based on article content.
 * Blends source-based leaning (40%) with content-based keywords (60%).
 * Falls back to source-based only if no full text available.
 */
export function classifyPoliticalLeaning(
  fullText: string,
  sourceLeaning: PoliticalLeaning
): PoliticalLeaning {
  const lower = fullText.toLowerCase();

  const rightScore = RIGHT_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).length;
  const leftScore = LEFT_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).length;
  const centerScore = CENTER_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).length;

  const totalHits = rightScore + leftScore + centerScore;

  // If very few keyword hits, content analysis is unreliable → use source-based
  if (totalHits < 3) return sourceLeaning;

  // Determine content-based leaning
  let contentLeaning: PoliticalLeaning;
  if (rightScore > leftScore && rightScore > centerScore) {
    contentLeaning = rightScore > leftScore * 2 ? 'right' : 'center-right';
  } else if (leftScore > rightScore && leftScore > centerScore) {
    contentLeaning = leftScore > rightScore * 2 ? 'left' : 'center-left';
  } else {
    contentLeaning = 'center';
  }

  // Blend: 40% source + 60% content
  const leaningScale: Record<PoliticalLeaning, number> = {
    'left': -2, 'center-left': -1, 'center': 0, 'center-right': 1, 'right': 2, 'unknown': 0,
  };
  const blended = leaningScale[sourceLeaning] * 0.4 + leaningScale[contentLeaning] * 0.6;

  if (blended <= -1.5) return 'left';
  if (blended <= -0.5) return 'center-left';
  if (blended <= 0.5) return 'center';
  if (blended <= 1.5) return 'center-right';
  return 'right';
}

function detectTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.push(topic);
    }
  }
  return found.length > 0 ? found : ['General'];
}

function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' | 'mixed' {
  const lower = text.toLowerCase();
  const negCount = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
  const posCount = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;

  if (negCount > 0 && posCount > 0) return 'mixed';
  if (negCount > posCount) return 'negative';
  if (posCount > negCount) return 'positive';
  return 'neutral';
}

function detectSignal(text: string): { isSignal: boolean; score: number } {
  const lower = text.toLowerCase();
  const signalHits = SIGNAL_INDICATORS.filter((w) => lower.includes(w)).length;
  const score = Math.min(100, 30 + signalHits * 20);
  return { isSignal: signalHits >= 1, score };
}

function detectRegion(article: FetchedArticle): 'israel' | 'middle-east' | 'global' {
  if (article.lensCategory.startsWith('il-')) return 'israel';
  const text = `${article.title} ${article.description}`.toLowerCase();
  const meMentions = ['israel', 'iran', 'gaza', 'lebanon', 'syria', 'saudi', 'egypt', 'jordan', 'iraq']
    .filter((w) => text.includes(w)).length;
  return meMentions > 0 ? 'middle-east' : 'global';
}

function detectPoliticalLeaning(article: FetchedArticle): PoliticalLeaning {
  return SOURCE_POLITICAL_MAP[article.sourceId] || 'unknown';
}

export function analyzeArticle(article: FetchedArticle): ArticleAnalysis {
  const enrichment = getEnrichment(article.id);
  const baseText = `${article.title} ${article.description}`;
  // Use full text if enriched, otherwise fall back to title + description
  const analysisText = enrichment ? `${baseText} ${enrichment.fullText}` : baseText;

  const topics = detectTopics(analysisText);
  const sentiment = detectSentiment(analysisText);
  const { isSignal, score } = detectSignal(analysisText);
  const region = detectRegion(article);

  // Enhanced political leaning: content-based when enriched, source-based otherwise
  const sourceLeaning = detectPoliticalLeaning(article);
  const politicalLeaning = enrichment
    ? classifyPoliticalLeaning(enrichment.fullText, sourceLeaning)
    : sourceLeaning;

  return {
    articleId: article.id,
    topics,
    sentiment,
    isSignal,
    signalScore: score,
    region,
    politicalLeaning,
    isEnriched: !!enrichment,
  };
}

export function analyzeArticles(articles: FetchedArticle[]): ArticleAnalysis[] {
  return articles.map(analyzeArticle);
}

export function extractTrendingTopics(
  articles: FetchedArticle[],
  analyses: ArticleAnalysis[]
): TrendingTopic[] {
  const topicMap = new Map<string, {
    count: number;
    sources: Set<string>;
    lenses: Set<string>;
    sentiments: string[];
    leaningBreakdown: Record<PoliticalLeaning, number>;
  }>();

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const analysis = analyses[i];

    for (const topic of analysis.topics) {
      if (!topicMap.has(topic)) {
        topicMap.set(topic, {
          count: 0,
          sources: new Set(),
          lenses: new Set(),
          sentiments: [],
          leaningBreakdown: { left: 0, 'center-left': 0, center: 0, 'center-right': 0, right: 0, unknown: 0 },
        });
      }
      const entry = topicMap.get(topic)!;
      entry.count++;
      entry.sources.add(article.sourceName);
      entry.lenses.add(article.lensCategory);
      entry.sentiments.push(analysis.sentiment);
      entry.leaningBreakdown[analysis.politicalLeaning]++;
    }
  }

  return Array.from(topicMap.entries())
    .map(([topic, data]) => ({
      topic,
      count: data.count,
      sources: Array.from(data.sources),
      lenses: Array.from(data.lenses),
      sentiment: getMajoritySentiment(data.sentiments),
      leaningBreakdown: data.leaningBreakdown,
    }))
    .sort((a, b) => b.count - a.count);
}

export function extractTopicsByLeaning(
  articles: FetchedArticle[],
  analyses: ArticleAnalysis[]
): TopicByLeaning[] {
  const map = new Map<string, Record<PoliticalLeaning, { count: number; sentiments: string[] }>>();

  for (let i = 0; i < articles.length; i++) {
    const analysis = analyses[i];

    for (const topic of analysis.topics) {
      if (!map.has(topic)) {
        const init: Record<PoliticalLeaning, { count: number; sentiments: string[] }> = {
          left: { count: 0, sentiments: [] },
          'center-left': { count: 0, sentiments: [] },
          center: { count: 0, sentiments: [] },
          'center-right': { count: 0, sentiments: [] },
          right: { count: 0, sentiments: [] },
          unknown: { count: 0, sentiments: [] },
        };
        map.set(topic, init);
      }
      const entry = map.get(topic)!;
      entry[analysis.politicalLeaning].count++;
      entry[analysis.politicalLeaning].sentiments.push(analysis.sentiment);
    }
  }

  return Array.from(map.entries())
    .map(([topic, leanings]) => {
      const processed: Record<PoliticalLeaning, { count: number; sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' }> = {} as never;
      let totalCount = 0;
      for (const [leaning, data] of Object.entries(leanings)) {
        processed[leaning as PoliticalLeaning] = {
          count: data.count,
          sentiment: getMajoritySentiment(data.sentiments),
        };
        totalCount += data.count;
      }
      return { topic, leanings: processed, totalCount };
    })
    .filter((t) => t.totalCount >= 2)
    .sort((a, b) => b.totalCount - a.totalCount);
}

function getMajoritySentiment(sentiments: string[]): 'positive' | 'negative' | 'neutral' | 'mixed' {
  const counts: Record<string, number> = {};
  for (const s of sentiments) counts[s] = (counts[s] || 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (sorted[0]?.[0] as 'positive' | 'negative' | 'neutral' | 'mixed') || 'neutral';
}
