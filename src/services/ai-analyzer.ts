/**
 * AI Article Analyzer
 * Analyzes RSS articles for: topics, sentiment, signal/noise classification
 * Uses Claude API when ANTHROPIC_API_KEY is set, otherwise falls back to keyword-based analysis
 */

import { FetchedArticle } from './rss-fetcher';
import { getEnrichment } from './article-enrichment';
import { getGroqResult, warmGroqFromKV } from './groq-analyzer';

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
  'Iran Nuclear': [
    // English — nuclear/military
    'iran', 'nuclear', 'iaea', 'uranium', 'enrichment', 'tehran', 'sanctions', 'jcpoa',
    'khamenei', 'rouhani', 'pezeshkian', 'revolutionary guard', 'irgc',
    // English — US-Israel-Iran deal/ceasefire
    'israel iran', 'iran strike', 'iran attack', 'iran war', 'iran deal', 'iran ceasefire',
    'iran diplomacy', 'us iran', 'america iran', 'iran negotiations', 'iran agreement',
    'iran framework', 'iran truce', 'iran talks', 'iran nuclear deal',
    // Hebrew — core
    'איראן', 'גרעין', 'טהרן', 'חמינאי', 'משמרות המהפכה',
    // Hebrew — US-Israel-Iran ceasefire/deal
    'ישראל איראן', 'תקיפה באיראן', 'מלחמה עם איראן', 'הסכם עם איראן',
    'הפסקת אש עם איראן', 'הפסקת אש באיראן', 'מו"מ איראן', 'שיחות עם איראן',
    'תיווך איראן', 'ארה"ב איראן', 'אמריקה איראן', 'ישראל ארצות הברית איראן',
    'הסכם גרעין', 'שיחות גרעין', 'משא ומתן איראן', 'נסיגה מאיראן',
    'הפצצה באיראן', 'מתקפה על איראן', 'תגובת איראן', 'איראן ישראל',
    // Strait of Hormuz — Iranian strategic pressure
    'hormuz', 'strait of hormuz', 'persian gulf blockade', 'gulf shipping', 'tanker seizure',
    'oil tanker iran', 'naval blockade iran', 'gulf of oman',
    'מצר הורמוז', 'הורמוז', 'חסימת הורמוז', 'המפרץ הפרסי', 'חסימת מצר',
    'ספנות המפרץ', 'עצירת מכלית', 'מכלית נפט איראן', 'חסימה ימית',
  ],
  'Gaza Conflict': ['gaza', 'hamas', 'hostages', 'idf', 'humanitarian', 'rafah', 'khan younis', 'sinwar', 'unrwa', 'עזה', 'חמאס', 'חטופים', 'רפח', 'אונר"א', 'ceasefire gaza', 'הפסקת אש עזה', 'הפסקת אש בעזה'],
  'Lebanon/Hezbollah': ['lebanon', 'hezbollah', 'nasrallah', 'beirut', 'south lebanon', 'לבנון', 'חיזבאללה', 'ביירות', 'דרום לבנון'],
  'Saudi Normalization': ['saudi', 'normalization', 'mbs', 'abraham accords', 'riyadh', 'arab states', 'סעודיה', 'נורמליזציה', 'אברהם', 'ריאד'],
  'US Politics': ['trump', 'biden', 'harris', 'congress', 'white house', 'washington', 'senate', 'republican', 'democrat', 'tariff', 'tariffs', 'election', 'oval office', 'state department', 'פה', 'מכס', 'טראמפ', 'ביידן'],
  'China': ['china', 'beijing', 'xi jinping', 'taiwan', 'chinese', 'prc', 'bri', 'huawei', 'סין', 'בייג\'ינג', 'שי ג\'ינפינג', 'טיוואן'],
  'West Bank': ['west bank', 'settlements', 'jenin', 'ramallah', 'nablus', 'palestinian authority', 'abu mazen', 'יהודה ושומרון', 'התנחלויות', 'ג\'נין', 'שכם', 'רמאללה'],
  'Syria': ['syria', 'damascus', 'hts', 'hayat tahrir', 'aleppo', 'idlib', 'jolani', 'סוריה', 'דמשק', 'ארגון'],
  'Economy': ['economy', 'inflation', 'gdp', 'fed', 'federal reserve', 'interest rate', 'recession', 'market', 'stock', 'trade', 'dollar', 'oil price', 'tariff', 'crude oil', 'brent', 'opec', 'hormuz oil', 'shipping disruption', 'supply chain', 'כלכלה', 'אינפלציה', 'ריבית', 'מיתון', 'שוק', 'נפט', 'דולר', 'מכס', 'מחיר נפט', 'אופ"ק', 'שיבוש אספקה', 'הורמוז נפט'],
  'Technology': ['tech', 'ai', 'artificial intelligence', 'openai', 'cyber', 'startup', 'semiconductor', 'chip', 'nvidia', 'הייטק', 'סייבר', 'בינה מלאכותית', 'שבב'],
  'Climate': ['climate', 'emissions', 'cop', 'renewable', 'solar', 'green', 'energy transition', 'אקלים', 'פחמן', 'אנרגיה ירוקה'],
  'Elections': [
    // English — generic elections
    'election', 'elections', 'vote', 'votes', 'ballot', 'polling', 'polls', 'voter', 'voters',
    'candidate', 'campaign', 'polling station', 'exit poll', 'electoral', 'runoff',
    'primary election', 'snap election', 'early election', 'elected', 're-elected',
    // English — specific contexts
    'orban', 'hungary', 'french election', 'german election', 'uk election', 'israeli election',
    'knesset election', 'labour', 'conservatives', 'bundestag', 'parliament election',
    // Hebrew
    'בחירות', 'הצבעה', 'קלפי', 'מצביעים', 'מועמד', 'קמפיין', 'מפלגה', 'קואליציה בחירות',
    'בחירות מוקדמות', 'סקר בחירות', 'תוצאות בחירות', 'ניצחון בחירות', 'מנדטים',
    'אורבן', 'הונגריה', 'בחירות צרפת', 'בחירות גרמניה', 'בחירות בריטניה',
  ],
  'Ukraine/Russia': ['ukraine', 'russia', 'putin', 'zelensky', 'nato', 'kyiv', 'moscow', 'donbas', 'אוקראינה', 'רוסיה', 'פוטין', 'נאטו'],
  'Turkey/Egypt': ['turkey', 'erdogan', 'ankara', 'egypt', 'sisi', 'cairo', 'regional', 'טורקיה', 'ארדואן', 'מצרים', 'סיסי', 'קהיר'],
  'Judicial Reform': ['judicial', 'supreme court', 'democracy', 'protest', 'coalition', 'knesset', 'רפורמה', 'בג"צ', 'מחאה', 'קואליציה', 'כנסת'],
  'Security': ['terror attack', 'missile strike', 'rocket fire', 'drone strike', 'airstrike', 'naval blockade', 'warship', 'tanker attack', 'military operation', 'security threat', 'טרור', 'טיל', 'כטב"מ', 'תקיפה צבאית', 'פיגוע', 'ספינת מלחמה', 'חסימה ימית', 'מצר הורמוז', 'תקיפת מכלית', 'מבצע צבאי', 'איום ביטחוני', 'ביטחון לאומי'],
  'Diplomacy': ['diplomat', 'summit', 'agreement', 'treaty', 'ambassador', 'un ', 'united nations', 'foreign minister', 'דיפלומטיה', 'פסגה', 'הסכם', 'שגריר', 'האו"ם', 'שר חוץ'],
  'Sports': ['football', 'soccer', 'basketball', 'tennis', 'olympic', 'world cup', 'champions league', 'fifa', 'nba', 'premier league', 'מכבי', 'הפועל', 'בית"ר', 'כדורגל', 'כדורסל', 'טניס', 'אולימפי', 'ליגה', 'גביע', 'אליפות'],
  'General': ['society', 'culture', 'education', 'health', 'crime', 'law', 'religion', 'tourism', 'חברה', 'תרבות', 'חינוך', 'בריאות', 'פשע', 'משפט', 'דת', 'תיירות'],
  'Entertainment': [
    // TV/Media drama
    'שידור', 'רייטינג', 'ערוץ 12', 'ערוץ 13', 'ערוץ 11', 'ערוץ 14', 'קאן', 'מאקו', 'רשת 13',
    'מנחה', 'כוכב', 'סלבריטי', 'ריאליטי', 'סדרה', 'תוכנית בידור', 'צופים', 'מדדים', 'שיא צפייה',
    'בידור', 'פרסים', 'אירוע', 'מסיבה', 'אופנה', 'מוסיקה', 'להיט', 'זמרת', 'שחקן', 'שחקנית',
    'שידורים', 'עורכי דין', 'קידום', 'פיטורים', 'ריב בסטודיו', 'מאחורי הקלעים',
    // English
    'celebrity', 'reality show', 'ratings', 'viewership', 'tv host', 'broadcaster',
    'entertainment', 'showbiz', 'gossip', 'talk show', 'sitcom', 'drama series',
    'red carpet', 'awards show', 'music chart', 'pop star', 'actor', 'actress',
  ],
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
  'dramatic shift', 'reversal', 'surprise', 'shock', 'milestone',
  'בלעדי', 'דרמטי', 'מפנה', 'תפנית', 'פריצת דרך',
  // Note: 'חדשות' removed — appears in every Hebrew news article, not a signal indicator
];

