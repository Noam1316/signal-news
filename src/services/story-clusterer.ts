/**
 * Story Clusterer
 * Groups RSS articles by shared topics into BriefStory objects.
 * No AI API needed — uses topic detection from ai-analyzer.
 */

import type { FetchedArticle } from './rss-fetcher';
import type { BriefStory, Confidence, ImpactItem, NarrativeSplit } from '@/lib/types';
import { analyzeArticle, type ArticleAnalysis } from './ai-analyzer';
import { getGroqResult } from './groq-analyzer';

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
  'Elections':           { he: 'פוליטיקה',        en: 'Politics' },
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
  'Iran Nuclear':        { he: 'ההשלכות לאחר התקיפה הישראלית באיראן',    en: 'Fallout from the Israeli Strike on Iran' },
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
  'Elections':           { he: 'בחירות ופוליטיקה עולמית',               en: 'Elections & World Politics' },
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
    he: '← עסקת החטופים הושלמה; השאלה הפתוחה היא היום שאחרי — שליטה אזרחית בעזה ולחץ אמריקאי על נורמליזציה עם סעודיה.',
    en: '← The hostage deal is complete; the open question is the day after — civilian governance in Gaza and US pressure on Saudi normalization.',
  },
  'Iran Nuclear': {
    he: '← ישראל תקפה את מתקני הגרעין האיראניים; השאלה הפתוחה היא מידת הנזק ותגובת איראן — הסלמה נוספת או הקפאה.',
    en: '← Israel has struck Iranian nuclear facilities; the open question is damage extent and Iran\'s response — further escalation or freeze.',
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
    he: '← שינוי מדיניות וושינגטון ישפיע ישירות על היקף הסיוע הצבאי לישראל ועל לחץ ליישום "היום שאחרי" בעזה.',
    en: '← Washington policy shifts directly impact military aid scope to Israel and pressure on the post-war Gaza governance plan.',
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
    he: '← שינויים בעמדת טורקיה או מצרים ישפיעו על ממשל עזה שלאחר המלחמה ועל לגיטימציה אזורית לנורמליזציה.',
    en: '← Shifts in Turkish or Egyptian stance affect post-war Gaza governance and regional legitimacy for normalization.',
  },
};

// ── Resolution Detection ──
// Keywords that indicate the event has already occurred / completed
const RESOLUTION_KEYWORDS_EN = [
  'signed', 'reached', 'completed', 'agreed', 'concluded', 'finalized',
  'released', 'freed', 'returned home', 'came home', 'implemented',
  'entered into force', 'took effect', 'phase one', 'phase 1',
  'deal done', 'agreement in place', 'hostages return', 'hostages home',
  'ceasefire holds', 'successful exchange',
  // aftermath / post-deal patterns
  'captivity survivor', 'after captivity', 'leaving gaza', 'left gaza',
  'freed from captivity', 'released from captivity', 'ex-hostage',
  'former hostage', 'back from gaza', 'returned from captivity',
  'since being freed', 'since their release', 'post-deal',
];
const RESOLUTION_KEYWORDS_HE = [
  'נחתם', 'הושלם', 'הסתיים', 'הושג הסכם', 'הסכם הושג', 'הסכם נחתם',
  'שוחרר', 'שוחררו', 'הוחזרו', 'חזרו הביתה', 'שבו הביתה',
  'יישום ההסכם', 'נכנס לתוקף', 'שלב א', 'שלב ראשון', 'שלב 1',
  'עסקה הושלמה', 'עסקה נסגרה', 'ביצוע ההסכם', 'שחרור הצליח',
  'הפסקת האש מוחזקת',
  // aftermath / post-deal patterns
  'שורד השבי', 'שורדי השבי', 'יציאה מעזה', 'יצאו מעזה', 'בצאתם מעזה',
  'חזרו מהשבי', 'שוחרר מהשבי', 'שחרור החטופים', 'החטוף חזר',
  'החטופים חזרו', 'החטופה חזרה', 'שב מהשבי', 'אחרי השבי',
  'לאחר השבי', 'מחבלי שבי', 'בשבי ל', 'עם שחרורו', 'עם שחרורה',
  'הגיע הביתה', 'הגיעה הביתה', 'מסע החזרה', 'קיבלנו אותם',
  'הסכם עבר', 'הסכם אושר', 'אושר ההסכם', 'כניסת ההסכם',
];
// Keywords that indicate the event is still active/ongoing (veto resolution detection)
const ONGOING_KEYWORDS_EN = [
  'talks continue', 'negotiations ongoing', 'still no deal', 'no agreement yet',
  'deadlock', 'stalled', 'collapsed', 'failed', 'breakdown',
];
const ONGOING_KEYWORDS_HE = [
  'מגעים נמשכים', 'טרם הושג', 'אין הסכם', 'קריסה', 'כשל', 'פרוץ',
  'עדיין לא', 'טרם הסתיים',
];

/**
 * Returns true if a majority of articles in the cluster indicate the event
 * has already occurred/completed, and no strong "ongoing" signals contradict it.
 */
function detectResolution(cluster: Cluster): boolean {
  const texts = cluster.articles.map(a =>
    `${a.article.title} ${a.article.description || ''}`.toLowerCase()
  );

  const resolutionHits = texts.filter(t =>
    RESOLUTION_KEYWORDS_EN.some(kw => t.includes(kw)) ||
    RESOLUTION_KEYWORDS_HE.some(kw => t.includes(kw))
  ).length;

  const ongoingHits = texts.filter(t =>
    ONGOING_KEYWORDS_EN.some(kw => t.includes(kw)) ||
    ONGOING_KEYWORDS_HE.some(kw => t.includes(kw))
  ).length;

  const resolutionRatio = resolutionHits / texts.length;

  // Resolved if ≥15% of articles (min 2) contain resolution language
  // AND ongoing signals don't dominate
  return resolutionHits >= 2 && resolutionRatio >= 0.15 && ongoingHits < resolutionHits;
}

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
 * Cluster articles by topic.
 * Each article is assigned to its PRIMARY topic (highest keyword score).
 * If the article also has a strong SECONDARY topic (score ≥ 60% of primary),
 * it is contributed to BOTH clusters — preventing fragmentation of cross-topic
 * breaking stories (e.g. "US-Israel-Iran ceasefire" spans Iran Nuclear + US Politics).
 */
