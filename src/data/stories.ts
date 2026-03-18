import type { StoryDetail } from '@/lib/types';

export const stories: StoryDetail[] = [
  // ── 1. Iran Nuclear Talks ──────────────────────────────────────────
  {
    slug: 'iran-nuclear-talks',
    lens: 'world',
    headline: {
      he: 'שיחות הגרעין עם איראן: חלון הזדמנויות חדש נפתח',
      en: 'Iran Nuclear Talks: A New Window of Opportunity Opens',
    },
    summary: {
      he: 'סבב שיחות חדש בין איראן למעצמות המערב מתקרב לנקודת הכרעה, כשטהרן מאותתת על נכונות להקפאת העשרה תמורת הקלות בסנקציות. גורמי מודיעין מעריכים שהסיכוי להסכם ביניים עלה משמעותית בשבועות האחרונים.',
      en: 'A new round of talks between Iran and Western powers is approaching a decision point, as Tehran signals willingness to freeze enrichment in exchange for sanctions relief. Intelligence sources assess that the chance of an interim agreement has risen significantly in recent weeks.',
    },
    likelihood: 72,
    likelihoodLabel: 'high',
    delta: 8,
    why: {
      he: 'לחץ כלכלי פנימי באיראן וגישת הלחץ המרבי של ממשל טראמפ כלפי טהרן מעלים את הסיכוי להסכם ביניים.',
      en: 'Internal economic pressure in Iran and the Trump administration\'s maximum pressure approach toward Tehran raise the probability of an interim deal.',
    },
    isSignal: true,
    category: { he: 'ביטחון לאומי', en: 'National Security' },
    sources: [
      { name: 'Reuters', url: '#' },
      { name: 'Haaretz', url: '#' },
      { name: 'Al-Monitor', url: '#' },
    ],
    updatedAt: '2026-03-17T08:30:00Z',
    timeline: [
      { date: '2025-12-20', value: 58 },
      { date: '2025-12-28', value: 55, event: { he: 'איראן מגבירה העשרה ל-60%', en: 'Iran increases enrichment to 60%' } },
      { date: '2026-01-05', value: 52 },
      { date: '2026-01-14', value: 54 },
      { date: '2026-01-22', value: 58, event: { he: 'ארה"ב מציעה מסגרת שיחות חדשה', en: 'US proposes new talks framework' } },
      { date: '2026-01-30', value: 60 },
      { date: '2026-02-06', value: 62 },
      { date: '2026-02-14', value: 59, event: { he: 'פיגוע בנתניה מעכב שיחות', en: 'Attack in Netanya delays talks' } },
      { date: '2026-02-20', value: 61 },
      { date: '2026-02-27', value: 64, event: { he: 'סבב שיחות סודי בעומאן', en: 'Secret talks round in Oman' } },
      { date: '2026-03-04', value: 66 },
      { date: '2026-03-09', value: 68 },
      { date: '2026-03-13', value: 70, event: { he: 'טהרן מאשרת הקפאת העשרה', en: 'Tehran confirms enrichment freeze' } },
      { date: '2026-03-17', value: 72 },
    ],
    narratives: [
      {
        id: 'iran-n1',
        thesis: { he: 'איראן מבקשת הסכם ביניים כדי להקל על הלחץ הכלכלי', en: 'Iran seeks an interim deal to ease economic pressure' },
        trend: 'growing',
        keyFrame: { he: 'מחאות כלכליות גוברות בערי השוליים של איראן', en: 'Growing economic protests in Iran\'s peripheral cities' },
        sources: [{ name: 'Reuters', url: '#' }, { name: 'BBC Persian', url: '#' }],
      },
      {
        id: 'iran-n2',
        thesis: { he: 'ארה"ב תיאלץ לקבל הסכם חלקי בשל לוח הזמנים הפוליטי', en: 'US will be forced to accept a partial deal due to political timeline' },
        trend: 'growing',
        keyFrame: { he: 'טראמפ מבקש להציג הישג דיפלומטי לפני בחירות 2026', en: 'Trump seeks to showcase diplomatic achievement before 2026 midterms' },
        sources: [{ name: 'Washington Post', url: '#' }],
      },
      {
        id: 'iran-n3',
        thesis: { he: 'ישראל תפעל צבאית אם השיחות ייכשלו', en: 'Israel will act militarily if talks fail' },
        trend: 'stable',
        keyFrame: { he: 'תרגיל חיל האוויר הישראלי מעל קפריסין', en: 'Israeli Air Force exercise over Cyprus' },
        sources: [{ name: 'Ynet', url: '#' }, { name: 'Times of Israel', url: '#' }],
      },
      {
        id: 'iran-n4',
        thesis: { he: 'רוסיה וסין מונעות סנקציות חדשות במועצת הביטחון', en: 'Russia and China block new sanctions at the Security Council' },
        trend: 'declining',
        keyFrame: { he: 'סין מצמצמת יבוא נפט מאיראן', en: 'China reduces oil imports from Iran' },
        sources: [{ name: 'Financial Times', url: '#' }],
      },
    ],
    lensView: {
      israelMainstream: {
        emphasis: { he: 'דגש על האיום הקיומי ונחיצות המוכנות הצבאית במקביל לדיפלומטיה', en: 'Emphasis on existential threat and necessity of military readiness alongside diplomacy' },
        sources: [{ name: 'Ynet', url: '#' }, { name: 'Mako', url: '#' }],
      },
      israelPartisan: {
        emphasis: { he: 'ימין: הסכם חלקי סכנה; שמאל: הזדמנות היסטורית', en: 'Right: partial deal is dangerous; Left: historic opportunity' },
        sources: [{ name: 'Israel Hayom', url: '#' }, { name: 'Haaretz', url: '#' }],
      },
      international: {
        emphasis: { he: 'התקשורת הבינלאומית מתמקדת בהשלכות על שוק הנפט ולא על ישראל', en: 'International media focuses on oil market implications rather than Israel' },
        sources: [{ name: 'Reuters', url: '#' }, { name: 'Bloomberg', url: '#' }],
      },
    },
    soWhat: [
      { he: 'הסכם ביניים ישפיע ישירות על מחירי האנרגיה בישראל', en: 'An interim deal will directly impact energy prices in Israel' },
      { he: 'הקפאת העשרה תרחיק את "זמן הפריצה" הגרעיני בחודשים', en: 'Enrichment freeze would push nuclear "breakout time" back by months' },
      { he: 'כישלון השיחות עלול להוביל להסלמה אזורית', en: 'Talks failure could lead to regional escalation' },
    ],
    watchNext: [
      {
        trigger: { he: 'איראן מכריזה על הקפאה רשמית של העשרה מעבר ל-20%', en: 'Iran announces official freeze of enrichment beyond 20%' },
        implication: { he: 'עלייה חדה בסיכוי להסכם ביניים; ירידה במחירי הנפט', en: 'Sharp increase in interim deal probability; oil price decline' },
      },
      {
        trigger: { he: 'סיבוב פיקוח של סבא"א מסתיים ללא ממצאים חדשים', en: 'IAEA inspection round concludes without new findings' },
        implication: { he: 'חיזוק נרטיב ההסכם; הקלת סנקציות קרובה', en: 'Strengthening of deal narrative; sanctions relief imminent' },
      },
      {
        trigger: { he: 'ישראל מבצעת תרגיל צבאי רחב היקף', en: 'Israel conducts large-scale military exercise' },
        implication: { he: 'לחץ צבאי על איראן; סיכון להידרדרות השיחות', en: 'Military pressure on Iran; risk of talks deterioration' },
      },
    ],
  },

  // ── 2. Israel-Saudi Normalization ──────────────────────────────────
  {
    slug: 'israel-saudi-normalization',
    lens: 'israel',
    headline: {
      he: 'נורמליזציה ישראלית-סעודית: תנאים חדשים על השולחן',
      en: 'Israel-Saudi Normalization: New Conditions on the Table',
    },
    summary: {
      he: 'ערב הסעודית הציבה תנאים מעודכנים להסכם נורמליזציה עם ישראל, הכוללים דרישה למסלול מדיני פלסטיני ברור. ארה"ב ממשיכה לתווך בין הצדדים, כשהריאד דורשת גם הסכם ביטחוני עם וושינגטון.',
      en: 'Saudi Arabia has set updated conditions for a normalization deal with Israel, including a demand for a clear Palestinian diplomatic track. The US continues to mediate between the sides, with Riyadh also demanding a security pact with Washington.',
    },
    likelihood: 45,
    likelihoodLabel: 'medium',
    delta: 3,
    why: {
      he: 'התקדמות זהירה בשיחות הסודיות, אך הדרישה הסעודית למרכיב פלסטיני עדיין מהווה חסם משמעותי.',
      en: 'Cautious progress in back-channel talks, but the Saudi demand for a Palestinian component remains a significant barrier.',
    },
    isSignal: true,
    category: { he: 'דיפלומטיה', en: 'Diplomacy' },
    sources: [
      { name: 'Wall Street Journal', url: '#' },
      { name: 'Al Arabiya', url: '#' },
      { name: 'Kan News', url: '#' },
    ],
    updatedAt: '2026-03-17T06:15:00Z',
    timeline: [
      { date: '2025-12-22', value: 38 },
      { date: '2025-12-30', value: 36 },
      { date: '2026-01-08', value: 35, event: { he: 'טראמפ מציע חבילה ביטחונית לסעודיה', en: 'Trump proposes security package for Saudi Arabia' } },
      { date: '2026-01-17', value: 38 },
      { date: '2026-01-25', value: 40 },
      { date: '2026-02-02', value: 39 },
      { date: '2026-02-10', value: 41, event: { he: 'פגישה סודית בין נתניהו ל-MBS בירדן', en: 'Secret Netanyahu-MBS meeting in Jordan' } },
      { date: '2026-02-18', value: 43 },
      { date: '2026-02-25', value: 42, event: { he: 'הרשות הפלסטינית דוחה את המתווה', en: 'Palestinian Authority rejects the framework' } },
      { date: '2026-03-03', value: 40 },
      { date: '2026-03-10', value: 43, event: { he: 'ארה"ב מציגה נוסח פשרה חדש', en: 'US presents new compromise language' } },
      { date: '2026-03-17', value: 45 },
    ],
    narratives: [
      {
        id: 'saudi-n1',
        thesis: { he: 'הסעודים מעוניינים בנורמליזציה בעיקר כדי להשיג ערבות ביטחונית אמריקאית', en: 'Saudis want normalization mainly to secure a US security guarantee' },
        trend: 'growing',
        keyFrame: { he: 'MBS דורש סעיף הגנה כמו NATO', en: 'MBS demands a NATO-style defense clause' },
        sources: [{ name: 'Wall Street Journal', url: '#' }],
      },
      {
        id: 'saudi-n2',
        thesis: { he: 'ישראל לא תסכים לתנאי הפלסטיני במתכונתו הנוכחית', en: 'Israel won\'t agree to the Palestinian condition in its current form' },
        trend: 'stable',
        keyFrame: { he: 'נתניהו: "לא למדינה פלסטינית בכל מחיר"', en: 'Netanyahu: "No Palestinian state at any cost"' },
        sources: [{ name: 'Israel Hayom', url: '#' }, { name: 'Kan News', url: '#' }],
      },
      {
        id: 'saudi-n3',
        thesis: { he: 'עסקת הנורמליזציה תכלול גם רכיב גרעיני אזרחי לסעודיה', en: 'The normalization deal will include a civilian nuclear component for Saudi Arabia' },
        trend: 'growing',
        keyFrame: { he: 'סעודיה חותמת הסכם גרעיני עם דרום קוריאה', en: 'Saudi Arabia signs nuclear deal with South Korea' },
        sources: [{ name: 'Financial Times', url: '#' }, { name: 'Al Arabiya', url: '#' }],
      },
    ],
    lensView: {
      israelMainstream: {
        emphasis: { he: 'דגש על הפוטנציאל הכלכלי והביטחוני של ההסכם', en: 'Emphasis on the economic and security potential of the deal' },
        sources: [{ name: 'Ynet', url: '#' }, { name: 'Channel 12', url: '#' }],
      },
      israelPartisan: {
        emphasis: { he: 'ימין: אפשר ללא תנאי פלסטיני; שמאל: הזדמנות לפתרון שתי מדינות', en: 'Right: possible without Palestinian condition; Left: opportunity for two-state solution' },
        sources: [{ name: 'Israel Hayom', url: '#' }, { name: 'Haaretz', url: '#' }],
      },
      international: {
        emphasis: { he: 'התקשורת הבינלאומית רואה בעסקה שינוי מפת הכוחות האזורית מול איראן', en: 'International media sees the deal as reshaping regional power dynamics against Iran' },
        sources: [{ name: 'BBC', url: '#' }, { name: 'The Economist', url: '#' }],
      },
    },
    soWhat: [
      { he: 'הסכם עשוי לפתוח שוק סעודי ענק לחברות ישראליות', en: 'A deal could open a massive Saudi market for Israeli companies' },
      { he: 'נורמליזציה תשנה את מפת הבריתות באזור', en: 'Normalization would reshape regional alliance maps' },
      { he: 'כישלון העסקה עלול להוביל לנורמליזציה סעודית-איראנית מואצת', en: 'Deal failure could accelerate Saudi-Iranian normalization' },
    ],
    watchNext: [
      {
        trigger: { he: 'ביקור רשמי של שר החוץ הסעודי בירושלים', en: 'Official visit by Saudi Foreign Minister to Jerusalem' },
        implication: { he: 'קפיצת מדרגה בסיכוי להסכם; שינוי אזורי דרמטי', en: 'Major jump in deal probability; dramatic regional shift' },
      },
      {
        trigger: { he: 'הקואליציה הישראלית מפילה הצעת חוק על מדינה פלסטינית', en: 'Israeli coalition defeats bill on Palestinian state' },
        implication: { he: 'הקפאת השיחות; ירידה בסיכוי לנורמליזציה', en: 'Talks frozen; decline in normalization probability' },
      },
    ],
  },

  // ── 3. Global Tech Layoffs ─────────────────────────────────────────
  {
    slug: 'global-tech-layoffs',
    lens: 'world',
    headline: {
      he: 'פיטורי הייטק גלובליים: הגל השלישי מגיע לישראל',
      en: 'Global Tech Layoffs: Third Wave Reaches Israel',
    },
    summary: {
      he: 'גל פיטורים שלישי בתעשיית ההייטק הגלובלית משפיע על חברות ישראליות. הנתונים מראים שהמגמה מתמתנת ומרבית הפיטורים מתרכזים בתפקידים שאינם הנדסיים. השוק מתחיל להתאושש בתחומי AI ו-Cybersecurity.',
      en: 'A third wave of layoffs in the global tech industry is affecting Israeli companies. Data shows the trend is moderating, with most layoffs concentrated in non-engineering roles. The market is beginning to recover in AI and Cybersecurity sectors.',
    },
    likelihood: 61,
    likelihoodLabel: 'medium',
    delta: -4,
    why: {
      he: 'הנתונים מראים האטה בקצב הפיטורים. חברות AI ממשיכות לגייס, מה שמפחית את הסיכון הכולל למשק הטכנולוגי.',
      en: 'Data shows a slowdown in layoff rates. AI companies continue to hire, reducing the overall risk to the tech economy.',
    },
    isSignal: false,
    category: { he: 'כלכלה וטכנולוגיה', en: 'Economy & Technology' },
    sources: [
      { name: 'Calcalist', url: '#' },
      { name: 'TechCrunch', url: '#' },
      { name: 'Globes', url: '#' },
    ],
    updatedAt: '2026-03-16T14:00:00Z',
    timeline: [
      { date: '2025-12-23', value: 70 },
      { date: '2026-01-02', value: 72, event: { he: 'מטא מפטרת 4,000 עובדים נוספים', en: 'Meta lays off 4,000 additional employees' } },
      { date: '2026-01-10', value: 71 },
      { date: '2026-01-19', value: 69 },
      { date: '2026-01-27', value: 68, event: { he: 'גוגל מבטלת פרויקטים בישראל', en: 'Google cancels projects in Israel' } },
      { date: '2026-02-04', value: 67 },
      { date: '2026-02-12', value: 66 },
      { date: '2026-02-19', value: 65, event: { he: 'OpenAI מכריזה על 2,000 משרות חדשות', en: 'OpenAI announces 2,000 new positions' } },
      { date: '2026-02-26', value: 64 },
      { date: '2026-03-04', value: 63 },
      { date: '2026-03-10', value: 62, event: { he: 'סקר: 40% מחברות ישראליות מתכננות גיוס', en: 'Survey: 40% of Israeli companies plan to hire' } },
      { date: '2026-03-16', value: 61 },
    ],
    narratives: [
      {
        id: 'tech-n1',
        thesis: { he: 'הפיטורים הם תיקון שוק בריא ולא משבר מבני', en: 'Layoffs are a healthy market correction, not a structural crisis' },
        trend: 'growing',
        keyFrame: { he: 'שוק ההון מגיב בחיוב לפיטורים; מניות עולות', en: 'Capital markets react positively to layoffs; stocks rise' },
        sources: [{ name: 'Bloomberg', url: '#' }],
      },
      {
        id: 'tech-n2',
        thesis: { he: 'AI מחליף משרות מסורתיות ויוצר ביקוש חדש', en: 'AI is replacing traditional roles and creating new demand' },
        trend: 'growing',
        keyFrame: { he: 'ביקוש למהנדסי AI בישראל עלה ב-80% בשנה', en: 'Demand for AI engineers in Israel up 80% year-over-year' },
        sources: [{ name: 'Calcalist', url: '#' }, { name: 'TechCrunch', url: '#' }],
      },
      {
        id: 'tech-n3',
        thesis: { he: 'ישראל תפגע יותר בגלל תלות בהייטק', en: 'Israel will be hit harder due to tech dependency' },
        trend: 'declining',
        keyFrame: { he: 'סטארטאפים ישראליים גייסו 3.2B$ ברבעון 1', en: 'Israeli startups raised $3.2B in Q1' },
        sources: [{ name: 'IVC', url: '#' }, { name: 'Globes', url: '#' }],
      },
      {
        id: 'tech-n4',
        thesis: { he: 'הגל השלישי מתמקד בניהול ביניים ולא במהנדסים', en: 'Third wave focuses on middle management, not engineers' },
        trend: 'stable',
        keyFrame: { he: '70% מהפיטורים בתפקידי HR, שיווק ופיננסים', en: '70% of layoffs in HR, marketing, and finance roles' },
        sources: [{ name: 'Layoffs.fyi', url: '#' }],
      },
    ],
    lensView: {
      israelMainstream: {
        emphasis: { he: 'דגש על ההשפעה על משפחות ועל שוק הנדל"ן', en: 'Emphasis on the impact on families and the real estate market' },
        sources: [{ name: 'Ynet', url: '#' }, { name: 'N12', url: '#' }],
      },
      israelPartisan: {
        emphasis: { he: 'ימין: הייטק לא הכל; שמאל: כישלון מדיניות כלכלית', en: 'Right: tech isn\'t everything; Left: economic policy failure' },
        sources: [{ name: 'Channel 14', url: '#' }, { name: 'Haaretz', url: '#' }],
      },
      international: {
        emphasis: { he: 'תקשורת בינלאומית מתמקדת במגמה הגלובלית ולא בהשפעה הישראלית', en: 'International media focuses on global trend rather than Israeli impact' },
        sources: [{ name: 'CNBC', url: '#' }, { name: 'Wall Street Journal', url: '#' }],
      },
    },
    soWhat: [
      { he: 'ההאטה בפיטורים מסמנת שהשוק מתקרב לנקודת שיווי משקל', en: 'The slowdown in layoffs signals the market is approaching equilibrium' },
      { he: 'הזדמנות לסטארטאפים ישראליים לגייס כישרונות שהשתחררו מחברות גדולות', en: 'Opportunity for Israeli startups to recruit talent freed from large companies' },
      { he: 'מגזר ה-AI ממשיך לצמוח ומפצה על ירידות בתחומים אחרים', en: 'The AI sector continues to grow and compensates for declines in other areas' },
      { he: 'השפעה מוגבלת על הכלכלה הישראלית כתוצאה מגיוון יצוא שירותים', en: 'Limited impact on Israeli economy due to services export diversification' },
    ],
    watchNext: [
      {
        trigger: { he: 'חברות ביג-טק מכריזות על גל פיטורים רביעי', en: 'Big Tech companies announce a fourth layoff wave' },
        implication: { he: 'חזרת הסיכון לשוק הישראלי; לחץ על שכר הייטק', en: 'Risk returns to Israeli market; pressure on tech salaries' },
      },
      {
        trigger: { he: 'נתוני תעסוקה חיוביים ברבעון שני 2026', en: 'Positive employment data in Q2 2026' },
        implication: { he: 'אישור שהמשבר מאחורינו; חזרה לגיוסים', en: 'Confirmation that the crisis is behind us; return to hiring' },
      },
    ],
  },

  // ── 4. US Midterms Impact on Middle East ───────────────────────────
  {
    slug: 'us-midterms-middle-east',
    lens: 'world',
    headline: {
      he: 'בחירות האמצע בארה"ב: השלכות על המזרח התיכון',
      en: 'US Midterms: Implications for the Middle East',
    },
    summary: {
      he: 'בחירות האמצע בארה"ב בנובמבר 2026 כבר משפיעות על המדיניות האמריקאית במזרח התיכון. הקמפיינים מתמקדים בסוגיית איראן וסיוע הביטחוני לישראל, כשסקרים מצביעים על התחזקות מחנה שמתנגד להסכם הגרעיני.',
      en: 'The US midterm elections in November 2026 are already influencing American Middle East policy. Campaigns are focusing on the Iran issue and security aid to Israel, with polls indicating a strengthening of the camp opposing the nuclear deal.',
    },
    likelihood: 55,
    likelihoodLabel: 'medium',
    delta: 2,
    why: {
      he: 'תחילת עונת הבחירות בארה"ב מביאה להקשחת עמדות כלפי איראן ולחיזוק התחייבויות לישראל.',
      en: 'The start of the US election season is leading to hardened positions on Iran and strengthened commitments to Israel.',
    },
    isSignal: true,
    category: { he: 'גיאופוליטיקה', en: 'Geopolitics' },
    sources: [
      { name: 'Politico', url: '#' },
      { name: 'CNN', url: '#' },
      { name: 'Times of Israel', url: '#' },
    ],
    updatedAt: '2026-03-17T05:00:00Z',
    timeline: [
      { date: '2025-12-25', value: 48 },
      { date: '2026-01-03', value: 47 },
      { date: '2026-01-12', value: 49 },
      { date: '2026-01-21', value: 50, event: { he: 'סנאטורים רפובליקנים דורשים סנקציות חדשות', en: 'Republican senators demand new sanctions' } },
      { date: '2026-01-30', value: 51 },
      { date: '2026-02-07', value: 50 },
      { date: '2026-02-15', value: 52, event: { he: 'AIPAC מפרסם רשימת מועמדים נתמכים', en: 'AIPAC publishes list of endorsed candidates' } },
      { date: '2026-02-22', value: 51 },
      { date: '2026-03-01', value: 52 },
      { date: '2026-03-08', value: 53, event: { he: 'סקר: 58% מהאמריקנים תומכים בעמדה נגד איראן', en: 'Poll: 58% of Americans support anti-Iran stance' } },
      { date: '2026-03-14', value: 54 },
      { date: '2026-03-17', value: 55 },
    ],
    narratives: [
      {
        id: 'midterms-n1',
        thesis: { he: 'הבחירות ישפיעו על יכולת טראמפ להתקדם בהסכם הגרעיני', en: 'Elections will impact Trump\'s ability to advance the nuclear deal' },
        trend: 'growing',
        keyFrame: { he: 'דמוקרטים מתונים מתרחקים מנושא איראן', en: 'Moderate Democrats distancing from Iran issue' },
        sources: [{ name: 'Politico', url: '#' }, { name: 'The Hill', url: '#' }],
      },
      {
        id: 'midterms-n2',
        thesis: { he: 'חבילת סיוע ביטחוני חדשה לישראל תאושר לפני הבחירות', en: 'A new security aid package for Israel will be approved before elections' },
        trend: 'growing',
        keyFrame: { he: 'הצעת חוק דו-מפלגתית ל-4B$ סיוע נוסף', en: 'Bipartisan bill for $4B additional aid' },
        sources: [{ name: 'CNN', url: '#' }],
      },
      {
        id: 'midterms-n3',
        thesis: { he: 'הדור הצעיר בדמוקרטים ידחוף לעמדה ביקורתית יותר כלפי ישראל', en: 'Younger generation of Democrats will push for a more critical stance toward Israel' },
        trend: 'stable',
        keyFrame: { he: 'מועמדים פרוגרסיביים מנצחים בפריימריז', en: 'Progressive candidates win in primaries' },
        sources: [{ name: 'New York Times', url: '#' }],
      },
    ],
    lensView: {
      israelMainstream: {
        emphasis: { he: 'דגש על ההזדמנות לחיזוק הקשר האסטרטגי עם ארה"ב', en: 'Emphasis on the opportunity to strengthen the strategic relationship with the US' },
        sources: [{ name: 'Channel 12', url: '#' }, { name: 'Mako', url: '#' }],
      },
      israelPartisan: {
        emphasis: { he: 'ימין: ניצחון רפובליקני יטיב עם ישראל; שמאל: סיכון לניכור מהדמוקרטים', en: 'Right: Republican victory would benefit Israel; Left: risk of alienation from Democrats' },
        sources: [{ name: 'Israel Hayom', url: '#' }, { name: 'Haaretz', url: '#' }],
      },
      international: {
        emphasis: { he: 'הבחירות נתפסות כמבחן למעמד אמריקה כמנהיגה גלובלית', en: 'Elections seen as a test for America\'s standing as a global leader' },
        sources: [{ name: 'The Economist', url: '#' }, { name: 'BBC', url: '#' }],
      },
    },
    soWhat: [
      { he: 'מדיניות ארה"ב כלפי איראן תוקפא בחודשים הקרובים בגלל שיקולי בחירות', en: 'US policy toward Iran will freeze in coming months due to election considerations' },
      { he: 'סיוע ביטחוני מוגבר לישראל צפוי להיות מאושר כמחווה פוליטית', en: 'Increased security aid to Israel expected to be approved as a political gesture' },
    ],
    watchNext: [
      {
        trigger: { he: 'תוצאות הפריימריז מצביעות על מגמה ברורה', en: 'Primary results indicate a clear trend' },
        implication: { he: 'אינדיקציה לכיוון מדיניות החוץ בקונגרס הבא', en: 'Indication of foreign policy direction in the next Congress' },
      },
      {
        trigger: { he: 'טראמפ נושא נאום מדיניות חוץ מרכזי', en: 'Trump delivers a major foreign policy speech' },
        implication: { he: 'הבהרת עמדת ארה"ב לפני הבחירות; השפעה על שיחות הגרעין', en: 'Clarification of US stance before elections; impact on nuclear talks' },
      },
      {
        trigger: { he: 'משבר ביטחוני חדש במזרח התיכון', en: 'New security crisis in the Middle East' },
        implication: { he: 'הפיכת המדיניות החוץ לנושא מרכזי בבחירות', en: 'Foreign policy becomes a central election issue' },
      },
    ],
  },

  // ── 5. Northern Border Security ────────────────────────────────────
  {
    slug: 'northern-border-security',
    lens: 'israel',
    headline: {
      he: 'ביטחון הגבול הצפוני: חיזבאללה מגביר פעילות',
      en: 'Northern Border Security: Hezbollah Escalates Activity',
    },
    summary: {
      he: 'פעילות חיזבאללה לאורך הגבול הצפוני עלתה ב-40% בחודש האחרון. צה"ל מזהה תנועות כוחות חריגות ומערך טילים מעודכן. חרף הרטוריקה, גורמי מודיעין מעריכים שנסראללה אינו מעוניין במלחמה מלאה כרגע.',
      en: 'Hezbollah activity along the northern border has increased by 40% in the past month. The IDF identifies unusual force movements and an updated missile array. Despite the rhetoric, intelligence sources assess that Nasrallah is not interested in a full-scale war at this time.',
    },
    likelihood: 38,
    likelihoodLabel: 'low',
    delta: 12,
    why: {
      he: 'זינוק חד בפעילות חיזבאללה לאחר חיסול בכיר בארגון. הערכת המודיעין גורסת שמדובר בהפגנת כוח ולא בכוונה למלחמה.',
      en: 'Sharp spike in Hezbollah activity after the elimination of a senior operative. Intelligence assessment considers this a show of force rather than intent for war.',
    },
    isSignal: true,
    category: { he: 'ביטחון', en: 'Security' },
    sources: [
      { name: 'Ynet', url: '#' },
      { name: 'Channel 13', url: '#' },
      { name: 'Al Jazeera', url: '#' },
      { name: 'Jane\'s Defence', url: '#' },
    ],
    updatedAt: '2026-03-17T10:00:00Z',
    timeline: [
      { date: '2025-12-21', value: 22 },
      { date: '2025-12-29', value: 20 },
      { date: '2026-01-07', value: 21 },
      { date: '2026-01-16', value: 23 },
      { date: '2026-01-24', value: 22 },
      { date: '2026-02-01', value: 24 },
      { date: '2026-02-09', value: 23 },
      { date: '2026-02-16', value: 25 },
      { date: '2026-02-23', value: 24 },
      { date: '2026-03-02', value: 26, event: { he: 'חיסול בכיר חיזבאללה בסוריה', en: 'Elimination of senior Hezbollah operative in Syria' } },
      { date: '2026-03-06', value: 30, event: { he: 'חיזבאללה מכריז על "כוננות מלאה"', en: 'Hezbollah declares "full alert"' } },
      { date: '2026-03-10', value: 33, event: { he: 'תנועות כוחות חריגות לאורך הגבול', en: 'Unusual force movements along the border' } },
      { date: '2026-03-14', value: 35, event: { he: 'צה"ל מפעיל כיפת ברזל בצפון', en: 'IDF activates Iron Dome in the north' } },
      { date: '2026-03-17', value: 38 },
    ],
    narratives: [
      {
        id: 'north-n1',
        thesis: { he: 'חיזבאללה מפגין כוח אך לא רוצה מלחמה', en: 'Hezbollah is showing force but doesn\'t want war' },
        trend: 'growing',
        keyFrame: { he: 'נסראללה בנאום: "לא נתחיל, אבל לא נברח"', en: 'Nasrallah in speech: "We won\'t start, but we won\'t run"' },
        sources: [{ name: 'Al Jazeera', url: '#' }, { name: 'Channel 13', url: '#' }],
      },
      {
        id: 'north-n2',
        thesis: { he: 'ישראל מנצלת את ההזדמנות להרחיב את ההרתעה', en: 'Israel is seizing the opportunity to expand deterrence' },
        trend: 'growing',
        keyFrame: { he: 'צה"ל מכריז על תרגיל "חומת צפון 3"', en: 'IDF announces "Northern Wall 3" exercise' },
        sources: [{ name: 'Ynet', url: '#' }],
      },
      {
        id: 'north-n3',
        thesis: { he: 'איראן מנחה את חיזבאללה להסלים כמנוף לחץ בשיחות הגרעין', en: 'Iran is directing Hezbollah to escalate as leverage in nuclear talks' },
        trend: 'stable',
        keyFrame: { he: 'ביקור מפקד כוח קודס בביירות', en: 'Quds Force commander visits Beirut' },
        sources: [{ name: 'Reuters', url: '#' }, { name: 'Al-Monitor', url: '#' }],
      },
      {
        id: 'north-n4',
        thesis: { he: 'המשבר הכלכלי בלבנון מונע מלחמה מלאה', en: 'Lebanon\'s economic crisis prevents full-scale war' },
        trend: 'stable',
        keyFrame: { he: 'שער הלירה הלבנונית צונח ב-30% נוספים', en: 'Lebanese pound drops another 30%' },
        sources: [{ name: 'Financial Times', url: '#' }, { name: 'L\'Orient Today', url: '#' }],
      },
      {
        id: 'north-n5',
        thesis: { he: 'רוסיה מפחיתה נוכחות בסוריה ומשחררת ידיים לישראל', en: 'Russia reduces presence in Syria and gives Israel a freer hand' },
        trend: 'declining',
        keyFrame: { he: 'רוסיה מפנה בסיס בלטקיה', en: 'Russia evacuates base in Latakia' },
        sources: [{ name: 'Jane\'s Defence', url: '#' }],
      },
    ],
    lensView: {
      israelMainstream: {
        emphasis: { he: 'דגש על איום הטילים והצורך בתקציב ביטחוני מוגבר', en: 'Emphasis on missile threat and need for increased defense budget' },
        sources: [{ name: 'Ynet', url: '#' }, { name: 'Channel 12', url: '#' }],
      },
      israelPartisan: {
        emphasis: { he: 'ימין: פעולה מקדימה נדרשת; שמאל: לא לגרור למלחמה', en: 'Right: preemptive action needed; Left: don\'t drag into war' },
        sources: [{ name: 'Israel Hayom', url: '#' }, { name: 'Haaretz', url: '#' }],
      },
      international: {
        emphasis: { he: 'התקשורת הבינלאומית מזהירה מהסלמה שתערער את כל האזור', en: 'International media warns of escalation that could destabilize the entire region' },
        sources: [{ name: 'BBC', url: '#' }, { name: 'New York Times', url: '#' }],
      },
    },
    soWhat: [
      { he: 'תושבי הצפון חוזרים למצב של חוסר ודאות ביטחונית', en: 'Northern residents return to a state of security uncertainty' },
      { he: 'הסלמה בצפון עלולה לשבש את שיחות הגרעין עם איראן', en: 'Northern escalation could disrupt nuclear talks with Iran' },
      { he: 'עלות הביטחון בצפון מוערכת ב-2 מיליארד ש"ח לשנה', en: 'Northern security costs estimated at 2 billion NIS per year' },
    ],
    watchNext: [
      {
        trigger: { he: 'שיגור טילים או רקטות לעבר שטח ישראל', en: 'Missile or rocket launch toward Israeli territory' },
        implication: { he: 'הסלמה מיידית; תגובה ישראלית חזקה; סיכון למלחמה', en: 'Immediate escalation; strong Israeli response; risk of war' },
      },
      {
        trigger: { he: 'תיווך צרפתי מוביל להסכם הפרדת כוחות חדש', en: 'French mediation leads to a new force separation agreement' },
        implication: { he: 'ירידה חדה בסיכון; חזרת תושבי הצפון', en: 'Sharp decrease in risk; return of northern residents' },
      },
    ],
  },
];
