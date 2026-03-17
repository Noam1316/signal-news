import type { ShockEvent } from '@/lib/types';

export const shocks: ShockEvent[] = [
  // ── Likelihood shocks (3) ──────────────────────────────────────────

  {
    id: 'shock-1',
    type: 'likelihood',
    headline: {
      he: 'איראן מאשרת הקפאת העשרה: קפיצה בסיכוי להסכם',
      en: 'Iran Confirms Enrichment Freeze: Deal Probability Jumps',
    },
    whatMoved: {
      he: 'שר החוץ האיראני הודיע בוועידת עיתונאים על הקפאת העשרה מעבר ל-20% למשך 90 יום, כצעד ראשון לקראת הסכם ביניים.',
      en: 'Iran\'s Foreign Minister announced at a press conference a freeze on enrichment beyond 20% for 90 days, as a first step toward an interim deal.',
    },
    delta: 8,
    timeWindow: { he: '90 יום הקפאה', en: '90-day freeze' },
    confidence: 'high',
    whyNow: {
      he: 'הלחץ הכלכלי הפנימי באיראן הגיע לנקודת שבירה, עם מחאות ב-15 ערים השבוע.',
      en: 'Internal economic pressure in Iran reached a breaking point, with protests in 15 cities this week.',
    },
    whoDriving: {
      he: 'משרד החוץ האיראני, בגיבוי המנהיג העליון. ארה"ב הגיבה בחיוב.',
      en: 'Iranian Foreign Ministry, backed by the Supreme Leader. US responded positively.',
    },
    sources: [
      { name: 'Reuters', url: '#' },
      { name: 'Al-Monitor', url: '#' },
    ],
    timestamp: '2026-03-17T09:45:00Z',
    relatedStorySlug: 'iran-nuclear-talks',
  },

  {
    id: 'shock-2',
    type: 'likelihood',
    headline: {
      he: 'נתוני תעסוקה: הייטק ישראלי מתאושש מהר מהצפוי',
      en: 'Employment Data: Israeli Tech Recovering Faster Than Expected',
    },
    whatMoved: {
      he: 'הלמ"ס פרסם נתוני תעסוקה שמראים ירידה של 35% בפיטורי הייטק לעומת הרבעון הקודם, עם עלייה של 22% בגיוסים חדשים בתחום ה-AI.',
      en: 'CBS published employment data showing a 35% decrease in tech layoffs compared to the previous quarter, with a 22% increase in new AI sector hires.',
    },
    delta: -6,
    timeWindow: { he: 'רבעון 1 2026', en: 'Q1 2026' },
    confidence: 'high',
    whyNow: {
      he: 'פרסום דו"ח תעסוקה רבעוני של הלמ"ס שמראה שינוי מגמה ברור.',
      en: 'Publication of CBS quarterly employment report showing a clear trend change.',
    },
    whoDriving: {
      he: 'חברות AI ישראליות מובילות את הגיוס. Microsoft ו-Google מחדשים גיוסים בישראל.',
      en: 'Israeli AI companies leading hiring. Microsoft and Google resume recruitment in Israel.',
    },
    sources: [
      { name: 'Calcalist', url: '#' },
      { name: 'Globes', url: '#' },
    ],
    timestamp: '2026-03-17T07:30:00Z',
    relatedStorySlug: 'global-tech-layoffs',
  },

  {
    id: 'shock-3',
    type: 'likelihood',
    headline: {
      he: 'חיזבאללה מפעיל מערך טילי שיוט חדש בדרום לבנון',
      en: 'Hezbollah Deploys New Cruise Missile Array in Southern Lebanon',
    },
    whatMoved: {
      he: 'לוויין מודיעין זיהה פריסה של מערכת טילי שיוט חדשה באזור הליטני. צה"ל העלה כוננות ביחידות ההגנה האווירית בצפון.',
      en: 'Intelligence satellite identified deployment of a new cruise missile system in the Litani area. IDF raised alert levels in northern air defense units.',
    },
    delta: 12,
    timeWindow: { he: '48-72 שעות אחרונות', en: 'Last 48-72 hours' },
    confidence: 'medium',
    whyNow: {
      he: 'תגובה ישירה לחיסול הבכיר בסוריה לפני שבועיים. חיזבאללה מפגין יכולות חדשות.',
      en: 'Direct response to the senior operative\'s elimination in Syria two weeks ago. Hezbollah demonstrating new capabilities.',
    },
    whoDriving: {
      he: 'הזרוע הצבאית של חיזבאללה, בהנחיית איראן. נצפו משלוחי נשק חדשים מסוריה.',
      en: 'Hezbollah\'s military wing, directed by Iran. New weapons shipments from Syria observed.',
    },
    sources: [
      { name: 'Jane\'s Defence', url: '#' },
      { name: 'Channel 13', url: '#' },
      { name: 'Ynet', url: '#' },
    ],
    timestamp: '2026-03-17T11:15:00Z',
    relatedStorySlug: 'northern-border-security',
  },

  // ── Narrative shocks (2) ───────────────────────────────────────────

  {
    id: 'shock-4',
    type: 'narrative',
    headline: {
      he: 'סעודיה משנה גישה: "נורמליזציה גם ללא תנאי פלסטיני מלא"',
      en: 'Saudi Arabia Shifts Approach: "Normalization Even Without Full Palestinian Condition"',
    },
    whatMoved: {
      he: 'דיווח ב-Wall Street Journal חושף שסעודיה מוכנה לקבל "מחוות סמליות" כלפי הפלסטינים במקום מסלול מדיני מלא, בתנאי שארה"ב תחתום על הסכם ביטחוני.',
      en: 'Wall Street Journal report reveals Saudi Arabia is willing to accept "symbolic gestures" toward Palestinians instead of a full diplomatic track, provided the US signs a security pact.',
    },
    delta: 5,
    timeWindow: { he: 'שבועות-חודשים', en: 'Weeks to months' },
    confidence: 'medium',
    whyNow: {
      he: 'MBS מבין שחלון ההזדמנויות עם ממשל ביידן מצטמצם ומוכן להתפשר.',
      en: 'MBS understands the window of opportunity with the Biden administration is narrowing and is willing to compromise.',
    },
    whoDriving: {
      he: 'הנסיך מוחמד בן סלמאן ויועציו, בתיווך אמריקאי אינטנסיבי.',
      en: 'Crown Prince Mohammed bin Salman and his advisors, with intensive American mediation.',
    },
    sources: [
      { name: 'Wall Street Journal', url: '#' },
      { name: 'Al Arabiya', url: '#' },
    ],
    timestamp: '2026-03-17T06:00:00Z',
    relatedStorySlug: 'israel-saudi-normalization',
  },

  {
    id: 'shock-5',
    type: 'narrative',
    headline: {
      he: 'דו"ח IAEA: איראן לא חרגה מהתחייבויותיה ב-6 חודשים',
      en: 'IAEA Report: Iran Has Not Violated Commitments in 6 Months',
    },
    whatMoved: {
      he: 'דו"ח סבא"א החדש מאשר שאיראן עמדה בכל התחייבויות הפיקוח במשך חצי שנה. הדו"ח מחזק את הנרטיב הדיפלומטי ומחליש את הטענות לפעולה צבאית מיידית.',
      en: 'The new IAEA report confirms Iran has met all monitoring commitments for six months. The report strengthens the diplomatic narrative and weakens arguments for immediate military action.',
    },
    delta: 4,
    timeWindow: { he: 'תקף ל-6 חודשים הבאים', en: 'Valid for the next 6 months' },
    confidence: 'high',
    whyNow: {
      he: 'פרסום דו"ח רבעוני שגרתי של סבא"א שהפעם מכיל ממצאים חיוביים יוצאי דופן.',
      en: 'Publication of routine IAEA quarterly report that this time contains unusually positive findings.',
    },
    whoDriving: {
      he: 'רפאל גרוסי, מנכ"ל סבא"א. הדו"ח נתמך על ידי ממצאי פקחים בשטח.',
      en: 'Rafael Grossi, IAEA Director General. Report backed by on-site inspector findings.',
    },
    sources: [
      { name: 'Reuters', url: '#' },
      { name: 'BBC', url: '#' },
      { name: 'Haaretz', url: '#' },
    ],
    timestamp: '2026-03-17T08:00:00Z',
    relatedStorySlug: 'iran-nuclear-talks',
  },

  // ── Fragmentation shocks (2) ───────────────────────────────────────

  {
    id: 'shock-6',
    type: 'fragmentation',
    headline: {
      he: 'פער עצום בין סיקור ישראלי לבינלאומי בנושא הגבול הצפוני',
      en: 'Massive Gap Between Israeli and International Coverage of Northern Border',
    },
    whatMoved: {
      he: 'ניתוח מדיה אוטומטי מזהה פער של 78% בין הסיקור הישראלי (המדגיש איום קיומי) לבין הסיקור הבינלאומי (המציג זאת כהסלמה הדדית). התקשורת הערבית מציגה תמונה שלישית שונה לחלוטין.',
      en: 'Automated media analysis identifies a 78% gap between Israeli coverage (emphasizing existential threat) and international coverage (presenting it as mutual escalation). Arab media presents a completely different third perspective.',
    },
    delta: 0,
    timeWindow: { he: 'שבועיים אחרונים', en: 'Last two weeks' },
    confidence: 'high',
    whyNow: {
      he: 'ההסלמה בצפון יצרה סיקור מקביל בתקשורות שונות שחושף פערי נרטיב משמעותיים.',
      en: 'The northern escalation generated parallel coverage across different media that reveals significant narrative gaps.',
    },
    whoDriving: {
      he: 'אין גורם יחיד; מדובר בפערי תפיסה מבניים בין תקשורות שונות.',
      en: 'No single driver; these are structural perception gaps between different media ecosystems.',
    },
    sources: [
      { name: 'Media Bias/Fact Check', url: '#' },
      { name: 'SIGNAL Analysis', url: '#' },
    ],
    timestamp: '2026-03-17T10:30:00Z',
    relatedStorySlug: 'northern-border-security',
  },

  {
    id: 'shock-7',
    type: 'fragmentation',
    headline: {
      he: 'ניתוק נרטיבי: ימין ושמאל בישראל מתארים מציאות שונה בנושא סעודיה',
      en: 'Narrative Disconnect: Israeli Right and Left Describe Different Realities on Saudi Deal',
    },
    whatMoved: {
      he: 'ניתוח אוטומטי של 500 כתבות מזהה שתקשורת ימין מתארת את ההסכם כ"שלום ללא מחיר" בעוד תקשורת שמאל מתארת "ויתור היסטורי על העניין הפלסטיני". שני הצדדים מתעלמים מעובדות שהצד השני מדגיש.',
      en: 'Automated analysis of 500 articles identifies right-wing media describing the deal as "peace without a price" while left-wing media describes "a historic abandonment of the Palestinian issue." Both sides ignore facts the other side emphasizes.',
    },
    delta: 0,
    timeWindow: { he: 'חודש אחרון', en: 'Last month' },
    confidence: 'medium',
    whyNow: {
      he: 'הדלפות חדשות על תנאי ההסכם הפעילו סיקור אינטנסיבי מכל הכיוונים.',
      en: 'New leaks about deal conditions triggered intensive coverage from all directions.',
    },
    whoDriving: {
      he: 'פילוג פוליטי ישראלי מובנה שמתבטא בסיקור תקשורתי מנוגד.',
      en: 'Structural Israeli political polarization manifesting in contradictory media coverage.',
    },
    sources: [
      { name: 'Israel Hayom', url: '#' },
      { name: 'Haaretz', url: '#' },
      { name: 'SIGNAL Analysis', url: '#' },
    ],
    timestamp: '2026-03-17T04:30:00Z',
    relatedStorySlug: 'israel-saudi-normalization',
  },
];