function clusterByTopic(articles: FetchedArticle[]): Cluster[] {
  const topicMap = new Map<string, ArticleWithAnalysis[]>();

  for (const article of articles) {
    const analysis = analyzeArticle(article);

    // topics[] is already sorted by score descending (from detectTopics)
    const primaryTopic = analysis.topics[0] || 'General';

    if (!topicMap.has(primaryTopic)) topicMap.set(primaryTopic, []);
    topicMap.get(primaryTopic)!.push({ article, analysis });

    // Secondary topic cross-contribution:
    // If there is a second strong topic AND it is different from primary,
    // add the article there too (deduplication happens via unique sources filter)
    const secondaryTopic = analysis.topics[1];
    if (
      secondaryTopic &&
      secondaryTopic !== primaryTopic &&
      secondaryTopic !== 'General'
    ) {
      // Only cross-contribute if primary is a high-signal geopolitical topic
      // (avoids flooding Sports/Economy with every article that mentions "market")
      const HIGH_SIGNAL_TOPICS = new Set([
        'Iran Nuclear', 'Gaza Conflict', 'Lebanon/Hezbollah',
        'Ukraine/Russia', 'Saudi Normalization', 'West Bank',
        'US Politics', 'China', 'Security', 'Diplomacy',
      ]);
      if (HIGH_SIGNAL_TOPICS.has(primaryTopic) && HIGH_SIGNAL_TOPICS.has(secondaryTopic)) {
        if (!topicMap.has(secondaryTopic)) topicMap.set(secondaryTopic, []);
        topicMap.get(secondaryTopic)!.push({ article, analysis });
      }
    }
  }

  const HIGH_PRIORITY_FOR_FILTER = new Set([
    'Iran Nuclear', 'Gaza Conflict', 'Lebanon/Hezbollah', 'Ukraine/Russia',
    'Saudi Normalization', 'West Bank', 'US Politics', 'China', 'Security', 'Diplomacy', 'Syria',
  ]);

  return Array.from(topicMap.entries())
    .map(([topic, items]) => ({ topic, articles: items }))
    .filter((c) => {
      if (c.articles.length < 2) return false;
      const uniqueSrc = new Set(c.articles.map(a => a.article.sourceId)).size;
      // High-priority topics: allow single source if 3+ articles (active breaking coverage)
      if (uniqueSrc < 2) {
        if (HIGH_PRIORITY_FOR_FILTER.has(c.topic) && c.articles.length >= 3) return true;
        return false;
      }
      return true;
    })
    .sort((a, b) => b.articles.length - a.articles.length);
}

// Filter out titles that are channel/feed names — used in both pickHeadline and buildSummary
function isJunkTitle(title: string): boolean {
  return (
    /\|\s*(רשת|ערוץ|חדשות|ynet|walla|mako|n12|kan|globes|calcalist|haaretz|jpost|times of israel)/i.test(title) ||
    /^(חדשות|ידיעות|וואלה|מאקו|גלובס)\s*\d*\s*\|/i.test(title) ||
    title.length < 15
  );
}

/**
 * Pick best headline from cluster (highest signal score article)
 * Returns both the localized headline AND the winning article (for summary coherence)
 */
