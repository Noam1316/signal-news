/**
 * Story Clusterer
 * Groups RSS articles by shared topics into BriefStory objects.
 * No AI API needed — uses topic detection from ai-analyzer.
 */

import type { FetchedArticle } from './rss-fetcher';
import type { BriefStory, Confidence, ImpactItem, NarrativeSplit } from '@/lib/types';
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
  'China':               { he: 'גיאופוליטיקה',    en: 'Geopolitics' },
  'Turkey/Egypt':        { he: 'מזרח תיכון',      en: 'Middle East' },
  'Sports':              { he: 'ספורט',            en: 'Sports' },
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
  'China':               { he: 'יחסי ישראל-סין וגיאופוליטיקה',          en: 'China & Geopolitics' },
  'Turkey/Egypt':        { he: 'טורקיה ומצרים — השפעה אזורית',          en: 'Turkey & Egypt Regional Influence' },
  'Economy':             { he: 'מגמות כלכליות ומכסים',                   en: 'Economic Trends & Tariffs' },
  'Technology':          { he: 'חדשות טכנולוגיה',                       en: 'Technology News' },
  'Climate':             { he: 'שינויי אקלים ואנרגיה',                  en: 'Climate & Energy' },
  'Ukraine/Russia':      { he: 'המלחמה באוקראינה',                      en: 'Ukraine War Updates' },
  'Judicial Reform':     { he: 'הרפורמה המשפטית והמחאה',                en: 'Judicial Reform & Protests' },
  'Security':            { he: 'עדכוני ביטחון',                         en: 'Security Updates' },
  'Diplomacy':           { he: 'דיפלומטיה בינלאומית',                   en: 'International Diplomacy' },
};

/**
 * Cross-sector impact map.
 * direction = actual movement direction of the indicator when this topic is in the news:
 *   positive  = ↑ the indicator rises / sector strengthens
 *   negative  = ↓ the indicator falls / sector weakens
 *   uncertain = ~ direction depends on specifics
 */
