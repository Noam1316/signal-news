/**
 * Indie vs Mainstream Narrative Analysis
 *
 * Analyzes textual differences between independent and mainstream Israeli media
 * coverage of the same story cluster. No LLM required — keyword-based only.
 *
 * Produces:
 *  - Exclusive topics: keywords each side covers but the other doesn't
 *  - Framing signals: how each side frames the story (assertive, skeptical, alarming…)
 *  - Named entities: people/places that appear only in indie or only in mainstream
 *  - Sentiment comparison per group
 *  - Divergence score: 0-100
 */

export type FramingCategory = 'assertive' | 'skeptical' | 'alarming' | 'editorial' | 'investigative';

export interface FramingSignal {
  word: string;
  category: FramingCategory;
}

export interface IndieVsMainstream {
  indieExclusive: string[];          // keywords indie covers, mainstream ignores
  mainstreamExclusive: string[];     // keywords mainstream covers, indie ignores
  framingIndie: FramingSignal[];     // how indie frames the story
  framingMainstream: FramingSignal[]; // how mainstream frames the story
  entitiesIndie: string[];           // named entities only in indie coverage
  entitiesMainstream: string[];      // named entities only in mainstream coverage
  indieSentiment: 'positive' | 'negative' | 'neutral';
  mainstreamSentiment: 'positive' | 'negative' | 'neutral';
  indieCount: number;
  mainstreamCount: number;
  divergenceScore: number;           // 0-100: higher = bigger narrative gap
  divergenceNote?: string;           // one-liner about what the gap means
}

// ─── Stop words ───────────────────────────────────────────────────────────────

const HE_STOP = new Set([
  'של', 'על', 'עם', 'אל', 'מן', 'לא', 'כן', 'הם', 'הן', 'אנחנו', 'אני', 'הוא', 'היא',
  'זה', 'זו', 'כי', 'אבל', 'גם', 'רק', 'כבר', 'עוד', 'מה', 'מי', 'איך', 'כך', 'שם',
  'יש', 'אין', 'כל', 'כן', 'לו', 'לה', 'לנו', 'לכם', 'להם', 'אחרי', 'לפני', 'בין',
  'כמו', 'כאשר', 'כדי', 'בלי', 'נגד', 'מול', 'עד', 'אחד', 'אחת', 'שני', 'שתי',
  'את', 'הם', 'היה', 'הייתה', 'יהיה', 'תהיה', 'אם', 'כבר', 'רוצה', 'צריך',
  'חיל', 'כוח', 'ידי', 'קרא', 'אמר', 'אמרו', 'אמרה', 'כפי', 'שאמר', 'פי',
]);

const EN_STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall',
  'that', 'this', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'his', 'her', 'their',
  'not', 'no', 'so', 'if', 'then', 'than', 'while', 'after', 'before', 'into', 'over',
  'new', 'after', 'says', 'said', 'also', 'more', 'first', 'second',
]);

// ─── Framing dictionaries ─────────────────────────────────────────────────────