function pickHeadline(cluster: Cluster): { headline: { he: string; en: string }; bestArticle: ArticleWithAnalysis } {
  // Sort by signal score — highest first
  const sorted = [...cluster.articles].sort(
    (a, b) => b.analysis.signalScore - a.analysis.signalScore
  );
  const template = TOPIC_HEADLINES[cluster.topic] || { he: cluster.topic, en: cluster.topic };
  const topicHintHe = (template.he + ' ' + (TOPIC_CATEGORIES[cluster.topic]?.he || '')).toLowerCase();
  const topicHintEn = (template.en + ' ' + (TOPIC_CATEGORIES[cluster.topic]?.en || '')).toLowerCase();

  // High-priority topics require stricter title matching (minShared=2) to avoid false headlines
  const HIGH_PRIORITY_TOPICS = new Set(['Iran Nuclear', 'Gaza Conflict', 'Lebanon/Hezbollah', 'Ukraine/Russia', 'Security', 'West Bank', 'US Politics']);
  const minSharedForTopic = HIGH_PRIORITY_TOPICS.has(cluster.topic) ? 2 : 1;
  const isTopicRelevant = (title: string) => isSameTopic(topicHintHe + ' ' + topicHintEn, title, minSharedForTopic);

  // Must-contain terms per topic — headline MUST include at least one core term
  const TOPIC_MUST_CONTAIN: Record<string, RegExp> = {
    'Ukraine/Russia':       /אוקראינ|רוסי|קייב|מוסקב|זלנסקי|פוטין|ukrain|russia|kyiv|moscow/i,
    'Iran Nuclear':         /גרעין(?!\s+ה?קשה)|ורמלת|פרדו|נתנז|העשרה|תקיפה.*איראן|מתקפה.*איראן|איראן.*תקיפה|איראן.*מתקפה|nuclear|enrichment|natanz|fordow|strike.*iran|iran.*strike/i,
    'Gaza Conflict':        /עזה|חמאס|רפח|הפסקת אש|gaza|hamas|rafah|ceasefire/i,
    'Lebanon/Hezbollah':    /לבנון|חיזבאללה|נסראלה|lebanon|hezbollah/i,
    'West Bank':            /גדה|יהודה|שומרון|מתנחל|west bank|settler|ramallah/i,
    'Elections':            /בחירות|הצבעה|קלפי|מצביעים|election|ballot|vote|polling|orban|אורבן/i,
    'Iran Talks':           /איראן.*שיחות|שיחות.*איראן|משא.ומתן.*גרעין|iran.*talks|talks.*iran|nuclear.*deal/i,
    'Saudi Normalization':  /סעודי|ריאד|ממלכה|הסכמי אברהם|מוחמד בן|saudi|riyadh|abraham accord/i,
    'US Politics':          /טראמפ|ביידן|וושינגטון|קונגרס|הבית הלבן|trump|biden|washington|congress|white house/i,
    'Syria':                /סוריה|דמשק|אסד|מורדים|syria|damascus|assad|rebel/i,
    'China':                /סין|טייוואן|בייג'ינג|שי|china|taiwan|beijing|xi jinping/i,
    'Judicial Reform':      /רפורמה|בית משפט עליון|כנסת|קואליציה|judicial|supreme court|coalition/i,
  };
  const mustContainRe = TOPIC_MUST_CONTAIN[cluster.topic];
  const matchesTopic = (title: string) => !mustContainRe || mustContainRe.test(title);

  const relevantSorted = sorted.filter(a =>
    !isJunkTitle(a.article.title) && isTopicRelevant(a.article.title) && matchesTopic(a.article.title)
  );
  // Fallback: topic-relevant even without must-contain, then any non-junk
  const best = relevantSorted[0]
    ?? sorted.find(a => !isJunkTitle(a.article.title) && isTopicRelevant(a.article.title))
    ?? sorted.find(a => !isJunkTitle(a.article.title))
    ?? sorted[0];

  // Strip trailing source name / domain from a title
  const cleanHL = (t: string) => t
    .replace(/\s*[–—\-|]\s*[\w.-]+\.(co\.il|com|net|org|il)\s*$/i, '')
    .replace(/\s*[–—\-|]\s*(הארץ|ינט|ynet|וואלה|כאן|גלובס|מעריב|ישראל היום|Jerusalem Post|Reuters|AP|BBC|CNN|i24NEWS|Times of Israel|Al-Monitor|Middle East Eye)\s*$/i, '')
    .trim();

  // Build localized headline
  let heTitle: string;
  let enTitle: string;

  if (best.article.language === 'he' && !isJunkTitle(best.article.title)) {
    heTitle = cleanHL(best.article.title);
    // For English: try to find a relevant English article title
    const enBest = sorted.find(a => a.article.language !== 'he' && !isJunkTitle(a.article.title) && isTopicRelevant(a.article.title));
    enTitle = enBest ? cleanHL(enBest.article.title) : template.en;
  } else if (best.article.language !== 'he' && !isJunkTitle(best.article.title)) {
    enTitle = cleanHL(best.article.title);
    // For Hebrew: try Groq summaryHe first (more specific than template), then find a Hebrew title
    const groqHe = getGroqResult(best.article.id)?.summaryHe;
    if (groqHe && groqHe.length > 15) {
      heTitle = groqHe;
    } else {
      const heBest = sorted.find(a => a.article.language === 'he' && !isJunkTitle(a.article.title) && isTopicRelevant(a.article.title));
      heTitle = heBest ? cleanHL(heBest.article.title) : template.he;
    }
  } else {
    // Both junk — use templates, but try Groq for Hebrew
    const groqHe = getGroqResult(best.article.id)?.summaryHe;
    heTitle = (groqHe && groqHe.length > 15) ? groqHe : template.he;
    enTitle = template.en;
  }

  return { headline: { he: heTitle, en: enTitle }, bestArticle: best };
}

/**
 * Build summary from top articles in cluster
 */

// Clean a raw RSS description — remove junk metadata and normalize
function cleanDescription(desc: string): string {
  return desc
    .replace(/<[^>]+>/g, ' ')                                 // strip HTML tags
    .replace(/\d+\s*כתבות\s*מ-\d+\s*מקורות[^.]*\./g, '')   // "386 כתבות מ-32 מקורות שונים."
    .replace(/רמת ביטחון:[^.]*\./g, '')                       // "רמת ביטחון: גבוה (81%)."
    .replace(/זוהה כסיגנל[^.]*\./g, '')                       // "זוהה כסיגנל חדשותי משמעותי."
    .replace(/[A-Za-z]{2,}\s+en\s+\w+\s*\|[^|]*/g, '')       // "Kan en français | ..."
    .replace(/^\d{1,2}\.\d{1,2}\.\d{4}\s*/g, '')             // leading dates
    .replace(/\|[^|]{0,40}$/g, '')                            // trailing " | source name"
    .replace(/\s*[-–—]\s*(הארץ|ינט|ynet|וואלה|וואלה!|Walla|Kan|כאן|גלובס|Globes|הגשש|מעריב|ישראל היום|Israel Hayom|Jerusalem Post|Times of Israel|Reuters|AP|BBC)\s*$/i, '') // trailing " - source"
    // Normalize bullet points → sentence separators
    .replace(/\s*[•·]\s*/g, '. ')
    .replace(/\s*[-–—]\s+(?=[א-ת])/g, '. ')                  // dash before Hebrew text → sentence
    // Remove repeated sentence fragments
    .replace(/\.{2,}/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Extract the first complete sentence that's long enough to be meaningful
function extractFirstSentence(text: string, minLen = 40): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= minLen);
  return sentences[0] ?? text;
}

// Slice text at the last sentence boundary before maxLen chars
function sliceAtSentence(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const chunk = text.slice(0, maxLen);
  // Find last sentence-ending punctuation (. ! ? ׃)
  const lastEnd = Math.max(
    chunk.lastIndexOf('.'),
    chunk.lastIndexOf('!'),
    chunk.lastIndexOf('?'),
    chunk.lastIndexOf('׃'),
  );
  if (lastEnd > maxLen * 0.4) return chunk.slice(0, lastEnd + 1).trim();
  // No good boundary — fall back to last word boundary
  const lastSpace = chunk.lastIndexOf(' ');
  return lastSpace > 0 ? chunk.slice(0, lastSpace).trim() + '…' : chunk + '…';
}