// Entertainment/media content — deprioritize these heavily
const ENTERTAINMENT_KEYWORDS = [
  // Israeli reality / TV
  'האח הגדול', 'ריאליטי', 'שידור', 'רייטינג', 'מדדי צפייה', 'שיא צפייה',
  'כוכב', 'כוכבת', 'סלבריטי', 'בידור', 'להיט', 'זמרת', 'זמר', 'מנחה',
  'שחקן', 'שחקנית', 'עורכי תוכנית', 'הישרדות', 'כוכב נולד', 'מאסטר שף',
  'הקול הבא', 'ביג בראדר', 'ארץ נהדרת', 'פרפר נחמד', 'סרט ישראלי',
  'עם הפנים', 'הצחוק', 'קומדי', 'מועדון לילה', 'פסטיגל',
  // Gossip / personal drama
  'זועם', 'מתפרץ', 'ריב', 'פרידה', 'גירושין', 'נשיקה', 'רומן',
  'ממש לא', 'בן זוג של', 'בת זוג של', 'מאהב', 'בגידה',
  // English
  'celebrity', 'reality show', 'ratings', 'viewership', 'entertainment', 'showbiz',
  'gossip', 'talk show', 'pop star', 'red carpet', 'awards show', 'sitcom',
  'big brother', 'survivor', 'bachelor', 'idol',
];

