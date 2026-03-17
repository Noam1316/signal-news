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
  | 'implication';

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
};