// Remove prefix overlap between headline and description
function deduplicateWithHeadline(desc: string, headline: string): string {
  if (!headline || !desc) return desc;
  // Compare first N words of headline vs desc (case-insensitive)
  const headWords = headline.toLowerCase().split(/\s+/).slice(0, 6).join(' ');
  const descStart = desc.toLowerCase().slice(0, headWords.length + 10);
  if (descStart.includes(headWords)) {
    // Find where the overlap ends in the original desc and skip past it
    const overlapEnd = desc.toLowerCase().indexOf(headWords) + headWords.length;
    const rest = desc.slice(overlapEnd).replace(/^[\s,:\-–—]+/, '');
    // Don't return a fragment: if it starts with a Hebrew preposition-prefix (ב,ל,מ,כ,ו,ש)
    // it means we cut mid-sentence — return the full desc instead
    const startsFragmented = /^[בלמכושמ][א-ת]/.test(rest.trim());
    if (startsFragmented) return desc;
    return rest.length > 30 ? rest : desc; // only skip if enough remains
  }
  return desc;
}

// Impact-keyword scoring — higher = more important sentence
const IMPACT_WORDS_HE = ['נהרג', 'פצוע', 'מיליארד', 'מיליון', 'הסכם', 'הפסקת אש', 'מתקפה', 'ירי',
  'פיגוע', 'מלחמה', 'הכריז', 'אישר', 'דחה', 'קרס', 'ירד', 'עלה', 'שיא', 'ראשון', 'חסר תקדים'];
const IMPACT_WORDS_EN = ['killed', 'wounded', 'billion', 'million', 'deal', 'ceasefire', 'attack',
  'strike', 'war', 'declared', 'approved', 'rejected', 'collapsed', 'record', 'first', 'unprecedented'];

