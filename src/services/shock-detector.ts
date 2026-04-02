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
import type { ShockEvent, Confidence, ShockType, LocalizedText, ShockStatus } from '@/lib/types';
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
          he: `נושא ${TOPIC_DISPLAY[topic]?.he || topic} צובר מומנטום — ${sourceCount} מקורות עצמאיים מדווחים בו-זמנית, עם טון ${dominantSentiment === 'negative' ? 'שלילי' : dominantSentiment === 'positive' ? 'חיובי' : 'מעורב'} דומיננטי.`,
          en: `${TOPIC_DISPLAY[topic]?.en || topic} gaining momentum — ${sourceCount} independent sources reporting simultaneously, with predominantly ${dominantSentiment} tone.`,
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

// ── Topic-specific disagreement templates ──
// rightNeg* = text when RIGHT side is more negative (right criticizes / left defends)
// leftNeg*  = text when LEFT side is more negative  (left criticizes / right defends)
const DISAGREEMENT_TEMPLATES: Record<string, {
  rightNegHe: string; rightNegEn: string;
  leftNegHe:  string; leftNegEn:  string;
}> = {
  'Gaza Conflict': {
    rightNegHe: 'הימין מדגיש כישלון דיפלומטי ואיום ביטחוני; השמאל רואה הזדמנות לעסקה והכרח הומניטרי.',
    rightNegEn: 'Right emphasizes diplomatic failure and security threat; Left sees deal opportunity and humanitarian necessity.',
    leftNegHe:  'השמאל מדגיש נפגעים אזרחיים ואסון הומניטרי; הימין מציג התקדמות צבאית ולחץ על חמאס.',
    leftNegEn:  'Left highlights civilian casualties and humanitarian crisis; Right frames military progress and Hamas pressure.',
  },
  'Iran Nuclear': {
    rightNegHe: 'הימין קורא לפעולה צבאית מיידית וסנקציות; השמאל דוחף לדיפלומטיה ושיב לשולחן המשא ומתן.',
    rightNegEn: 'Right calls for immediate military action and sanctions; Left pushes for diplomacy and return to negotiations.',
    leftNegHe:  'השמאל חושש מהסלמה צבאית ומדגיש פיקוח בינלאומי; הימין מציג את הכורח של גבול "red line".',
    leftNegEn:  'Left warns against military escalation and stresses international oversight; Right frames the necessity of a red line.',
  },
  'Lebanon/Hezbollah': {
    rightNegHe: 'הימין דורש פעולה צבאית נרחבת נגד חיזבאללה; השמאל חושש מהסלמה אזורית ומדגיש פתרון דיפלומטי.',
    rightNegEn: 'Right demands broad military action against Hezbollah; Left warns of regional escalation and favors a diplomatic solution.',
    leftNegHe:  'השמאל מדגיש את עלויות המלחמה לאוכלוסייה האזרחית; הימין מציג את האיום המיליטנטי כמצדיק את הפעולה.',
    leftNegEn:  'Left highlights the war\'s cost to civilians; Right frames the militant threat as justifying the operation.',
  },
  'West Bank': {
    rightNegHe: 'הימין תומך בהרחבת ההתנחלויות כזכות היסטורית; השמאל רואה בכך מכשול לפתרון שתי המדינות.',
    rightNegEn: 'Right supports settlement expansion as a historical right; Left sees it as an obstacle to a two-state solution.',
    leftNegHe:  'השמאל מתמקד בפגיעה בזכויות הפלסטינים; הימין מציג את הצורך בסדר ביטחוני ביהודה ושומרון.',
    leftNegEn:  'Left focuses on Palestinian rights violations; Right frames the need for security order in the West Bank.',
  },
  'Saudi Normalization': {
    rightNegHe: 'הימין חושש ממחיר פוליטי גבוה (ויתורים לפלסטינים); השמאל רואה בנורמליזציה הישג אסטרטגי ועידוד שלום.',
    rightNegEn: 'Right fears high political price (concessions to Palestinians); Left views normalization as a strategic achievement and peace incentive.',
    leftNegHe:  'השמאל ביקורתי על תנאי ממשל טראמפ לנורמליזציה; הימין מדגיש את הרווח הביטחוני והכלכלי.',
    leftNegEn:  'Left is critical of Trump administration\'s normalization terms; Right highlights security and economic gains.',
  },
  'US Politics': {
    rightNegHe: 'תקשורת שמאל מבקרת את מדיניות טראמפ/הרפובליקנים; תקשורת ימין מציגה ניצחון ועצמה.',
    rightNegEn: 'Left-leaning media criticizes Trump/Republican policy; Right-leaning media frames strength and victory.',
    leftNegHe:  'תקשורת ימין מתקיפה את מדיניות הדמוקרטים; תקשורת שמאל מציגה מגמה מדינית חיובית.',
    leftNegEn:  'Right-leaning media attacks Democratic policy; Left-leaning media frames a positive political trend.',
  },
  'Judicial Reform': {
    rightNegHe: 'הימין רואה בהתנגדות לרפורמה ניסיון ה-elite לשמר כוח; השמאל מציג את הרפורמה כסכנה לדמוקרטיה.',
    rightNegEn: 'Right sees opposition to the reform as the elite preserving power; Left frames the reform as a threat to democracy.',
    leftNegHe:  'השמאל מדגיש פגיעה בעצמאות הפסיקה; הימין מציג את הרפורמה כהחזרת איזון בין הרשויות.',
    leftNegEn:  'Left emphasizes harm to judicial independence; Right frames the reform as restoring balance between branches.',
  },
  'Ukraine/Russia': {
    rightNegHe: 'הימין הלאומני קורא להפסקת אש ומגביל סיוע; השמאל הליברלי דוחף להמשך תמיכה בנשק ובסנקציות.',
    rightNegEn: 'Nationalist right calls for ceasefire and limits aid; Liberal left pushes to continue weapons support and sanctions.',
    leftNegHe:  'השמאל מדגיש את הסבל האנושי וקורא לדיאלוג; הימין מאשים את הדמוקרטים בהנצחת המלחמה.',
    leftNegEn:  'Left highlights human suffering and calls for dialogue; Right accuses Democrats of perpetuating the war.',
  },
  'Economy': {
    rightNegHe: 'הימין מאשים את מדיניות השמאל באינפלציה וגירעון; השמאל מצביע על פגיעה בשכבות החלשות מהקפאלת תקציבים.',
    rightNegEn: 'Right blames left-wing policy for inflation and deficit; Left points to harm to vulnerable groups from budget cuts.',
    leftNegHe:  'השמאל מבקר מס הכנסה רגרסיבי ותגמולי תאגידים; הימין מציג צמיחה ויצירת מקומות עבודה.',
    leftNegEn:  'Left criticizes regressive tax and corporate rewards; Right frames growth and job creation.',
  },
  'Syria': {
    rightNegHe: 'הימין חושש מהישג ג\'יהאדי באזורים שנכבשו; השמאל מדגיש הזדמנות לשינוי מסדר בסוריה.',
    rightNegEn: 'Right fears jihadist gains in captured territories; Left emphasizes opportunity for systemic change in Syria.',
    leftNegHe:  'השמאל מדגיש מחנות פליטים ואסון הומניטרי; הימין מתמקד בהשלכות הביטחוניות לישראל.',
    leftNegEn:  'Left highlights refugee camps and humanitarian crisis; Right focuses on security implications for Israel.',
  },
  'China': {
    rightNegHe: 'הימין קורא לקו נוקשה כלפי סין בסחר וביטחון; השמאל מעדיף דיאלוג ושיתוף פעולה מדעי.',
    rightNegEn: 'Right calls for a tough line against China on trade and security; Left prefers dialogue and scientific cooperation.',
    leftNegHe:  'השמאל מדגיש עלויות מכסי הגומל לצרכן; הימין מציג את הלחץ הכלכלי כנחוץ למאבק בהגמוניה סינית.',
    leftNegEn:  'Left highlights consumer costs of tariffs; Right frames economic pressure as necessary to counter Chinese hegemony.',
  },
  'Security': {
    rightNegHe: 'הימין דורש תגובה צבאית חזקה; השמאל קורא לבחינת גורמי שורש ודיפלומטיה.',
    rightNegEn: 'Right demands strong military response; Left calls for examining root causes and diplomacy.',
    leftNegHe:  'השמאל מבקר פגיעה בזכויות אזרח בשם הביטחון; הימין מציג את הצורך בהרתעה ואכיפה.',
    leftNegEn:  'Left criticizes civil rights violations in the name of security; Right frames the need for deterrence and enforcement.',
  },
  'Diplomacy': {
    rightNegHe: 'הימין מספקן לגבי הסכמים שנמצאים רק על הנייר; השמאל רואה בדיפלומטיה ניצחון ואות לשינוי.',
    rightNegEn: 'Right is skeptical about agreements that exist only on paper; Left sees diplomacy as a victory and signal for change.',
    leftNegHe:  'השמאל מבקר את תנאי ההסכמה כלא-מספקים; הימין מדגיש את ההישג האסטרטגי.',
    leftNegEn:  'Left criticizes the agreement terms as insufficient; Right emphasizes the strategic achievement.',
  },
};

