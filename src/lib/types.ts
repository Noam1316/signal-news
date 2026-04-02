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

export interface BriefStory {
  slug: string;
  headline: LocalizedText;
  summary: LocalizedText;
  likelihood: number;
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