function isEntertainmentContent(text: string): boolean {
  const lower = text.toLowerCase();
  // Single strong indicator is enough (e.g. "האח הגדול" or "ריאליטי")
  const strongKeywords = ['האח הגדול', 'ריאליטי', 'big brother', 'survivor', 'bachelor',
    'הישרדות', 'כוכב נולד', 'מאסטר שף', 'ארץ נהדרת', 'celebrity gossip', 'showbiz'];
  if (strongKeywords.some(kw => lower.includes(kw))) return true;
  // Otherwise require 2+ hits
  const hits = ENTERTAINMENT_KEYWORDS.filter(kw => lower.includes(kw)).length;
  return hits >= 2;
}

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

// Topics with generic single-word keywords require 2+ hits before being assigned.
// Topics with specific/rare keywords (hamas, hezbollah, etc.) only need 1 hit.
const TOPIC_MIN_SCORE: Record<string, number> = {
  'China':          3,  // 'china', 'chinese' are too generic alone
  'Technology':     3,  // 'tech', 'chip', 'ai' appear in many unrelated articles
  'Economy':        3,  // 'market', 'trade', 'stock' are very common
  'Climate':        2,
  'Diplomacy':      2,  // 'agreement', 'summit' can appear in non-diplomatic contexts
  'Sports':         2,
  'General':        2,
  'Turkey/Egypt':   2,
  'US Politics':    2,  // 'trump', 'washington' are specific enough with 1 hit
  'Syria':          2,
  // These have very specific keywords — 1 hit is reliable
  'Iran Nuclear':   1,
  'Gaza Conflict':  1,
  'Lebanon/Hezbollah': 1,
  'Saudi Normalization': 1,
  'Ukraine/Russia': 1,
  'Elections':      1,
  'West Bank':      1,
  'Security':       1,
  'Judicial Reform': 1,
};