/**
 * Build topic-specific disagreement summary for narrative shocks
 * Returns what the two sides actually disagree about
 */
function buildDisagreementText(
  topic: string,
  rightNegRatio: number,
  leftNegRatio: number,
): LocalizedText {
  const template = DISAGREEMENT_TEMPLATES[topic];
  if (!template) {
    // Fallback for unknown topics
    const rightMoreNeg = rightNegRatio > leftNegRatio;
    return {
      he: rightMoreNeg
        ? 'הימין מציג את המצב כבעייתי; השמאל נוטה לנרטיב אופטימי יותר.'
        : 'השמאל מציג את המצב כבעייתי; הימין נוטה לנרטיב אופטימי יותר.',
      en: rightMoreNeg
        ? 'Right-leaning sources frame the situation negatively; Left-leaning sources take a more optimistic view.'
        : 'Left-leaning sources frame the situation negatively; Right-leaning sources take a more optimistic view.',
    };
  }

  const rightMoreNeg = rightNegRatio > leftNegRatio;
  return {
    he: rightMoreNeg ? template.rightNegHe : template.leftNegHe,
    en: rightMoreNeg ? template.rightNegEn : template.leftNegEn,
  };
}

/**
 * Build topic-specific context for fragmentation shocks (IL vs International)
 */