// Check whether two texts share enough meaningful words to be about the same subject
function isSameTopic(textA: string, textB: string, minShared = 2): boolean {
  const stopWords = new Set([
    'של', 'את', 'עם', 'על', 'הם', 'הן', 'הוא', 'היא', 'זה', 'כי', 'לא', 'גם', 'כל', 'אבל',
    'אם', 'רק', 'כך', 'כן', 'כבר', 'היה', 'יש', 'אין', 'כדי', 'עוד', 'אחד', 'אחת',
    'the', 'a', 'an', 'in', 'on', 'of', 'to', 'is', 'was', 'are', 'and', 'or', 'but',
    'for', 'with', 'that', 'this', 'it', 'he', 'she', 'we', 'not', 'as', 'by', 'at',
  ]);
  const tokenize = (t: string) =>
    t.toLowerCase().split(/[\s,.\-–—:!?״"'()[\]]+/).filter(w => w.length > 2 && !stopWords.has(w));
  const setA = new Set(tokenize(textA));
  const shared = tokenize(textB).filter(w => setA.has(w)).length;
  return shared >= minShared;
}

function scoreImpact(sentence: string, isHe: boolean): number {
  const lower = sentence.toLowerCase();
  const words = isHe ? IMPACT_WORDS_HE : IMPACT_WORDS_EN;
  return words.reduce((n, w) => n + (lower.includes(w) ? 1 : 0), 0);
}

// Extract the most impactful sentence from a description
function extractBestSentence(desc: string, isHe: boolean): string {
  const sentences = desc.split(/(?<=[.!?׃])\s+/).filter(s => s.length > 20);
  if (sentences.length <= 1) return desc;
  return sentences.reduce((best, s) => scoreImpact(s, isHe) >= scoreImpact(best, isHe) ? s : best, sentences[0]);
}

function buildSummary(cluster: Cluster, bestArticle: ArticleWithAnalysis, chosenHeadline?: { he: string; en: string }): { he: string; en: string } {
  const isJunkDesc = (d: string) =>
    !d || d.length < 20 ||
    /^\d+\s*כתבות/.test(d) ||
    /en\s+fran[çc]ais/i.test(d) ||
    /^[\d./ ]+$/.test(d) ||
    /מגיש מדי יום סקירה/i.test(d) ||          // Globes boilerplate
    /לחצו לקריאה|קרא עוד|read more/i.test(d) || // generic CTA
    /^<img|^<a /i.test(d.trim());                // HTML without text

  // Topic anchor — used to verify that an article's description is actually about this topic
  const topicTemplate = TOPIC_HEADLINES[cluster.topic];
  const topicHintHe = (topicTemplate?.he || cluster.topic) + ' ' + (TOPIC_CATEGORIES[cluster.topic]?.he || '');
  const topicHintEn = (topicTemplate?.en || cluster.topic) + ' ' + (TOPIC_CATEGORIES[cluster.topic]?.en || '');

  /**
   * Find the best article for the summary in a given language.
   * Priority: highest signal-score article whose description is relevant to the topic.
   * Fallback: any non-junk description in that language.
   */
  // Reuse TOPIC_MUST_CONTAIN from the clustering phase (defined above in generateStories scope,
  // but we rebuild a local lookup here for summary filtering)
  const SUMMARY_MUST_CONTAIN: Record<string, RegExp> = {
    'Ukraine/Russia':       /אוקראינ|רוסי|קייב|מוסקב|זלנסקי|פוטין|ukrain|russia|kyiv|moscow/i,
    'Iran Nuclear':         /גרעין(?!\s+ה?קשה)|ורמלת|פרדו|נתנז|העשרה|תקיפה.*איראן|מתקפה.*איראן|איראן.*תקיפה|איראן.*מתקפה|nuclear|enrichment|natanz|fordow|strike.*iran|iran.*strike/i,
    'Gaza Conflict':        /עזה|חמאס|רפח|הפסקת אש|gaza|hamas|rafah|ceasefire/i,
    'Lebanon/Hezbollah':    /לבנון|חיזבאללה|נסראלה|lebanon|hezbollah/i,
    'West Bank':            /גדה|יהודה|שומרון|מתנחל|west bank|settler|ramallah/i,
    'Elections':            /בחירות|הצבעה|קלפי|מצביעים|election|ballot|vote|polling|orban|אורבן/i,
    'Iran Talks':           /איראן.*שיחות|שיחות.*איראן|משא.ומתן.*גרעין|iran.*talks|talks.*iran|nuclear.*deal/i,
    'Saudi Normalization':  /סעודי|סעודית|ריאד|ממלכה|הסכמי אברהם|מוחמד בן|נורמליזציה.*ישראל|saudi|riyadh|abraham accord|normali[sz]ation/i,
    'US Politics':          /טראמפ|ביידן|וושינגטון|קונגרס|הבית הלבן|סנאט|trump|biden|washington|congress|white house|senate/i,
    'Syria':                /סוריה|דמשק|אסד|מורדים|syria|damascus|assad|rebel/i,
    'China':                /סין|טייוואן|בייג.ינג|שי ג.ינפינג|china|taiwan|beijing|xi jinping/i,
    'Judicial Reform':      /רפורמה|בג.ץ|בית משפט עליון|חוקה|judicial|supreme court/i,
    'Security':             /צה.ל|ביטחון|צבא|טיל|פיגוע|מתקפה|idf|military|attack|missile|terror/i,
    'Diplomacy':            /דיפלומטי|שגריר|או.ם|האומות|diplomat|ambassador|un |united nations/i,
    'Economy':              /כלכל|מכס|מניות|נאסד.ק|אינפלציה|ריבית|econom|tariff|stock|nasdaq|inflation|interest rate/i,
  };

  const findSummarySource = (lang: 'he' | 'en', topicHint: string): { source: ArticleWithAnalysis; desc: string } | null => {
    const mustRe = SUMMARY_MUST_CONTAIN[cluster.topic];

    const candidates = [...cluster.articles]
      .filter(a => a.article.language === lang)
      .map(a => ({ a, desc: cleanDescription(a.article.description) }))
      .filter(({ desc }) => !isJunkDesc(desc))
      // If this topic has a must-contain rule, only pick articles whose TITLE matches it
      // (description may not repeat key terms, but title always signals the topic)
      .filter(({ a }) => !mustRe || mustRe.test(a.article.title))
      .sort((x, y) => y.a.analysis.signalScore - x.a.analysis.signalScore);

    if (candidates.length === 0) {
      // Fallback: no must-contain filter — just pick by relevance
      const allCandidates = [...cluster.articles]
        .filter(a => a.article.language === lang)
        .map(a => ({ a, desc: cleanDescription(a.article.description) }))
        .filter(({ desc }) => !isJunkDesc(desc))
        .sort((x, y) => y.a.analysis.signalScore - x.a.analysis.signalScore);
      if (allCandidates.length === 0) return null;
      const relevant = allCandidates.filter(({ desc }) => isSameTopic(topicHint, desc, 2));
      const fallback1 = allCandidates.filter(({ desc }) => isSameTopic(topicHint, desc, 1));
      const chosen = relevant[0] ?? fallback1[0] ?? allCandidates[0];
      return { source: chosen.a, desc: chosen.desc };
    }

    // Prefer an article whose description shares ≥2 words with the topic hint
    const relevant = candidates.filter(({ desc }) => isSameTopic(topicHint, desc, 2));
    const fallback1 = candidates.filter(({ desc }) => isSameTopic(topicHint, desc, 1));
    const chosen = relevant[0] ?? fallback1[0] ?? candidates[0];
    return { source: chosen.a, desc: chosen.desc };
  };

  // ────────────────────────────────────────────────────────────
  // NEW APPROACH: Title-First summaries
  //
  // RSS descriptions are unreliable (missing, boilerplate, or off-topic).
  // Instead, we build summaries from VERIFIED article titles — they're
  // always available, always about the article's actual topic, and we can
  // validate them with TOPIC_MUST_CONTAIN.
  //
  // Priority: Groq > verified titles > metadata fallback
  // ────────────────────────────────────────────────────────────

  const mustReSummary = SUMMARY_MUST_CONTAIN[cluster.topic];
  const mainHeadlineHe = chosenHeadline?.he || TOPIC_HEADLINES[cluster.topic]?.he || '';
  const mainHeadlineEn = chosenHeadline?.en || TOPIC_HEADLINES[cluster.topic]?.en || '';

  // Derive per-headline keyword filter so summaries match the specific story, not just the broad topic.
  // Extract the 3 most distinctive Hebrew/English words from the chosen headline (length > 3, skip stop words).
  const STOP_WORDS = /^(של|על|אל|את|הם|הן|שה|כי|גם|אחד|אחת|זה|זו|לא|כן|אם|עם|בין|אחר|כל|יש|אין|עוד|כבר|רק|מה|איך|כך|אבל|אחרי|לפי|ולא|כדי|the|and|for|that|with|from|this|are|was|has|have|been|will|into|its|but|not|they|than|also|when|then|after|said|over|more)$/i;
  function headlineAnchorRe(hl: string): RegExp | null {
    const words = hl.split(/[\s,.:;!?·•\-–—"'()[\]/\\]+/)
      .map(w => w.replace(/[^\u05D0-\u05FAa-zA-Z]/g, ''))
      .filter(w => w.length > 3 && !STOP_WORDS.test(w))
      .slice(0, 4);
    if (words.length < 2) return null;
    const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(escaped.join('|'), 'i');
  }
  const heAnchorRe = headlineAnchorRe(mainHeadlineHe);
  const enAnchorRe = headlineAnchorRe(mainHeadlineEn);

  // Strip source names from end of titles
  const stripSource = (t: string) => t.trim()
    // Strip "- Source Name" or "| Source Name" at end
    .replace(/\s*[–—\-|]\s*(הארץ|ינט|ynet|וואלה|כאן|גלובס|מעריב|ישראל היום|Jerusalem Post|Reuters|AP|BBC|CNN|i24NEWS|Times of Israel|Al-Monitor|Middle East Eye)\s*$/i, '')
    // Strip domain names: "- ynet.co.il", "- haaretz.com" etc.
    .replace(/\s*[–—\-|]\s*[\w.-]+\.(co\.il|com|net|org|il)\s*$/i, '')
    .trim();

  // Check if a title is too similar to the main headline (don't repeat it)
  const normTitle = (t: string) => t.replace(/[^\u05D0-\u05FAa-zA-Z0-9\s]/g, '').trim().slice(0, 35).toLowerCase();

  function getVerifiedTitles(lang: 'he' | 'en', mainHL: string): string[] {
    const mainNorm = normTitle(mainHL);
    const anchorRe = lang === 'he' ? heAnchorRe : enAnchorRe;
    // First pass: must-contain + anchor (most specific)
    const filtered = cluster.articles
      .filter(a => {
        if (a.article.language !== lang) return false;
        if (isJunkTitle(a.article.title)) return false;
        if (mustReSummary && !mustReSummary.test(a.article.title)) return false;
        if (anchorRe && !anchorRe.test(a.article.title)) return false;
        if (normTitle(a.article.title) === mainNorm) return false;
        return true;
      })
      .sort((a, b) => b.analysis.signalScore - a.analysis.signalScore)
      .slice(0, 3)
      .map(a => stripSource(a.article.title))
      .filter(t => t.length > 12);

    if (filtered.length > 0) return filtered;

    // Second pass: must-contain only (no anchor) — fallback for when anchor is too tight
    const pass2 = cluster.articles
      .filter(a => {
        if (a.article.language !== lang) return false;
        if (isJunkTitle(a.article.title)) return false;
        if (mustReSummary && !mustReSummary.test(a.article.title)) return false;
        if (normTitle(a.article.title) === mainNorm) return false;
        return true;
      })
      .sort((a, b) => b.analysis.signalScore - a.analysis.signalScore)
      .slice(0, 3)
      .map(a => stripSource(a.article.title))
      .filter(t => t.length > 12);
    if (pass2.length > 0) return pass2;

    // Third pass: any article in this language, no topic filter — cluster membership already guarantees relevance
    return cluster.articles
      .filter(a => {
        if (a.article.language !== lang) return false;
        if (isJunkTitle(a.article.title)) return false;
        if (normTitle(a.article.title) === mainNorm) return false;
        return true;
      })
      .sort((a, b) => b.analysis.signalScore - a.analysis.signalScore)
      .slice(0, 2)
      .map(a => stripSource(a.article.title))
      .filter(t => t.length > 12);
  }

  function getGroqSummary(lang: 'he' | 'en'): string {
    // Try Groq summaries from articles (if Groq API is configured)
    for (const a of cluster.articles) {
      const groq = lang === 'he'
        ? getGroqResult(a.article.id)?.summaryHe
        : getGroqResult(a.article.id)?.summaryEn;
      if (groq && groq.length > 30) {
        // Verify Groq summary article is on-topic
        if (!mustReSummary || mustReSummary.test(a.article.title)) {
          return deduplicateWithHeadline(groq, a.article.title || '');
        }
      }
    }
    return '';
  }

  function metadataFallback(lang: 'he' | 'en'): string {
    const srcNames = [...new Set(cluster.articles.map(a => a.article.sourceName))].slice(0, 3).join(', ');
    const topic = lang === 'he'
      ? (TOPIC_HEADLINES[cluster.topic]?.he || TOPIC_CATEGORIES[cluster.topic]?.he || cluster.topic)
      : (TOPIC_HEADLINES[cluster.topic]?.en || cluster.topic);
    return `${cluster.articles.length} ${lang === 'he' ? 'כתבות' : 'articles'} · ${srcNames}`;
  }

  // ── Build Hebrew summary ──
  let heSummary = getGroqSummary('he');
  if (!heSummary) {
    const heTitles = getVerifiedTitles('he', mainHeadlineHe);
    if (heTitles.length >= 2) heSummary = heTitles.slice(0, 2).join(' · ');
    else if (heTitles.length === 1) heSummary = heTitles[0];
  }
  // Fallback: use English titles when no Hebrew articles exist in this cluster
  if (!heSummary) {
    const enTitles = getVerifiedTitles('en', mainHeadlineEn);
    if (enTitles.length >= 2) heSummary = enTitles.slice(0, 2).join(' · ');
    else if (enTitles.length === 1) heSummary = enTitles[0];
  }
  if (!heSummary) heSummary = metadataFallback('he');

  // ── Build English summary ──
  let enSummary = getGroqSummary('en');
  if (!enSummary) {
    const enTitles = getVerifiedTitles('en', mainHeadlineEn);
    if (enTitles.length >= 2) enSummary = enTitles.slice(0, 2).join(' · ');
    else if (enTitles.length === 1) enSummary = enTitles[0];
  }
  if (!enSummary) {
    // For English: also try unfiltered titles as last resort before metadata
    const enTitles = cluster.articles
      .filter(a => a.article.language === 'en' && !isJunkTitle(a.article.title))
      .sort((a, b) => b.analysis.signalScore - a.analysis.signalScore)
      .slice(0, 3)
      .map(a => stripSource(a.article.title))
      .filter(t => t.length > 12);
    if (enTitles.length >= 2) enSummary = enTitles.slice(0, 2).join(' · ');
    else if (enTitles.length === 1) enSummary = enTitles[0];
  }
  if (!enSummary) enSummary = metadataFallback('en');

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
/**
 * Compute an importance score for a cluster BEFORE building the full story.
 * Used to pick the top N clusters before expensive processing.
 *
 * Factors:
 *  + Likelihood (calculated cheaply from raw counts)
 *  + Signal flag (1.3×)
 *  + Unique sources (logarithmic boost)
 *  + Has impacts defined for topic (1.15×)
 *  − Staleness: age > 20h + no movement → penalty (0.7×)
 *  − Sports / General topics → lower priority (0.75×)
 */
// Israeli source IDs — stories covered by Israeli media get a relevance boost
const ISRAELI_SOURCE_IDS = new Set([
  'ynet', 'ynet-en', 'mako', 'n12', 'reshet13', 'kan', 'walla', 'calcalist', 'globes',
  'israelhayom', 'haaretz', 'haaretz-en', 'inn', 'timesofisrael', 'jpost', 'i24news',
  'channel14', '972mag',
]);

function scoreCluster(cluster: Cluster): number {
  const uniqueSources = new Set(cluster.articles.map(a => a.article.sourceId)).size;
  const signalCount = cluster.articles.filter(a => a.analysis.isSignal).length;
  const hasImpacts = cluster.topic in TOPIC_IMPACTS;
  const isLowPriority = cluster.topic === 'Sports' || cluster.topic === 'General' || cluster.topic === 'Entertainment' || cluster.topic === 'Technology' || cluster.topic === 'Climate';

  // Israeli source boost: count unique Israeli sources covering this story
  const israeliSources = new Set(
    cluster.articles
      .map(a => a.article.sourceId)
      .filter(id => ISRAELI_SOURCE_IDS.has(id))
  ).size;

  // Topic importance tiers
  const isTopPriority = [
    'Iran Nuclear', 'Gaza Conflict', 'Lebanon/Hezbollah', 'Ukraine/Russia',
    'US Politics', 'Security', 'West Bank',
  ].includes(cluster.topic);

  const isHighPriority = [
    'Economy', 'Diplomacy', 'Saudi Normalization', 'China', 'Syria',
    'Judicial Reform', 'Turkey/Egypt',
  ].includes(cluster.topic);

  // Quick likelihood proxy (no need for full calculation here)
  const avgSignal = cluster.articles.reduce((s, a) => s + a.analysis.signalScore, 0) / cluster.articles.length;
  const baseScore = Math.min(30, uniqueSources * 5) + Math.min(25, signalCount / cluster.articles.length * 15 + avgSignal / 10);

  // Recency: newest article age
  const now = Date.now();
  const newestTs = cluster.articles
    .map(a => a.article.pubDate ? new Date(a.article.pubDate).getTime() : 0)
    .reduce((m, t) => Math.max(m, t), 0);
  const ageHours = newestTs > 0 ? (now - newestTs) / 3600000 : 24;

  // ④ Staleness penalty: old AND low delta proxy
  const stale = ageHours > 20 && signalCount === 0;
  const stalenessMultiplier = stale ? 0.7 : 1;

  // ③ Impact multiplier
  const impactMultiplier = hasImpacts ? 1.15 : 0.85;

  // Signal boost
  const signalMultiplier = signalCount > 0 ? 1.3 : 1;

  // Topic priority multiplier
  const topicMultiplier =
    isLowPriority   ? 0.75 :   // Sports / General — deprioritize
    isTopPriority   ? 1.4  :   // ביטחון / פוליטיקה / עזה — boost חזק
    isHighPriority  ? 1.2  :   // כלכלה / דיפלומטיה — boost בינוני
    1.0;                       // שאר הנושאים

  // ── Trending multiplier: more unique sources = more editors independently chose this story ──
  // 2 sources → 1.0×  (baseline, already filtered)
  // 3 sources → 1.2×
  // 4 sources → 1.45×
  // 5 sources → 1.75×
  // 6+ sources → 2.1×  (viral / breaking)
  const trendingMultiplier =
    uniqueSources >= 6 ? 2.1 :
    uniqueSources >= 5 ? 1.75 :
    uniqueSources >= 4 ? 1.45 :
    uniqueSources >= 3 ? 1.2 : 1.0;

  // ── Israeli source multiplier: stories covered by Israeli media are more relevant to this platform ──
  // 1 Israeli source → 1.1×
  // 2 Israeli sources → 1.25×
  // 3+ Israeli sources → 1.4×
  const israeliMultiplier =
    israeliSources >= 3 ? 1.4 :
    israeliSources >= 2 ? 1.25 :
    israeliSources >= 1 ? 1.1 : 1.0;

  return baseScore * stalenessMultiplier * impactMultiplier * signalMultiplier * topicMultiplier * trendingMultiplier * israeliMultiplier;
}

export function generateStories(articles: FetchedArticle[], maxStories = 8): BriefStory[] {
  if (articles.length === 0) return [];

  const clusters = clusterByTopic(articles);

  // ⓪ Filter out low-value topics entirely (General, Sports, Entertainment)
  const EXCLUDED_TOPICS = new Set(['General', 'Sports', 'Entertainment']);
  const filteredClusters = clusters.filter(c => !EXCLUDED_TOPICS.has(c.topic));

  // ① Score + sort clusters by importance BEFORE building stories
  const rankedClusters = filteredClusters
    .map(c => ({ cluster: c, score: scoreCluster(c) }))
    .sort((a, b) => b.score - a.score)
    .map(({ cluster }) => cluster);

  // Must-contain map — same as in pickHeadline, used here to validate final headline
  const HEADLINE_MUST_CONTAIN: Record<string, RegExp> = {
    'Ukraine/Russia':       /אוקראינ|רוסי|קייב|פוטין|ukrain|russia|kyiv|moscow/i,
    'Iran Nuclear':         /איראן|גרעין(?!\s+ה?קשה)|iran|nuclear/i,
    'Gaza Conflict':        /עזה|חמאס|הפסקת אש|gaza|hamas|ceasefire/i,
    'Lebanon/Hezbollah':    /לבנון|חיזבאללה|lebanon|hezbollah/i,
    'West Bank':            /גדה|יהודה|שומרון|west bank|settler/i,
    'Elections':            /בחירות|election|vote|ballot/i,
    'Iran Talks':           /איראן|iran/i,
    'Saudi Normalization':  /סעודי|נורמליזציה|saudi|normali/i,
    'US Politics':          /טראמפ|קונגרס|trump|congress|washington/i,
    'Syria':                /סוריה|syria/i,
    'China':                /סין|טייוואן|china|taiwan/i,
    'Judicial Reform':      /רפורמה|בית משפט|בג.ץ|judicial|supreme court/i,
    'Security':             /צה.ל|ביטחון|טיל|פיגוע|idf|military|attack|missile/i,
  };

  const stories = rankedClusters.slice(0, maxStories).map((cluster) => {
    const { headline, bestArticle } = pickHeadline(cluster);

    // Validate: if the cluster has a must-contain rule, the chosen headline must pass it
    // Otherwise the cluster yielded an off-topic fallback headline — skip it
    const mustRe = HEADLINE_MUST_CONTAIN[cluster.topic];
    if (mustRe) {
      const hl = (headline.he || '') + ' ' + (headline.en || '');
      if (!mustRe.test(hl)) return null; // Off-topic headline — discard
    }

    const summary = buildSummary(cluster, bestArticle, headline);
    const { likelihood, delta, confidence } = calculateLikelihood(cluster);
    const lens = determineLens(cluster);
    const isSignal = cluster.articles.some((a) => a.analysis.isSignal);
    const category = TOPIC_CATEGORIES[cluster.topic] || { he: 'כללי', en: 'General' };

    const impacts = detectImpacts(cluster.topic);
    const narrativeSplit = extractNarrativeSplit(cluster);
    const strategicImplication = STRATEGIC_IMPLICATIONS[cluster.topic];
    const resolved = detectResolution(cluster);

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

    // First-Mover: which source published earliest in this cluster
    const datedArticles = cluster.articles
      .filter(a => a.article.pubDate)
      .sort((a, b) => new Date(a.article.pubDate).getTime() - new Date(b.article.pubDate).getTime());
    let firstMover: { sourceName: string; sourceUrl: string; minsAhead: number } | undefined;
    if (datedArticles.length >= 2) {
      const firstTs = new Date(datedArticles[0].article.pubDate).getTime();
      const timestamps = datedArticles.map(a => new Date(a.article.pubDate).getTime());
      const medianTs = timestamps[Math.floor(timestamps.length / 2)];
      const minsAhead = Math.round((medianTs - firstTs) / 60000);
      if (minsAhead >= 10) {
        firstMover = {
          sourceName: datedArticles[0].article.sourceName,
          sourceUrl: datedArticles[0].article.link,
          minsAhead,
        };
      }
    }

    // Contradiction Detector: same cluster, opposite sentiments from different sources
    // Tightened: requires >=5 articles in cluster, >=2 positive AND >=2 negative articles,
    // each side from >=2 different sources, and gapPct <= 60 (balanced coverage)
    let contradiction: { sourceA: string; headlineA: string; sourceB: string; headlineB: string; gapPct: number } | undefined;
    const hasUsableTitle = (t: string) => t.length >= 15;
    if (cluster.articles.length >= 5) {
      const positiveArticles = cluster.articles.filter(a => a.analysis.sentiment === 'positive' && hasUsableTitle(a.article.title));
      const negativeArticles = cluster.articles.filter(a => a.analysis.sentiment === 'negative' && hasUsableTitle(a.article.title));
      const positiveSources = new Set(positiveArticles.map(a => a.article.sourceName));
      const negativeSources = new Set(negativeArticles.map(a => a.article.sourceName));
      if (positiveArticles.length >= 2 && negativeArticles.length >= 2 && positiveSources.size >= 2 && negativeSources.size >= 2) {
        const posA = positiveArticles[0];
        const negA = negativeArticles[0];
        const totalSentiment = positiveArticles.length + negativeArticles.length;
        const gapPct = Math.round(Math.abs(positiveArticles.length - negativeArticles.length) / totalSentiment * 100);
        if (gapPct <= 60) { // not too lopsided — genuine split
          contradiction = {
            sourceA: posA.article.sourceName,
            headlineA: posA.article.title,
            sourceB: negA.article.sourceName,
            headlineB: negA.article.title,
            gapPct,
          };
        }
      }
    }

    const likelihoodLabel: Confidence = likelihood >= 70 ? 'high' : likelihood >= 40 ? 'medium' : 'low';

    // Build "why" explanation — name actual sources for credibility
    const confLabelHe = confidence >= 70 ? 'גבוהה' : confidence >= 40 ? 'בינונית' : 'נמוכה';
    const sourceNames = Array.from(sourcesMap.keys()).slice(0, 3);
    const sourceListHe = sourceNames.length >= 2
      ? sourceNames.slice(0, -1).join(', ') + ' ו-' + sourceNames.at(-1)
      : sourceNames[0] || '';
    const sourceListEn = sourceNames.join(', ');
    const extraSources = sourcesMap.size > 3 ? sourcesMap.size - 3 : 0;
    const why = {
      he: `מכוסה ע"י ${sourceListHe}${extraSources > 0 ? ` ועוד ${extraSources}` : ''}. אמינות ${confLabelHe}.${isSignal ? ' זוהה כסיגנל חדשותי.' : ''}`,
      en: `Covered by ${sourceListEn}${extraSources > 0 ? ` +${extraSources} more` : ''}. Confidence: ${confidence >= 70 ? 'high' : confidence >= 40 ? 'medium' : 'low'}.${isSignal ? ' Flagged as news signal.' : ''}`,
    };

    return {
      slug: slugify(cluster.topic),
      headline,
      summary,
      likelihood,
      likelihoodLabel,
      delta,
      why,
      isSignal: isSignal && !resolved, // resolved events are not active signals
      category,
      lens,
      sources,
      updatedAt: latestArticle?.article.pubDate || new Date().toISOString(),
      impacts: impacts.length > 0 ? impacts : undefined,
      narrativeSplit,
      strategicImplication,
      resolved: resolved || undefined,
      firstMover,
      contradiction,
    };
  }).filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => {
      // Push resolved stories to the end
      if (a.resolved && !b.resolved) return 1;
      if (!a.resolved && b.resolved) return -1;
      return 0;
    });

  return stories;
}