const TOPIC_IMPACTS: Record<string, ImpactItem[]> = {
  'Iran Nuclear': [
    // Escalation → oil supply fears → prices spike
    { sector: { he: 'מחירי נפט וגז', en: 'Oil & Gas Prices' }, direction: 'positive' },
    // Defense demand rises
    { sector: { he: 'מניות ביטחון ישראליות', en: 'Israeli Defense Stocks' }, direction: 'positive' },
    // Risk-off → shekel weakens vs dollar
    { sector: { he: 'שקל (מול דולר)', en: 'ILS vs USD' }, direction: 'negative' },
    // Risk premium rises → credit tightens
    { sector: { he: 'פרמיות סיכון', en: 'Risk Premiums' }, direction: 'positive' },
  ],
  'Gaza Conflict': [
    // Conflict → tourism collapses
    { sector: { he: 'תיירות נכנסת לישראל', en: 'Inbound Tourism' }, direction: 'negative' },
    // Defense budgets & orders grow
    { sector: { he: 'מניות ביטחון', en: 'Defense Stocks' }, direction: 'positive' },
    // Uncertainty → real estate freezes
    { sector: { he: 'שוק הנדל"ן', en: 'Real Estate' }, direction: 'negative' },
    // Logistics disruptions → exports drop
    { sector: { he: 'יצוא ישראלי', en: 'Israeli Exports' }, direction: 'negative' },
  ],
  'Lebanon/Hezbollah': [
    { sector: { he: 'תיירות הצפון', en: 'Northern Tourism' }, direction: 'negative' },
    { sector: { he: 'מניות ביטחון', en: 'Defense Stocks' }, direction: 'positive' },
    { sector: { he: 'נדל"ן בצפון', en: 'Northern Real Estate' }, direction: 'negative' },
    // More claims, reduced underwriting appetite
    { sector: { he: 'ענף הביטוח', en: 'Insurance Sector' }, direction: 'negative' },
  ],
  'Saudi Normalization': [
    { sector: { he: 'תיירות אזורית', en: 'Regional Tourism' }, direction: 'positive' },
    { sector: { he: 'מסחר ויצוא', en: 'Trade & Exports' }, direction: 'positive' },
    { sector: { he: 'מניות תעופה', en: 'Aviation Stocks' }, direction: 'positive' },
    { sector: { he: 'שוק ההון הישראלי', en: 'Israeli Stock Market' }, direction: 'positive' },
  ],
  'US Politics': [
    { sector: { he: 'סיוע ביטחוני לישראל', en: 'US Defense Aid' }, direction: 'uncertain' },
    { sector: { he: 'יצוא טכנולוגיה', en: 'Tech Exports' }, direction: 'uncertain' },
    { sector: { he: 'מחירי נפט', en: 'Oil Prices' }, direction: 'uncertain' },
    { sector: { he: 'שוק המניות הגלובלי', en: 'Global Stock Markets' }, direction: 'uncertain' },
  ],
  'Technology': [
    { sector: { he: 'חברות שבבים ישראליות', en: 'Israeli Chip Companies' }, direction: 'positive' },
    { sector: { he: 'קרנות הון סיכון', en: 'VC Funding' }, direction: 'positive' },
    { sector: { he: 'מדד נאסד"ק', en: 'Nasdaq Index' }, direction: 'positive' },
    { sector: { he: 'גיוס בהייטק', en: 'Tech Hiring' }, direction: 'positive' },
  ],
  'Economy': [
    { sector: { he: 'שקל (מול דולר)', en: 'ILS vs USD' }, direction: 'uncertain' },
    { sector: { he: 'שוק הנדל"ן', en: 'Real Estate Market' }, direction: 'uncertain' },
    { sector: { he: 'ריבית בנק ישראל', en: 'Bank of Israel Rate' }, direction: 'uncertain' },
  ],
  'Ukraine/Russia': [
    // Supply disruption → energy prices spike globally
    { sector: { he: 'מחירי אנרגיה גלובליים', en: 'Global Energy Prices' }, direction: 'positive' },
    // War disrupts global supply chains
    { sector: { he: 'שרשראות אספקה', en: 'Supply Chains' }, direction: 'negative' },
    // Ukraine = major grain exporter → food prices rise
    { sector: { he: 'מחירי מזון ודגנים', en: 'Food & Grain Prices' }, direction: 'positive' },
    { sector: { he: 'שוק ההון האירופי', en: 'European Markets' }, direction: 'negative' },
  ],
  'Judicial Reform': [
    // Capital flight → FDI drops
    { sector: { he: 'השקעות זרות בישראל', en: 'Foreign Investment' }, direction: 'negative' },
    { sector: { he: 'שוק ההון הישראלי', en: 'Israeli Stock Market' }, direction: 'negative' },
    // Brain drain concern → valuations drop
    { sector: { he: 'סטארטאפים ישראליים', en: 'Israeli Startups' }, direction: 'negative' },
    { sector: { he: 'שקל (מול דולר)', en: 'ILS vs USD' }, direction: 'negative' },
  ],
  'Syria': [
    { sector: { he: 'יציבות אזורית', en: 'Regional Stability' }, direction: 'uncertain' },
    { sector: { he: 'מחירי נפט', en: 'Oil Prices' }, direction: 'uncertain' },
    { sector: { he: 'מניות ביטחון', en: 'Defense Stocks' }, direction: 'positive' },
  ],
  'West Bank': [
    { sector: { he: 'יחסי ישראל-פלסטין', en: 'Israel-PA Relations' }, direction: 'negative' },
    { sector: { he: 'מניות ביטחון', en: 'Defense Stocks' }, direction: 'positive' },
    { sector: { he: 'סיוע אמריקאי', en: 'US Aid' }, direction: 'uncertain' },
  ],
};

function detectImpacts(topic: string): ImpactItem[] {
  return TOPIC_IMPACTS[topic] ?? [];
}