function buildFragmentationContext(
  topic: string,
  ilMoreNeg: boolean,
  gapPercent: number,
): LocalizedText {
  const FRAG_TEMPLATES: Record<string, { ilNegHe: string; ilNegEn: string; intNegHe: string; intNegEn: string }> = {
    'Gaza Conflict': {
      ilNegHe: `התקשורת הישראלית מדגישה את האיום הביטחוני ואת הכישלון הדיפלומטי; התקשורת הבינלאומית מתמקדת בנפגעים הפלסטינים והמשבר ההומניטרי.`,
      ilNegEn: `Israeli media emphasizes the security threat and diplomatic failure; International media focuses on Palestinian casualties and humanitarian crisis.`,
      intNegHe: `התקשורת הבינלאומית ביקורתית כלפי ישראל; התקשורת הישראלית מציגה הצלחות צבאיות ולחץ על חמאס.`,
      intNegEn: `International media is critical of Israel; Israeli media presents military successes and Hamas pressure.`,
    },
    'Iran Nuclear': {
      ilNegHe: `תקשורת ישראל מדגישה את הסכנה הקיומית; תקשורת בינלאומית מדגישה צינורות דיפלומטיים ואפשרות הסכם.`,
      ilNegEn: `Israeli media emphasizes the existential danger; International media highlights diplomatic channels and deal prospects.`,
      intNegHe: `תקשורת בינלאומית חוששת מהסלמה אזורית; תקשורת ישראלית מדגישה "red line" ושלמות ביטחונית.`,
      intNegEn: `International media fears regional escalation; Israeli media emphasizes red lines and security integrity.`,
    },
    'US Politics': {
      ilNegHe: `תקשורת ישראלית מדגישה השלכות על יחסי ארה"ב-ישראל; תקשורת בינלאומית רואה בזה ויכוח פנים-אמריקאי.`,
      ilNegEn: `Israeli media highlights implications for US-Israel relations; International media sees this as an internal American debate.`,
      intNegHe: `תקשורת בינלאומית מבקרת את ההתפתחות; תקשורת ישראלית מתמקדת בהזדמנות האסטרטגית לישראל.`,
      intNegEn: `International media criticizes the development; Israeli media focuses on the strategic opportunity for Israel.`,
    },
  };

  const tmpl = FRAG_TEMPLATES[topic];
  if (tmpl) {
    return ilMoreNeg
      ? { he: tmpl.ilNegHe, en: tmpl.ilNegEn }
      : { he: tmpl.intNegHe, en: tmpl.intNegEn };
  }

  // Generic fallback with gap size
  return {
    he: ilMoreNeg
      ? `הפרשפקטיבה הישראלית שלילית ב-${gapPercent}% מהבינלאומית — שתי הזירות רואות אירוע שונה.`
      : `הפרשפקטיבה הבינלאומית שלילית ב-${gapPercent}% מהישראלית — פער תפיסתי משמעותי.`,
    en: ilMoreNeg
      ? `Israeli perspective is ${gapPercent}% more negative than international — the two ecosystems see a different event.`
      : `International perspective is ${gapPercent}% more negative than Israeli — a significant perceptual gap.`,
  };
}

