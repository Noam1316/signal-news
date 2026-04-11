/**
 * Geopolitical Calendar Service
 * Forward-looking intelligence: upcoming events that could drive news.
 * Combines static known events with article-extracted date mentions.
 */

export type EventCategory =
  | 'diplomacy'    // negotiations, summits, meetings
  | 'military'     // operations, exercises, deadlines
  | 'legal'        // court rulings, sanctions, UN votes
  | 'economic'     // data releases, policy decisions
  | 'elections'    // any election
  | 'deadline';    // ultimatums, treaty expiry

export interface GeoEvent {
  id: string;
  date: string;               // ISO date string (YYYY-MM-DD or YYYY-MM)
  dateApprox: boolean;        // true if date is approximate
  titleHe: string;
  titleEn: string;
  descHe: string;
  descEn: string;
  category: EventCategory;
  relatedTopics: string[];
  importance: 'critical' | 'high' | 'medium';
  region: string;
}

// ── Static known events ───────────────────────────────────────────────────────
// Updated for April–December 2026 horizon

const STATIC_EVENTS: GeoEvent[] = [
  {
    id: 'iran-nuclear-talks-q2',
    date: '2026-04',
    dateApprox: true,
    titleHe: 'שיחות גרעין ארה"ב-איראן',
    titleEn: 'US-Iran Nuclear Talks',
    descHe: 'סבב חדש של משא ומתן גרעיני — שאלת הסנקציות ורמת ההעשרה עומדות על הפרק',
    descEn: 'New round of nuclear negotiations — sanctions relief and enrichment level at stake',
    category: 'diplomacy',
    relatedTopics: ['Iran Nuclear'],
    importance: 'critical',
    region: 'Middle East',
  },
  {
    id: 'iaea-board-june',
    date: '2026-06-01',
    dateApprox: true,
    titleHe: 'ישיבת מועצת הנגידים — IAEA',
    titleEn: 'IAEA Board of Governors Meeting',
    descHe: 'דיון בדו"ח הטכני על התקדמות איראן בהעשרה — אפשרות להחלטת נגד',
    descEn: 'Review of technical report on Iran enrichment progress — possible censure resolution',
    category: 'legal',
    relatedTopics: ['Iran Nuclear'],
    importance: 'critical',
    region: 'Global',
  },
  {
    id: 'lebanon-reconstruction',
    date: '2026-05',
    dateApprox: true,
    titleHe: 'ועידת שיקום לבנון — פריז',
    titleEn: 'Lebanon Reconstruction Conference — Paris',
    descHe: 'מדינות המערב דנות בסיוע כלכלי ללבנון בתנאי נסיגה מלאה של חיזבאללה מהדרום',
    descEn: 'Western nations discuss economic aid to Lebanon contingent on full Hezbollah withdrawal',
    category: 'diplomacy',
    relatedTopics: ['Lebanon/Hezbollah', 'Diplomacy'],
    importance: 'high',
    region: 'Middle East',
  },
  {
    id: 'turkey-election-2026',
    date: '2026-06',
    dateApprox: true,
    titleHe: 'בחירות מוניציפליות בתורכיה',
    titleEn: 'Turkey Municipal Elections',
    descHe: 'בחירות ברמה העירונית — מבחן לאמינות ארדואן אחרי המשבר הכלכלי',
    descEn: 'Municipal level elections — test of Erdogan\'s popularity after economic crisis',
    category: 'elections',
    relatedTopics: ['Turkey/Egypt', 'Diplomacy'],
    importance: 'medium',
    region: 'Middle East',
  },
  {
    id: 'un-security-council-q3',
    date: '2026-07',
    dateApprox: true,
    titleHe: 'מועצת הביטחון — ישיבה על עזה',
    titleEn: 'UN Security Council — Gaza Session',
    descHe: 'ישיבה רבעונית הנוגעת למצב ההומניטרי בעזה ועתיד ממשל הרצועה',
    descEn: 'Quarterly session on humanitarian situation in Gaza and future governance',
    category: 'legal',
    relatedTopics: ['Gaza Conflict', 'Diplomacy'],
    importance: 'high',
    region: 'Global',
  },
  {
    id: 'us-fed-rate-june',
    date: '2026-06-11',
    dateApprox: false,
    titleHe: 'החלטת ריבית — הפד האמריקאי',
    titleEn: 'Federal Reserve Rate Decision',
    descHe: 'ישיבת FOMC — שוק מצפה להחלטה לגבי הפחתת ריבית נוספת',
    descEn: 'FOMC meeting — market expects decision on further rate cut',
    category: 'economic',
    relatedTopics: ['Economy', 'US Politics'],
    importance: 'high',
    region: 'Global',
  },
  {
    id: 'israel-budget-2026',
    date: '2026-05-31',
    dateApprox: false,
    titleHe: 'דדליין תקציב מדינה ישראל',
    titleEn: 'Israel State Budget Deadline',
    descHe: 'מועד אחרון לאישור תקציב המדינה — כישלון עלול להוביל לפיזור הממשלה',
    descEn: 'Deadline for state budget approval — failure could trigger government dissolution',
    category: 'deadline',
    relatedTopics: ['Judicial Reform', 'Economy'],
    importance: 'critical',
    region: 'Israel',
  },
  {
    id: 'opec-meeting-q3',
    date: '2026-07',
    dateApprox: true,
    titleHe: 'ישיבת OPEC+ — מדיניות נפט',
    titleEn: 'OPEC+ Meeting — Oil Policy',
    descHe: 'ועידת OPEC+ לדיון בהארכת קיצוצי הייצור — השפעה ישירה על מחיר הנפט',
    descEn: 'OPEC+ conference on extending production cuts — direct impact on oil prices',
    category: 'economic',
    relatedTopics: ['Saudi Normalization', 'Economy'],
    importance: 'high',
    region: 'Global',
  },
  {
    id: 'nato-summit-2026',
    date: '2026-06',
    dateApprox: true,
    titleHe: 'פסגת נאט"ו 2026',
    titleEn: 'NATO Summit 2026',
    descHe: 'פסגה שנתית — אוקראינה, תקציבי הגנה, מעמד טורקיה',
    descEn: 'Annual summit — Ukraine, defense budgets, Turkey\'s role in focus',
    category: 'diplomacy',
    relatedTopics: ['Ukraine/Russia', 'Diplomacy'],
    importance: 'high',
    region: 'Europe',
  },
  {
    id: 'sanctions-iran-snapback',
    date: '2026-09',
    dateApprox: true,
    titleHe: 'מנגנון Snapback — סנקציות על איראן',
    titleEn: 'Snapback Sanctions Mechanism — Iran',
    descHe: 'מועד אפשרי להפעלת מנגנון ה-snapback שיחזיר סנקציות האו"ם על איראן',
    descEn: 'Potential activation date for snapback mechanism restoring UN sanctions on Iran',
    category: 'deadline',
    relatedTopics: ['Iran Nuclear'],
    importance: 'critical',
    region: 'Global',
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns upcoming events sorted by date, filtered to relevant future dates.
 * Optionally filter by topics active in current stories.
 */
export function getUpcomingEvents(
  options: {
    topics?: string[];   // filter to related topics
    limit?: number;
    daysAhead?: number;  // only return events within N days from now
  } = {}
): GeoEvent[] {
  const { topics, limit = 10, daysAhead = 180 } = options;
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  let events = STATIC_EVENTS.filter(e => {
    const eventDate = new Date(e.date);
    return eventDate >= now && eventDate <= cutoff;
  });

  if (topics && topics.length > 0) {
    const topicSet = new Set(topics);
    events = events.filter(e =>
      e.relatedTopics.some(t => topicSet.has(t))
    );
  }

  return events
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}

/** Returns days until an event (negative = past) */
export function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export const CATEGORY_META: Record<EventCategory, { icon: string; he: string; en: string; color: string }> = {
  diplomacy:  { icon: '🤝', he: 'דיפלומטיה', en: 'Diplomacy',  color: 'text-blue-400 border-blue-400/20 bg-blue-400/5' },
  military:   { icon: '⚔️',  he: 'ביטחוני',   en: 'Military',   color: 'text-red-400 border-red-400/20 bg-red-400/5' },
  legal:      { icon: '⚖️',  he: 'משפטי/בינל', en: 'Legal/Intl', color: 'text-purple-400 border-purple-400/20 bg-purple-400/5' },
  economic:   { icon: '📊',  he: 'כלכלי',      en: 'Economic',   color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' },
  elections:  { icon: '🗳️',  he: 'בחירות',     en: 'Elections',  color: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5' },
  deadline:   { icon: '⏰',  he: 'דדליין',     en: 'Deadline',   color: 'text-orange-400 border-orange-400/20 bg-orange-400/5' },
};
