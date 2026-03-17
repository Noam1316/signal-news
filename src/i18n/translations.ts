import { LocalizedText } from '@/lib/types';

type TranslationKey =
  | 'appName'
  | 'slogan'
  | 'all'
  | 'dailyBrief'
  | 'shockFeed'
  | 'storyPage'
  | 'israel'
  | 'world'
  | 'likelihood'
  | 'confidence'
  | 'high'
  | 'medium'
  | 'low'
  | 'sources'
  | 'signal'
  | 'noise'
  | 'whyNow'
  | 'whoDriving'
  | 'narratives'
  | 'lensView'
  | 'soWhat'
  | 'watchNext'
  | 'likelihoodShock'
  | 'narrativeShock'
  | 'fragmentationShock'
  | 'growing'
  | 'declining'
  | 'stable'
  | 'changedToday'
  | 'todaysBrief'
  | 'israelMainstream'
  | 'israelPartisan'
  | 'international'
  | 'readMore'
  | 'trigger'
  | 'implication'
  // Landing page keys
  | 'landingSubtitle'
  | 'landingCta'
  | 'liveExample'
  | 'featureLikelihood'
  | 'featureSources'
  | 'featureSignalNoise'
  | 'howItWorks'
  | 'howStep1Title'
  | 'howStep1Desc'
  | 'howStep2Title'
  | 'howStep2Desc'
  | 'howStep3Title'
  | 'howStep3Desc'
  | 'emailSignupTitle'
  | 'emailSignupNote'
  | 'emailPlaceholder'
  | 'subscribe'
  | 'emailThanks'
  | 'footerBuiltWith'
  | 'github';

export const translations: Record<TranslationKey, LocalizedText> = {
  appName: { en: 'Signal News', he: 'Signal News' },
  slogan: { en: 'Know what\'s likely next — without the noise.', he: 'דע מה צפוי — בלי הרעש.' },
  all: { en: 'All', he: 'הכל' },
  dailyBrief: { en: 'Daily Brief', he: 'תקציר יומי' },
  shockFeed: { en: 'Shock Feed', he: 'פיד זעזועים' },
  storyPage: { en: 'Deep Dive', he: 'צלילה לעומק' },
  israel: { en: 'Israel', he: 'ישראל' },
  world: { en: 'World', he: 'עולם' },
  likelihood: { en: 'Likelihood', he: 'סבירות' },
  confidence: { en: 'Confidence', he: 'רמת ביטחון' },
  high: { en: 'High', he: 'גבוה' },
  medium: { en: 'Medium', he: 'בינוני' },
  low: { en: 'Low', he: 'נמוך' },
  sources: { en: 'Sources', he: 'מקורות' },
  signal: { en: 'SIGNAL', he: 'סיגנל' },
  noise: { en: 'NOISE', he: 'רעש' },
  whyNow: { en: 'Why now', he: 'למה עכשיו' },
  whoDriving: { en: 'Who\'s driving it', he: 'מי מוביל' },
  narratives: { en: 'Narratives', he: 'נרטיבים' },
  lensView: { en: 'Lens View', he: 'תצוגת עדשות' },
  soWhat: { en: 'So What?', he: 'אז מה?' },
  watchNext: { en: 'What to Watch Next', he: 'מה לעקוב' },
  likelihoodShock: { en: 'Likelihood Shock', he: 'זעזוע סבירות' },
  narrativeShock: { en: 'Narrative Shock', he: 'זעזוע נרטיבי' },
  fragmentationShock: { en: 'Fragmentation Shock', he: 'זעזוע פיצול' },
  growing: { en: 'Growing', he: 'עולה' },
  declining: { en: 'Declining', he: 'יורד' },
  stable: { en: 'Stable', he: 'יציב' },
  changedToday: { en: 'Changed today', he: 'השתנה היום' },
  todaysBrief: { en: "Today's Brief", he: 'התקציר של היום' },
  israelMainstream: { en: 'Israel Mainstream', he: 'מיינסטרים ישראלי' },
  israelPartisan: { en: 'Israel Partisan', he: 'מפלגתי ישראלי' },
  international: { en: 'International', he: 'בינלאומי' },
  readMore: { en: 'Read more', he: 'קרא עוד' },
  trigger: { en: 'Trigger', he: 'טריגר' },
  implication: { en: 'Implication', he: 'השלכה' },
  // Landing page
  landingSubtitle: {
    en: 'A real-time intelligence layer that turns chaos into clarity',
    he: 'שכבת מודיעין בזמן אמת שהופכת כאוס לבהירות',
  },
  landingCta: {
    en: "See Today's Brief",
    he: 'לתקציר של היום',
  },
  liveExample: {
    en: "Live example from today's brief",
    he: 'דוגמה חיה מהתקציר של היום',
  },
  featureLikelihood: {
    en: 'Likelihood, not opinions',
    he: 'סבירות, לא דעות',
  },
  featureSources: {
    en: 'Sources on everything',
    he: 'מקורות על הכל',
  },
  featureSignalNoise: {
    en: 'Signal vs Noise',
    he: 'סיגנל מול רעש',
  },
  howItWorks: {
    en: 'How It Works',
    he: 'איך זה עובד',
  },
  howStep1Title: {
    en: 'We track propositions',
    he: 'אנחנו עוקבים אחרי טענות',
  },
  howStep1Desc: {
    en: 'Every story is framed as a testable claim with a likelihood score.',
    he: 'כל סיפור ממוסגר כטענה בדיקה עם ציון סבירות.',
  },
  howStep2Title: {
    en: 'AI analyzes 100+ sources daily',
    he: 'AI מנתח 100+ מקורות ביום',
  },
  howStep2Desc: {
    en: 'Cross-referencing narratives, detecting shocks, and scoring confidence.',
    he: 'הצלבת נרטיבים, זיהוי זעזועים, ודירוג רמת ביטחון.',
  },
  howStep3Title: {
    en: 'You get clarity in 90 seconds',
    he: 'אתה מקבל בהירות ב-90 שניות',
  },
  howStep3Desc: {
    en: 'A daily brief that tells you what changed, why, and what to watch.',
    he: 'תקציר יומי שאומר לך מה השתנה, למה, ומה לעקוב.',
  },
  emailSignupTitle: {
    en: 'Get the Daily Brief in your inbox',
    he: 'קבל את התקציר היומי למייל',
  },
  emailSignupNote: {
    en: 'Free. No spam. Unsubscribe anytime.',
    he: 'חינם. בלי ספאם. ביטול בכל עת.',
  },
  emailPlaceholder: {
    en: 'your@email.com',
    he: 'your@email.com',
  },
  subscribe: {
    en: 'Subscribe',
    he: 'הרשמה',
  },
  emailThanks: {
    en: "Thanks! You're on the list.",
    he: 'תודה! נרשמת בהצלחה.',
  },
  footerBuiltWith: {
    en: 'Built with data',
    he: 'נבנה עם נתונים',
  },
  github: {
    en: 'GitHub',
    he: 'GitHub',
  },
};