// ── Strategic Implication Templates ──
const STRATEGIC_IMPLICATIONS: Record<string, { he: string; en: string }> = {
  'Gaza Conflict': {
    he: '← הסדר בעזה מותנה בעסקת חטופים; כישלון יחמיר לחץ אמריקאי ויאיים על נורמליזציה עם סעודיה.',
    en: '← A Gaza deal hinges on hostage agreement; failure will intensify US pressure and threaten Saudi normalization.',
  },
  'Iran Nuclear': {
    he: '← פריצת סף גרעיני איראנית תכריח ישראל להחליט — מתקפה מונעת או הכלה; מחירי הנפט יקפצו.',
    en: '← Iranian nuclear breakout forces Israel to decide — preemptive strike or containment; oil prices will spike.',
  },
  'Lebanon/Hezbollah': {
    he: '← הסלמה בצפון תרחיב חזית וסטת משאבי צה"ל מעזה; שאלת ה"יום שאחרי" תתחדד.',
    en: '← Northern escalation expands a second front and diverts IDF resources from Gaza; post-war governance questions sharpen.',
  },
  'Saudi Normalization': {
    he: '← הצלחה תשנה את המפה הגאופוליטית של המזרח התיכון; כישלון ייקח ניצחון דיפלומטי מהרשות הפלסטינית.',
    en: '← Success rewrites Middle East geopolitics; failure hands a diplomatic victory to the Palestinian Authority.',
  },
  'US Politics': {
    he: '← שינוי מדיניות וושינגטון ישפיע ישירות על היקף הסיוע הצבאי לישראל ועל לחץ לעסקת חטופים.',
    en: '← Washington policy shifts directly impact military aid scope to Israel and pressure on a hostage deal.',
  },
  'West Bank': {
    he: '← הסלמה ביהודה ושומרון מאיימת על שיתוף הפעולה הביטחוני עם הרשות הפלסטינית ועל שאיפות נורמליזציה.',
    en: '← West Bank escalation threatens PA security cooperation and normalization aspirations.',
  },
  'Ukraine/Russia': {
    he: '← ניצחון רוסי ידרבן מעורבות אירנית גדולה יותר ויחליש את האמינות הדטרנסיבית של הנאט"ו.',
    en: '← Russian gains embolden Iranian involvement and erode NATO deterrence credibility.',
  },
  'Judicial Reform': {
    he: '← חוסר יציבות פוליטית מאיים על תקציב הביטחון ועל אמינות ישראל בעיני בני ברית.',
    en: '← Political instability threatens the defense budget and Israel\'s credibility with allies.',
  },
  'Economy': {
    he: '← גרעון תקציבי גדל ישפיע על תקציב הביטחון ועל מיצוב ישראל בשוקי ההון הבינלאומיים.',
    en: '← Growing fiscal deficit will pressure the defense budget and Israel\'s standing in international capital markets.',
  },
  'Syria': {
    he: '← חלל שלטוני בסוריה מאפשר לאיראן לבסס נוכחות — ישראל תצטרך להחליט על עומק התגובה.',
    en: '← Governance vacuum in Syria enables Iranian entrenchment — Israel will need to decide on the depth of its response.',
  },
  'China': {
    he: '← מתיחות ארה"ב-סין משפיעה על שוקי ההייטק הישראלי ועל לחץ אמריקאי על ישראל בנושאי סחר עם סין.',
    en: '← US-China tension affects Israeli tech markets and US pressure on Israel regarding China trade.',
  },
  'Turkey/Egypt': {
    he: '← שינויים בעמדת טורקיה או מצרים ישפיעו על מסדרונות ההסדר ועל לגיטימציה אזורית לעסקת חטופים.',
    en: '← Shifts in Turkish or Egyptian stance affect deal corridors and regional legitimacy for a hostage agreement.',
  },
};

// ── Narrative Split Extraction ──
function extractNarrativeSplit(cluster: Cluster): NarrativeSplit | undefined {
  const rightArticles = cluster.articles.filter(
    a => a.analysis.politicalLeaning === 'right' || a.analysis.politicalLeaning === 'center-right'
  );
  const leftArticles = cluster.articles.filter(
    a => a.analysis.politicalLeaning === 'left' || a.analysis.politicalLeaning === 'center-left'
  );

  if (rightArticles.length < 1 || leftArticles.length < 1) return undefined;

  const isJunk = (t: string) =>
    !t || t.length < 15 ||
    /\|\s*(רשת|ערוץ|חדשות|ynet|walla|mako|n12|kan|globes)/i.test(t);

  // Pick most negative right article
  const rightNeg = rightArticles
    .filter(a => a.analysis.sentiment === 'negative' && !isJunk(a.article.title))
    .sort((a, b) => b.analysis.signalScore - a.analysis.signalScore)[0]
    || rightArticles.filter(a => !isJunk(a.article.title))[0];

  // Pick most negative left article (or most contrasting)
  const leftNeg = leftArticles
    .filter(a => !isJunk(a.article.title))
    .sort((a, b) => b.analysis.signalScore - a.analysis.signalScore)[0];

  if (!rightNeg || !leftNeg) return undefined;

  const rightNegRatio = rightArticles.filter(a => a.analysis.sentiment === 'negative').length / rightArticles.length;
  const leftNegRatio  = leftArticles.filter(a => a.analysis.sentiment === 'negative').length  / leftArticles.length;
  const gapPct = Math.round(Math.abs(rightNegRatio - leftNegRatio) * 100);

  if (gapPct < 25) return undefined; // not interesting enough

  return {
    rightHeadline: rightNeg.article.title.slice(0, 100),
    leftHeadline:  leftNeg.article.title.slice(0, 100),
    rightSource:   rightNeg.article.sourceName,
    leftSource:    leftNeg.article.sourceName,
    gapPct,
  };
}

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
  const template = TOPIC_HEADLINES[cluster.topic] || { he: cluster.topic, en: cluster.topic };

  // Filter out titles that are channel/feed names (contain " | " pattern with source name)
  const isJunkTitle = (title: string) =>
    /\|\s*(רשת|ערוץ|חדשות|ynet|walla|mako|n12|kan|globes|calcalist|haaretz|jpost|times of israel)/i.test(title) ||
    /^(חדשות|ידיעות|וואלה|מאקו|גלובס)\s*\d*\s*\|/i.test(title) ||
    title.length < 15;

  // Find best headline — skip junk titles
  const best = sorted.find(a => !isJunkTitle(a.article.title)) || sorted[0];

  if (best.article.language === 'he') {
    return { he: isJunkTitle(best.article.title) ? template.he : best.article.title, en: template.en };
  } else {
    return { he: template.he, en: isJunkTitle(best.article.title) ? template.en : best.article.title };
  }
}

