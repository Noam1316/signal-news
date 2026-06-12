export type Language = 'he' | 'en';
export type Lens = 'israel' | 'world';
export type Confidence = 'high' | 'medium' | 'low';
export type ShockType = 'likelihood' | 'narrative' | 'fragmentation';
export type TrendDirection = 'growing' | 'declining' | 'stable';

export interface LocalizedText {
  he: string;
  en: string;
}

export interface Source {
  name: string;
  url: string;
}

export interface ImpactItem {
  sector: LocalizedText;
  direction: 'positive' | 'negative' | 'uncertain';
}

export interface NarrativeSplit {
  rightHeadline: string;    // most negative right-leaning headline
  leftHeadline: string;     // most negative/contrasting left-leaning headline
  rightSource: string;
  leftSource: string;
  gapPct: number;           // sentiment gap %
}

export interface SignalComponents {
  verification: number;   // 0-30: independent source count
  strength: number;       // 0-25: signal article ratio + avg score
  breadth: number;        // 0-20: cross-lens coverage (IL + international)
  freshness: number;      // 0-15: recency of newest article
  consensus: number;      // 0-10: sentiment agreement across sources
}

export interface BriefStory {
  slug: string;
  headline: LocalizedText;
  summary: LocalizedText;
  likelihood: number;
  signalComponents?: SignalComponents; // breakdown of the signal index
  likelihoodLabel: Confidence;
  delta: number;
  why: LocalizedText;
  isSignal: boolean;
  category: LocalizedText;
  lens: 'israel' | 'world';
  sources: Source[];
  updatedAt: string;
  impacts?: ImpactItem[];
  narrativeSplit?: NarrativeSplit;
  strategicImplication?: LocalizedText;
  resolved?: boolean;           // true if the event has already occurred/completed
  firstMover?: {                // which source broke this story first
    sourceName: string;
    sourceUrl: string;
    minsAhead: number;          // how many minutes before the median publication time
  };
  crossMediaEcho?: {            // did indie media publish before mainstream (or vice versa)?
    direction: 'indie-first' | 'mainstream-first';
    delayMinutes: number;       // how many minutes the "first" side led
    firstSourceName: string;    // name of the earliest source
    crossedAt?: string;         // ISO pubDate when the second side picked it up
  };
  contradiction?: {             // contradictory coverage detected
    sourceA: string;
    headlineA: string;
    sourceB: string;
    headlineB: string;
    gapPct: number;             // sentiment divergence 0-100
  };
  indieVsMainstream?: {         // narrative analysis: indie vs mainstream text differences
    indieExclusive: string[];
    mainstreamExclusive: string[];
    framingIndie: Array<{ word: string; category: string }>;
    framingMainstream: Array<{ word: string; category: string }>;
    entitiesIndie: string[];
    entitiesMainstream: string[];
    indieSentiment: 'positive' | 'negative' | 'neutral';
    mainstreamSentiment: 'positive' | 'negative' | 'neutral';
    indieCount: number;
    mainstreamCount: number;
    divergenceScore: number;
    divergenceNote?: string;
  };
}

export type ShockStatus = 'fresh' | 'active' | 'fading';

export interface ShockEvent {
  id: string;
  type: ShockType;
  headline: LocalizedText;
  whatMoved: LocalizedText;
  delta: number;
  timeWindow: LocalizedText;
  confidence: Confidence;
  whyNow: LocalizedText;
  whoDriving: LocalizedText;
  sources: Source[];
  timestamp: string;
  relatedStorySlug?: string;
  status?: ShockStatus;
}

export interface Narrative {
  id: string;
  thesis: LocalizedText;
  trend: TrendDirection;
  keyFrame: LocalizedText;
  sources: Source[];
}

export interface LensViewData {
  israelMainstream: { emphasis: LocalizedText; sources: Source[] };
  israelPartisan: { emphasis: LocalizedText; sources: Source[] };
  international: { emphasis: LocalizedText; sources: Source[] };
}

export interface TimelinePoint {
  date: string;
  value: number;
  event?: LocalizedText;
}

export interface StoryDetail extends BriefStory {
  timeline: TimelinePoint[];
  narratives: Narrative[];
  lensView: LensViewData;
  soWhat: LocalizedText[];
  watchNext: { trigger: LocalizedText; implication: LocalizedText }[];
}