/**
 * Detect NARRATIVE SHOCKS
 * A topic where one political side is overwhelmingly negative while the other is positive/neutral
 * Indicates a narrative framing war
 */
// Topics where left/right sentiment split is not meaningful
const NARRATIVE_BLOCKLIST = new Set(['General', 'Sports', 'Climate', 'Technology']);

function detectNarrativeShocks(topicStats: Map<string, TopicStats>): ShockEvent[] {
  const shocks: ShockEvent[] = [];

  for (const [topic, stats] of topicStats) {
    if (NARRATIVE_BLOCKLIST.has(topic) || stats.articles.length < 4) continue;

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
          he: `תקשורת ${rightNegRatio > leftNegRatio ? 'ימין מדווחת בטון שלילי בעוד שמאל נוטה לחיובי' : 'שמאל מדווחת בטון שלילי בעוד ימין נוטה לחיובי'} על ${topicDisplay.he} — פער של ${Math.round(sentimentGap * 100)}% בסנטימנט.`,
          en: `${rightNegRatio > leftNegRatio ? 'Right-leaning sources frame this negatively while left-leaning are more positive' : 'Left-leaning sources frame this negatively while right-leaning are more positive'} on ${topicDisplay.en} — a ${Math.round(sentimentGap * 100)}% sentiment gap.`,
        },
        delta: 0,
        timeWindow: { he: 'שעות אחרונות', en: 'Last few hours' },
        confidence,
        whyNow: buildDisagreementText(topic, rightNegRatio, leftNegRatio),
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
      const ilMoreNeg = ilNegRatio > intNegRatio;

      shocks.push({
        id: `auto-frag-${topic.toLowerCase().replace(/\W+/g, '-')}`,
        type: 'fragmentation',
        headline: {
          he: `פער ${gapPercent}% בין סיקור ישראלי לבינלאומי בנושא ${topicDisplay.he}`,
          en: `${gapPercent}% Gap Between Israeli and International Coverage of ${topicDisplay.en}`,
        },
        whatMoved: {
          he: `תקשורת ${ilMoreNeg ? 'ישראלית שלילית יותר מהבינלאומית' : 'בינלאומית שלילית יותר מהישראלית'} בסיקור ${topicDisplay.he} — פער של ${gapPercent}% בין שתי הזירות.`,
          en: `${ilMoreNeg ? 'Israeli media more negative than international' : 'International media more negative than Israeli'} in covering ${topicDisplay.en} — a ${gapPercent}% gap between the two ecosystems.`,
        },
        delta: 0,
        timeWindow: { he: 'שעות אחרונות', en: 'Last few hours' },
        confidence,
        whyNow: buildFragmentationContext(topic, ilMoreNeg, gapPercent),
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
 * Compute shock status based on the age of its triggering articles
 */
function computeShockStatus(timestamp: string): ShockStatus {
  const ageMin = (Date.now() - new Date(timestamp).getTime()) / 60000;
  if (ageMin < 45) return 'fresh';
  if (ageMin < 210) return 'active'; // up to 3.5h
  return 'fading';
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

  // Attach status to each shock
  for (const shock of allShocks) {
    shock.status = computeShockStatus(shock.timestamp);
  }

  // Sort: high confidence first, then fresh > active > fading, then by timestamp
  const confidenceOrder: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };
  const statusOrder: Record<ShockStatus, number> = { fresh: 3, active: 2, fading: 1 };
  allShocks.sort((a, b) => {
    const confDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    if (confDiff !== 0) return confDiff;
    const statusDiff = statusOrder[b.status ?? 'active'] - statusOrder[a.status ?? 'active'];
    if (statusDiff !== 0) return statusDiff;
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