/**
 * Build summary from top articles in cluster
 */
// Clean a raw RSS description — remove junk metadata
function cleanDescription(desc: string): string {
  return desc
    .replace(/\d+\s*כתבות\s*מ-\d+\s*מקורות[^.]*\./g, '')   // "386 כתבות מ-32 מקורות שונים."
    .replace(/רמת ביטחון:[^.]*\./g, '')                       // "רמת ביטחון: גבוה (81%)."
    .replace(/זוהה כסיגנל[^.]*\./g, '')                       // "זוהה כסיגנל חדשותי משמעותי."
    .replace(/[A-Za-z]{2,}\s+en\s+\w+\s*\|[^|]*/g, '')       // "Kan en français | ..."
    .replace(/^\d{1,2}\.\d{1,2}\.\d{4}\s*/g, '')             // leading dates
    .replace(/\|[^|]{0,40}$/g, '')                            // trailing " | source name"
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildSummary(cluster: Cluster): { he: string; en: string } {
  const isJunkDesc = (d: string) =>
    !d || d.length < 20 ||
    /^\d+\s*כתבות/.test(d) ||
    /en\s+fran[çc]ais/i.test(d) ||
    /^[\d./ ]+$/.test(d);

  const heArticles = cluster.articles
    .filter((a) => a.article.language === 'he')
    .map((a) => ({ ...a, cleaned: cleanDescription(a.article.description) }))
    .filter((a) => !isJunkDesc(a.cleaned));

  const enArticles = cluster.articles
    .filter((a) => a.article.language !== 'he')
    .map((a) => ({ ...a, cleaned: cleanDescription(a.article.description) }))
    .filter((a) => !isJunkDesc(a.cleaned));

  const heSummary = heArticles.slice(0, 2).map((a) => a.cleaned.slice(0, 160)).join(' ') ||
    `${cluster.articles.length} כתבות על ${TOPIC_CATEGORIES[cluster.topic]?.he || cluster.topic}`;

  const enSummary = enArticles.slice(0, 2).map((a) => a.cleaned.slice(0, 160)).join(' ') ||
    `${cluster.articles.length} articles about ${cluster.topic}`;

  return { he: heSummary, en: enSummary };
}

/**
 * Calculate likelihood score for a cluster.
 * Enhanced with cross-source verification and confidence scoring.
 *
 * Factors:
 * 1. Cross-source verification (30%): more independent sources = higher likelihood
 * 2. Signal strength (25%): proportion and score of signal articles
 * 3. Cross-lens coverage (20%): Israeli + international = broad significance
 * 4. Recency (15%): fresher articles boost likelihood
 * 5. Sentiment consensus (10%): agreement across sources = higher confidence
 */
function calculateLikelihood(cluster: Cluster): { likelihood: number; delta: number; confidence: number } {
  const totalArticles = cluster.articles.length;
  const signalCount = cluster.articles.filter((a) => a.analysis.isSignal).length;
  const avgSignalScore = cluster.articles.reduce((sum, a) => sum + a.analysis.signalScore, 0) / totalArticles;
  const uniqueSources = new Set(cluster.articles.map((a) => a.article.sourceId)).size;
  const uniqueLenses = new Set(cluster.articles.map((a) => a.article.lensCategory)).size;

  // 1. Cross-source verification (0-30 points)
  // 1 source = 5pts, 2 = 10, 3 = 15, 5+ = 25, 8+ = 30
  const crossSourceScore = Math.min(30, uniqueSources <= 1 ? 5 : uniqueSources * 5);

  // 2. Signal strength (0-25 points)
  const signalRatio = signalCount / totalArticles;
  const signalScore = Math.round(signalRatio * 15 + (avgSignalScore / 100) * 10);

  // 3. Cross-lens coverage (0-20 points)
  const lensScore = uniqueLenses >= 3 ? 20 : uniqueLenses >= 2 ? 12 : 4;

  // 4. Recency score (0-15 points)
  const now = Date.now();
  const newestArticle = cluster.articles
    .map((a) => a.article.pubDate ? new Date(a.article.pubDate).getTime() : 0)
    .reduce((max, t) => Math.max(max, t), 0);
  const ageHours = (now - newestArticle) / (1000 * 60 * 60);
  const recencyScore = ageHours < 1 ? 15 : ageHours < 3 ? 12 : ageHours < 6 ? 9 : ageHours < 12 ? 6 : 3;

  // 5. Sentiment consensus (0-10 points)
  const sentimentCounts: Record<string, number> = {};
  for (const a of cluster.articles) {
    sentimentCounts[a.analysis.sentiment] = (sentimentCounts[a.analysis.sentiment] || 0) + 1;
  }
  const dominantSentimentRatio = Math.max(...Object.values(sentimentCounts)) / totalArticles;
  const consensusScore = Math.round(dominantSentimentRatio * 10);

  // Total likelihood (clamped 15-95)
  const rawLikelihood = crossSourceScore + signalScore + lensScore + recencyScore + consensusScore;
  const likelihood = Math.min(95, Math.max(15, rawLikelihood));

  // Confidence (0-100): how reliable is this likelihood estimate?
  // Based on: sample size, source diversity, signal clarity
  const sampleSizeConf = Math.min(30, totalArticles * 6); // 5 articles = 30
  const diversityConf = Math.min(30, uniqueSources * 6);  // 5 sources = 30
  const clarityConf = Math.min(20, Math.round(signalRatio * 20)); // high signal ratio = clear
  const lensConf = Math.min(20, uniqueLenses * 7);        // 3 lenses = 20
  const confidence = Math.min(95, sampleSizeConf + diversityConf + clarityConf + lensConf);

  // Delta: deterministic based on content, not random
  // Use signal strength and recency as factors
  const baseDelta = signalCount >= 3 ? 8 : signalCount >= 1 ? 4 : 1;
  const recencyMult = ageHours < 3 ? 1.5 : ageHours < 6 ? 1.2 : 1.0;
  // Hash-based pseudo-random offset so delta stays stable per topic
  const topicHash = cluster.topic.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const offset = (topicHash % 5) - 2; // -2 to +2
  const delta = Math.round(baseDelta * recencyMult + offset);

  return { likelihood, delta, confidence };
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
    const { likelihood, delta, confidence } = calculateLikelihood(cluster);
    const lens = determineLens(cluster);
    const isSignal = cluster.articles.some((a) => a.analysis.isSignal);
    const category = TOPIC_CATEGORIES[cluster.topic] || { he: 'כללי', en: 'General' };

    const impacts = detectImpacts(cluster.topic);
    const narrativeSplit = extractNarrativeSplit(cluster);
    const strategicImplication = STRATEGIC_IMPLICATIONS[cluster.topic];

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

    // Build "why" explanation with confidence
    const confLabel = confidence >= 70 ? 'high' : confidence >= 40 ? 'medium' : 'low';
    const confLabelHe = confidence >= 70 ? 'גבוה' : confidence >= 40 ? 'בינוני' : 'נמוך';
    const why = {
      he: `${cluster.articles.length} כתבות מ-${sourcesMap.size} מקורות שונים. רמת ביטחון: ${confLabelHe} (${confidence}%). ${isSignal ? 'זוהה כסיגנל חדשותי משמעותי.' : ''}`,
      en: `${cluster.articles.length} articles from ${sourcesMap.size} sources. Confidence: ${confLabel} (${confidence}%). ${isSignal ? 'Identified as a significant news signal.' : ''}`,
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
      impacts: impacts.length > 0 ? impacts : undefined,
      narrativeSplit,
      strategicImplication,
    };
  });
}