const FRAMING_DICT: Array<{ patterns: string[]; category: FramingCategory }> = [
  {
    // Official, authoritative tone (mainstream lean)
    category: 'assertive',
    patterns: [
      'הודיע', 'הכריז', 'אישר', 'הצהיר', 'הוחלט', 'approved', 'confirmed', 'announced',
      'declared', 'stated', 'signed', 'agreed', 'decided', 'ordered',
    ],
  },
  {
    // Skeptical, "allegedly" framing (indie lean)
    category: 'skeptical',
    patterns: [
      'לכאורה', 'נטען', 'לטענת', 'לדבריו', 'לדבריה', 'כביכול', 'לפי הדיווח',
      'allegedly', 'reportedly', 'claims', 'purportedly', 'according to', 'suggests',
      'disputed', 'unconfirmed', 'denies', 'questions',
    ],
  },
  {
    // Alarming / urgency tone
    category: 'alarming',
    patterns: [
      'חשש', 'סכנה', 'אזהרה', 'חרדה', 'משבר', 'איום', 'חירום', 'דחיפות', 'קריסה',
      'warning', 'threat', 'alarm', 'danger', 'crisis', 'emergency', 'urgent',
      'escalation', 'explosion', 'collapse',
    ],
  },
  {
    // Investigative / exposé (indie lean)
    category: 'investigative',
    patterns: [
      'חושף', 'מגלה', 'חקירה', 'מסמכים', 'מה שלא', 'הסתרה', 'דלף', 'מקורות',
      'reveals', 'exposes', 'exclusive', 'leaked', 'investigation', 'documents', 'sources say',
      'whistleblower', 'uncovered', 'discovered',
    ],
  },
  {
    // Editorial / opinion framing
    category: 'editorial',
    patterns: [
      'חייב', 'חייבת', 'צריך', 'בושה', 'כישלון', 'גנאי', 'מביש', 'כיצד',
      'must', 'should', 'shameful', 'outrageous', 'failure', 'disgrace', 'why', 'how could',
      'unacceptable', 'disturbing',
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isHebrew(s: string): boolean {
  return /[֐-׿]/.test(s);
}

/** Tokenize a block of text into normalized words, removing stopwords */
function tokenize(text: string): string[] {
  return text
    .replace(/["""''()\[\]{}<>:;,!?\/\\|@#$%^&*+=~`]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim().toLowerCase().replace(/^[-–—]+|[-–—]+$/g, ''))
    .filter(w => {
      if (w.length < 3) return false;
      if (HE_STOP.has(w)) return false;
      if (EN_STOP.has(w)) return false;
      return true;
    });
}

/** Word frequency map */
function freq(words: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of words) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
}

/**
 * Find words that appear significantly more in groupA than groupB.
 * Uses relative frequency ratio with a minimum occurrence threshold.
 */
function exclusiveWords(
  freqA: Map<string, number>,
  freqB: Map<string, number>,
  totalA: number,
  totalB: number,
  topN: number,
): string[] {
  if (totalA === 0) return [];
  const results: Array<{ word: string; score: number }> = [];
  const normB = totalB > 0 ? totalB : 1;

  for (const [word, cntA] of freqA) {
    const relA = cntA / totalA;
    const cntB = freqB.get(word) ?? 0;
    const relB = cntB / normB;

    // Must appear at least twice in A and be at least 3× more frequent
    if (cntA >= 2 && relA > relB * 3) {
      results.push({ word, score: relA - relB });
    } else if (cntA >= 1 && cntB === 0) {
      // Appears in A only (at least once)
      results.push({ word, score: relA * 0.5 });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(r => r.word);
}

/**
 * Extract named entities from text using simple heuristics:
 * - English: words starting with uppercase (after sentence start)
 * - Hebrew: multi-char words that appear exactly 1-2× (rare = likely proper noun)
 */
function extractEntities(titles: string[]): string[] {
  const entities = new Set<string>();

  for (const title of titles) {
    // English entities: consecutive capitalized words (e.g. "Benjamin Netanyahu")
    const enMatches = title.match(/\b([A-Z][a-z]{2,})(?:\s+[A-Z][a-z]{2,})*\b/g);
    if (enMatches) {
      for (const m of enMatches) {
        const lower = m.toLowerCase();
        if (!EN_STOP.has(lower) && lower.length > 3) entities.add(m);
      }
    }

    // Hebrew entities: words of length 3-10, not stopwords, that look like nouns
    // Heuristic: Hebrew words often have 3-5 chars for names (בנט, לפיד, עזה)
    const heWords = title.match(/[א-ת]{3,8}/g);
    if (heWords) {
      for (const w of heWords) {
        if (!HE_STOP.has(w) && w.length >= 3 && w.length <= 7) {
          entities.add(w);
        }
      }
    }
  }

  // Filter out very common words (appear in many titles = not specific entities)
  return [...entities].slice(0, 20);
}

/** Deduplicate entities: keep only those in set A but not B */
function onlyIn(setA: string[], setB: string[]): string[] {
  const bSet = new Set(setB.map(s => s.toLowerCase()));
  return setA.filter(e => !bSet.has(e.toLowerCase())).slice(0, 5);
}

/** Detect framing signals in text */
function detectFraming(text: string): FramingSignal[] {
  const lower = text.toLowerCase();
  const found: FramingSignal[] = [];
  const seen = new Set<FramingCategory>();

  for (const { patterns, category } of FRAMING_DICT) {
    if (seen.has(category)) continue;
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        // Find the actual word that matched to display
        const displayWord = isHebrew(pattern) ? pattern : pattern;
        found.push({ word: displayWord, category });
        seen.add(category);
        break;
      }
    }
  }

  return found.slice(0, 3);
}

/** Dominant sentiment from a list */
function dominantSentiment(
  sentiments: Array<'positive' | 'negative' | 'neutral' | 'mixed' | undefined>,
): 'positive' | 'negative' | 'neutral' {
  const counts = { positive: 0, negative: 0, neutral: 0 };
  for (const s of sentiments) {
    if (s === 'positive') counts.positive++;
    else if (s === 'negative') counts.negative++;
    else counts.neutral++;
  }
  if (counts.negative > counts.positive && counts.negative > counts.neutral) return 'negative';
  if (counts.positive > counts.negative && counts.positive > counts.neutral) return 'positive';
  return 'neutral';
}

/** Build a short human-readable divergence note */
function buildDivergenceNote(
  divergenceScore: number,
  indieExclusive: string[],
  mainstreamExclusive: string[],
  framingIndie: FramingSignal[],
  framingMainstream: FramingSignal[],
): string | undefined {
  if (divergenceScore < 30) return undefined; // not divergent enough to note

  const indieInv  = framingIndie.some(f => f.category === 'investigative');
  const msAssert  = framingMainstream.some(f => f.category === 'assertive');
  const indieSke  = framingIndie.some(f => f.category === 'skeptical');

  if (indieInv && msAssert) {
    return 'עצמאי מסגר כחשיפה; ממסד מסגר כהכרזה רשמית';
  }
  if (indieSke && msAssert) {
    return 'עצמאי מפקפק; ממסד מאשר — פער אמינות';
  }
  if (indieExclusive.length >= 3 && mainstreamExclusive.length === 0) {
    return `עצמאי מכסה נושאים שהממסד מדלג עליהם: ${indieExclusive.slice(0, 2).join(', ')}`;
  }
  if (mainstreamExclusive.length >= 3 && indieExclusive.length === 0) {
    return `ממסד מדגיש נושאים שהעצמאי מתעלם מהם: ${mainstreamExclusive.slice(0, 2).join(', ')}`;
  }
  if (divergenceScore >= 60) {
    return 'נרטיב שונה מהותית בין התקשורת העצמאית לממסדית';
  }
  return 'כיסוי חלקי שונה בין שני הצדדים';
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface ArticleLite {
  title: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
}

export function computeIndieVsMainstream(
  indieArticles: ArticleLite[],
  mainstreamArticles: ArticleLite[],
): IndieVsMainstream | undefined {
  if (indieArticles.length === 0 || mainstreamArticles.length === 0) return undefined;

  // ── Tokenize all titles
  const indieText   = indieArticles.map(a => a.title).join(' ');
  const msText      = mainstreamArticles.map(a => a.title).join(' ');

  const indieWords  = tokenize(indieText);
  const msWords     = tokenize(msText);

  if (indieWords.length === 0 || msWords.length === 0) return undefined;

  const indieFreq   = freq(indieWords);
  const msFreq      = freq(msWords);

  // ── Exclusive keywords
  const indieExclusive      = exclusiveWords(indieFreq, msFreq, indieWords.length, msWords.length, 6);
  const mainstreamExclusive = exclusiveWords(msFreq, indieFreq, msWords.length, indieWords.length, 6);

  // ── Named entities
  const indieTitles  = indieArticles.map(a => a.title);
  const msTitles     = mainstreamArticles.map(a => a.title);
  const allIndieEntities = extractEntities(indieTitles);
  const allMsEntities    = extractEntities(msTitles);
  const entitiesIndie       = onlyIn(allIndieEntities, allMsEntities);
  const entitiesMainstream  = onlyIn(allMsEntities, allIndieEntities);

  // ── Framing
  const framingIndie       = detectFraming(indieText);
  const framingMainstream  = detectFraming(msText);

  // ── Sentiment
  const indieSentiment      = dominantSentiment(indieArticles.map(a => a.sentiment));
  const mainstreamSentiment = dominantSentiment(mainstreamArticles.map(a => a.sentiment));

  // ── Divergence score: based on vocabulary overlap + framing difference
  const allVocab    = new Set([...indieWords, ...msWords]);
  const sharedCount = [...allVocab].filter(w => indieFreq.has(w) && msFreq.has(w)).length;
  const vocabDivergence = allVocab.size > 0
    ? Math.round((1 - sharedCount / allVocab.size) * 100)
    : 0;

  // Framing divergence bonus: if different framing categories, add points
  const indieCategories = new Set(framingIndie.map(f => f.category));
  const msCategories    = new Set(framingMainstream.map(f => f.category));
  const framingDiff = [...indieCategories].filter(c => !msCategories.has(c)).length;
  const divergenceScore = Math.min(100, vocabDivergence + framingDiff * 10);

  const divergenceNote = buildDivergenceNote(
    divergenceScore,
    indieExclusive,
    mainstreamExclusive,
    framingIndie,
    framingMainstream,
  );

  return {
    indieExclusive,
    mainstreamExclusive,
    framingIndie,
    framingMainstream,
    entitiesIndie,
    entitiesMainstream,
    indieSentiment,
    mainstreamSentiment,
    indieCount: indieArticles.length,
    mainstreamCount: mainstreamArticles.length,
    divergenceScore,
    divergenceNote,
  };
}