function detectTopics(text: string): string[] {
  const lower = text.toLowerCase();

  const scores: { topic: string; score: number }[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        // Multi-word keywords are more specific — weight them higher
        score += kw.includes(' ') ? 2 : 1;
      }
    }
    const minScore = TOPIC_MIN_SCORE[topic] ?? 2;
    if (score >= minScore) scores.push({ topic, score });
  }

  if (scores.length === 0) return ['General'];

  scores.sort((a, b) => b.score - a.score);
  return scores.map(s => s.topic);
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
  // Base score 15 (not 30) — articles without signal indicators start low
  // Each signal hit adds 20 points: 0 hits=15, 1 hit=35, 2 hits=55, 3+=75
  const score = Math.min(100, 15 + signalHits * 20);
  // isSignal requires at least 2 signal indicators OR 1 strong hit
  return { isSignal: signalHits >= 2, score };
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

// Module-level analysis cache — keyed by article ID
// Cleared when getCachedArticles() refreshes (articles get new IDs on each fetch cycle)
const _analysisCache = new Map<string, ArticleAnalysis>();

export function clearAnalysisCache(): void {
  _analysisCache.clear();
}

export function analyzeArticle(article: FetchedArticle): ArticleAnalysis {
  // Return cached result if available
  if (_analysisCache.has(article.id)) {
    return _analysisCache.get(article.id)!;
  }

  const enrichment = getEnrichment(article.id);
  const baseText = `${article.title} ${article.description}`;
  const analysisText = enrichment ? `${baseText} ${enrichment.fullText}` : baseText;

  // ── Entertainment check — deprioritize media/celebrity articles ──
  const isEntertainment = isEntertainmentContent(analysisText);

  // ── Keyword baseline ──
  const kwTopics = isEntertainment
    ? ['Entertainment', 'General']
    : detectTopics(analysisText);
  const kwSentiment = detectSentiment(analysisText);
  const { isSignal: kwIsSignal, score: kwScore } = isEntertainment
    ? { isSignal: false, score: 10 }  // entertainment is never a signal
    : detectSignal(analysisText);
  const region = detectRegion(article);
  const sourceLeaning = detectPoliticalLeaning(article);
  const politicalLeaning = enrichment
    ? classifyPoliticalLeaning(enrichment.fullText, sourceLeaning)
    : sourceLeaning;

  // ── Groq enhancement (if pre-analysis ran for this article) ──
  const groq = getGroqResult(article.id);

  const topics    = isEntertainment
    ? ['Entertainment', 'General']
    : (groq && groq.topics.length > 0 ? groq.topics : kwTopics);
  const sentiment = groq ? groq.sentiment : kwSentiment;
  const isSignal  = isEntertainment ? false : (groq ? groq.isSignal : kwIsSignal);
  const signalScore = isEntertainment
    ? 10  // hard cap for entertainment
    : groq
      ? groq.signalScore  // trust Groq over keyword score — it's calibrated better
      : kwScore;

  // Groq political lean → map to PoliticalLeaning scale
  let finalLeaning = politicalLeaning;
  if (groq && groq.politicalLean !== 'none') {
    const groqMap: Record<string, PoliticalLeaning> = {
      left: 'left', center: 'center', right: 'right',
    };
    const groqLeaning = groqMap[groq.politicalLean] ?? politicalLeaning;
    // Blend: 40% source-based + 60% Groq content-based
    const scale: Record<PoliticalLeaning, number> = {
      left: -2, 'center-left': -1, center: 0, 'center-right': 1, right: 2, unknown: 0,
    };
    const blended = scale[politicalLeaning] * 0.4 + scale[groqLeaning] * 0.6;
    if (blended <= -1.5) finalLeaning = 'left';
    else if (blended <= -0.5) finalLeaning = 'center-left';
    else if (blended <= 0.5) finalLeaning = 'center';
    else if (blended <= 1.5) finalLeaning = 'center-right';
    else finalLeaning = 'right';
  }

  const result: ArticleAnalysis = {
    articleId: article.id,
    topics,
    sentiment,
    isSignal,
    signalScore,
    region,
    politicalLeaning: finalLeaning,
    isEnriched: !!enrichment || !!groq,
    summary: groq?.summaryHe || groq?.summaryEn || undefined,
  };

  _analysisCache.set(article.id, result);
  return result;
}

export function analyzeArticles(articles: FetchedArticle[]): ArticleAnalysis[] {
  return articles.map(analyzeArticle);
}

/**
 * Async version: warms L1 Groq cache from KV first (single mget round-trip),
 * then runs synchronous analysis. Use this in API routes instead of analyzeArticles().
 */
export async function analyzeArticlesWithGroq(articles: FetchedArticle[]): Promise<ArticleAnalysis[]> {
  await warmGroqFromKV(articles.map(a => a.id));
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
