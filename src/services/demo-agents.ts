/**
 * Demo Agent Simulator
 * Generates 100 synthetic user profiles with realistic browsing behavior
 * Used for demo analytics dashboard and engagement simulation
 */

export type AgentPersona =
  | 'analyst'        // intelligence/security analyst
  | 'journalist'     // reporter / editor
  | 'investor'       // trader / fund manager
  | 'policy'         // government / think tank
  | 'student'        // university student
  | 'techie'         // tech professional
  | 'casual'         // general news consumer
  | 'activist';      // NGO / advocacy

export type AgentLocation = 'tel-aviv' | 'jerusalem' | 'haifa' | 'beer-sheva' | 'new-york' | 'london' | 'washington' | 'berlin' | 'paris' | 'dubai';

export interface DemoAgent {
  id: number;
  name: string;
  persona: AgentPersona;
  location: AgentLocation;
  language: 'he' | 'en' | 'both';
  interests: string[];            // topics they follow
  avgSessionMinutes: number;      // avg time on site
  sessionsPerWeek: number;        // how often they visit
  sectionsVisited: string[];      // which sections they use
  favoriteFeature: string;        // what keeps them coming back
  criticism: string;              // their main complaint
  retentionTrigger: string;       // what would make them return
  engagementScore: number;        // 0-100 engagement level
  churnRisk: 'low' | 'medium' | 'high';
  lastVisit: string;              // ISO date
  totalVisits: number;
  actions: AgentAction[];         // simulated session actions
}

export interface AgentAction {
  type: 'view' | 'click' | 'expand' | 'share' | 'bookmark' | 'tab-switch' | 'scroll' | 'return';
  section: string;
  timestamp: string;
  durationSeconds: number;
}

export interface EngagementMetrics {
  totalAgents: number;
  activeToday: number;
  avgSessionMinutes: number;
  bounceRate: number;              // % who left within 30s
  returnRate: number;              // % who came back 2+ times
  topSections: { section: string; views: number; avgDwell: number }[];
  topCriticisms: { text: string; count: number; severity: 'low' | 'medium' | 'high' }[];
  retentionDrivers: { driver: string; count: number; impact: number }[];
  churnDistribution: { low: number; medium: number; high: number };
  personaBreakdown: { persona: AgentPersona; count: number; avgEngagement: number }[];
  hourlyTraffic: { hour: number; visitors: number }[];
  featureRequests: { feature: string; votes: number; priority: 'p0' | 'p1' | 'p2' }[];
}

// ── Name pools ──

const HE_FIRST = ['נועם', 'יעל', 'אורי', 'שירה', 'עידן', 'מיכל', 'אלון', 'דנה', 'איתי', 'נועה', 'גיל', 'רונית', 'עמית', 'תמר', 'ליאור', 'הדר', 'אייל', 'רוני', 'שחר', 'מאיה', 'עדי', 'אביב', 'קרן', 'ניר', 'גלית', 'יונתן', 'רחל', 'דביר', 'ענבל', 'תומר'];
const EN_FIRST = ['James', 'Sarah', 'Michael', 'Emma', 'David', 'Rachel', 'Daniel', 'Olivia', 'Alex', 'Sophie', 'Ben', 'Natalie', 'Chris', 'Hanna', 'Mark', 'Lea', 'Tom', 'Mia', 'Jake', 'Lily', 'Sam', 'Nora', 'Josh', 'Eve', 'Max', 'Zara', 'Adam', 'Rosa', 'Leo', 'Ana'];
const HE_LAST = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'אברהם', 'פרידמן', 'שלום', 'דהן', 'אגבריה', 'גולן', 'רביב', 'שפירא', 'ברק', 'אלוני'];
const EN_LAST = ['Cohen', 'Goldman', 'Stern', 'Fisher', 'Klein', 'Rosen', 'Miller', 'Brooks', 'Hayes', 'Chen', 'Park', 'Silva', 'Weber', 'Dumont', 'Khan'];

const TOPICS = [
  'Iran Nuclear', 'Gaza Conflict', 'Lebanon/Hezbollah', 'US Politics',
  'Ukraine War', 'Saudi Relations', 'Tech Industry', 'Economy',
  'Judicial Reform', 'Syria', 'China-Taiwan', 'Climate',
  'Cybersecurity', 'AI Regulation', 'Oil Markets', 'Elections',
];

const SECTIONS = ['brief', 'shocks', 'map', 'entities', 'intel', 'polymarket', 'bias', 'feed'];

const CRITICISMS_BY_PERSONA: Record<AgentPersona, string[]> = {
  analyst: [
    'Need deeper OSINT integration with satellite imagery',
    'Missing classified-level threat indicators',
    'Want API access for custom dashboards',
    'Shock confidence levels feel arbitrary',
    'Entity graph needs temporal dimension',
  ],
  journalist: [
    'Need direct source links, not just summaries',
    'Missing press release tracking',
    'Want to export stories as drafts',
    'Coverage gap data should include timelines',
    'Need alert system for breaking stories',
  ],
  investor: [
    'Polymarket comparison should include Kalshi and Metaculus',
    'Missing commodity price correlation',
    'Want portfolio risk overlay',
    'Need historical accuracy tracking',
    'Sentiment analysis too coarse for trading',
  ],
  policy: [
    'Missing legislative tracking',
    'Need multi-language source support',
    'Want scenario planning tools',
    'Bias analysis needs methodology transparency',
    'Missing think tank report integration',
  ],
  student: [
    'Too much information, need guided mode',
    'Missing explanations for geopolitical context',
    'Want study/research export mode',
    'Need mobile-friendly version',
    'Loading too slow on university WiFi',
  ],
  techie: [
    'Want dark/light theme toggle',
    'Need keyboard shortcuts',
    'API documentation missing',
    'Want webhook notifications',
    'PWA support would be great',
  ],
  casual: [
    'Too overwhelming, need simpler view',
    'Want daily summary email instead',
    'Missing social share buttons',
    'Hebrew translation feels incomplete',
    'Need push notifications for shocks',
  ],
  activist: [
    'Bias analysis should include NGO reports',
    'Missing human rights violation tracking',
    'Want to compare coverage with UN reports',
    'Need community fact-check layer',
    'Coverage gap analysis should flag censorship',
  ],
};

const RETENTION_TRIGGERS: Record<AgentPersona, string[]> = {
  analyst: ['Track Record proves Signal accuracy', 'Daily threat brief at 07:00', 'Entity graph shows new connections'],
  journalist: ['Breaking story alerts', 'Coverage gap notifications', 'Source credibility updates'],
  investor: ['Signal vs Market delta alerts', 'Commodity impact predictions', 'Weekly accuracy report'],
  policy: ['Policy impact assessments', 'Cross-border narrative tracking', 'Scenario modeling updates'],
  student: ['Weekly learning digest', 'Exam-relevant topic alerts', 'Simplified daily brief'],
  techie: ['API changelog notifications', 'New feature releases', 'Data export improvements'],
  casual: ['Morning digest push notification', 'Shock alerts for followed topics', 'Weekly highlight summary'],
  activist: ['Human rights coverage alerts', 'Media bias shift notifications', 'International coverage gaps'],
};

const FAVORITE_FEATURES: Record<AgentPersona, string[]> = {
  analyst: ['Shock Detection', 'Entity Graph', 'Narrative Divergence'],
  journalist: ['Coverage Gaps', 'Live Feed', 'Source Bias Database'],
  investor: ['Signal vs Market', 'Likelihood Scoring', 'Shock Feed'],
  policy: ['Media Bias Spectrum', 'Geo Map', 'Narrative Divergence'],
  student: ['Daily Brief', 'Geo Map', 'Bias Distribution'],
  techie: ['Entity Graph', 'Signal vs Market', 'API Endpoints'],
  casual: ['Daily Brief', 'Shock Feed', 'Geo Map'],
  activist: ['Coverage Gaps', 'Narrative Divergence', 'Bias Spectrum'],
};

// ── Deterministic hash ──
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function pickN<T>(arr: T[], seed: number, n: number): T[] {
  const result: T[] = [];
  const used = new Set<number>();
  for (let i = 0; i < n && result.length < arr.length; i++) {
    let idx = (seed + i * 7) % arr.length;
    while (used.has(idx)) idx = (idx + 1) % arr.length;
    used.add(idx);
    result.push(arr[idx]);
  }
  return result;
}

/**
 * Generate 100 demo agents with deterministic but realistic profiles
 */
export function generateDemoAgents(): DemoAgent[] {
  const agents: DemoAgent[] = [];
  const now = new Date();

  const personas: AgentPersona[] = ['analyst', 'journalist', 'investor', 'policy', 'student', 'techie', 'casual', 'activist'];
  const locations: AgentLocation[] = ['tel-aviv', 'jerusalem', 'haifa', 'beer-sheva', 'new-york', 'london', 'washington', 'berlin', 'paris', 'dubai'];

  // Distribution: casual 25, analyst 15, investor 15, journalist 12, student 12, techie 10, policy 6, activist 5
  const personaDist: AgentPersona[] = [
    ...Array(25).fill('casual'),
    ...Array(15).fill('analyst'),
    ...Array(15).fill('investor'),
    ...Array(12).fill('journalist'),
    ...Array(12).fill('student'),
    ...Array(10).fill('techie'),
    ...Array(6).fill('policy'),
    ...Array(5).fill('activist'),
  ];

  for (let i = 0; i < 100; i++) {
    const seed = hash(`agent-${i}`);
    const persona = personaDist[i];
    const isIsraeli = i < 60; // 60% Israeli
    const location = isIsraeli
      ? pick(['tel-aviv', 'jerusalem', 'haifa', 'beer-sheva'] as AgentLocation[], seed)
      : pick(['new-york', 'london', 'washington', 'berlin', 'paris', 'dubai'] as AgentLocation[], seed + 3);

    const firstName = isIsraeli ? pick(HE_FIRST, seed + 1) : pick(EN_FIRST, seed + 1);
    const lastName = isIsraeli ? pick(HE_LAST, seed + 2) : pick(EN_LAST, seed + 2);
    const language = isIsraeli ? (seed % 3 === 0 ? 'both' : 'he') : (seed % 4 === 0 ? 'both' : 'en');

    const interests = pickN(TOPICS, seed + 5, 2 + (seed % 4));
    const sectionsUsed = pickN(SECTIONS, seed + 7, 2 + (seed % 4));

    // Engagement based on persona
    const baseEngagement: Record<AgentPersona, number> = {
      analyst: 78, journalist: 72, investor: 80, policy: 65,
      student: 55, techie: 70, casual: 40, activist: 62,
    };
    const engagement = Math.min(100, Math.max(10, baseEngagement[persona] + ((seed % 30) - 15)));

    // Session time based on persona
    const baseSession: Record<AgentPersona, number> = {
      analyst: 12, journalist: 8, investor: 6, policy: 10,
      student: 7, techie: 5, casual: 3, activist: 8,
    };
    const avgSession = Math.max(1, baseSession[persona] + ((seed % 6) - 3));

    // Visits per week
    const baseVisits: Record<AgentPersona, number> = {
      analyst: 12, journalist: 10, investor: 14, policy: 5,
      student: 4, techie: 6, casual: 2, activist: 5,
    };
    const sessionsPerWeek = Math.max(1, baseVisits[persona] + ((seed % 6) - 3));

    // Churn risk
    const churnRisk = engagement > 65 ? 'low' : engagement > 40 ? 'medium' : 'high';

    // Last visit: spread across last 7 days
    const daysAgo = seed % 7;
    const hoursAgo = seed % 24;
    const lastVisit = new Date(now.getTime() - daysAgo * 86400000 - hoursAgo * 3600000);

    // Total visits: proportional to engagement and time
    const totalVisits = Math.max(1, Math.round(sessionsPerWeek * 4 * (engagement / 100)));

    // Generate actions for their "last session"
    const actions = generateSessionActions(sectionsUsed, avgSession, seed, lastVisit);

    agents.push({
      id: i + 1,
      name: `${firstName} ${lastName}`,
      persona,
      location,
      language,
      interests,
      avgSessionMinutes: avgSession,
      sessionsPerWeek,
      sectionsVisited: sectionsUsed,
      favoriteFeature: pick(FAVORITE_FEATURES[persona], seed + 10),
      criticism: pick(CRITICISMS_BY_PERSONA[persona], seed + 11),
      retentionTrigger: pick(RETENTION_TRIGGERS[persona], seed + 12),
      engagementScore: engagement,
      churnRisk,
      lastVisit: lastVisit.toISOString(),
      totalVisits,
      actions,
    });
  }

  return agents;
}

function generateSessionActions(sections: string[], avgMinutes: number, seed: number, baseTime: Date): AgentAction[] {
  const actions: AgentAction[] = [];
  const actionTypes: AgentAction['type'][] = ['view', 'click', 'expand', 'scroll', 'tab-switch', 'bookmark', 'share'];
  let elapsed = 0;
  const totalSeconds = avgMinutes * 60;
  let actionIndex = 0;

  while (elapsed < totalSeconds && actionIndex < 20) {
    const section = pick(sections, seed + actionIndex * 3);
    const type = pick(actionTypes, seed + actionIndex * 7);
    const duration = 10 + ((seed + actionIndex * 11) % 60);
    const ts = new Date(baseTime.getTime() + elapsed * 1000);

    actions.push({
      type,
      section,
      timestamp: ts.toISOString(),
      durationSeconds: duration,
    });

    elapsed += duration;
    actionIndex++;
  }

  return actions;
}

/**
 * Calculate aggregate engagement metrics from agents
 */
export function calculateEngagementMetrics(agents: DemoAgent[]): EngagementMetrics {
  const now = new Date();
  const todayCutoff = new Date(now.getTime() - 24 * 3600000);

  const activeToday = agents.filter(a => new Date(a.lastVisit) >= todayCutoff).length;
  const avgSession = agents.reduce((s, a) => s + a.avgSessionMinutes, 0) / agents.length;
  const bounceRate = agents.filter(a => a.avgSessionMinutes < 1).length / agents.length * 100;
  const returnRate = agents.filter(a => a.totalVisits >= 2).length / agents.length * 100;

  // Top sections
  const sectionCounts = new Map<string, { views: number; totalDwell: number }>();
  for (const agent of agents) {
    for (const action of agent.actions) {
      if (!sectionCounts.has(action.section)) {
        sectionCounts.set(action.section, { views: 0, totalDwell: 0 });
      }
      const s = sectionCounts.get(action.section)!;
      s.views++;
      s.totalDwell += action.durationSeconds;
    }
  }
  const topSections = Array.from(sectionCounts.entries())
    .map(([section, d]) => ({ section, views: d.views, avgDwell: Math.round(d.totalDwell / d.views) }))
    .sort((a, b) => b.views - a.views);

  // Top criticisms
  const criticismCounts = new Map<string, number>();
  for (const a of agents) {
    criticismCounts.set(a.criticism, (criticismCounts.get(a.criticism) || 0) + 1);
  }
  const topCriticisms = Array.from(criticismCounts.entries())
    .map(([text, count]) => ({
      text,
      count,
      severity: (count > 10 ? 'high' : count > 5 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Retention drivers
  const retentionCounts = new Map<string, number>();
  for (const a of agents) {
    retentionCounts.set(a.retentionTrigger, (retentionCounts.get(a.retentionTrigger) || 0) + 1);
  }
  const retentionDrivers = Array.from(retentionCounts.entries())
    .map(([driver, count]) => ({ driver, count, impact: Math.round(count * 1.5) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Churn distribution
  const churnDistribution = {
    low: agents.filter(a => a.churnRisk === 'low').length,
    medium: agents.filter(a => a.churnRisk === 'medium').length,
    high: agents.filter(a => a.churnRisk === 'high').length,
  };

  // Persona breakdown
  const personaMap = new Map<AgentPersona, { count: number; totalEng: number }>();
  for (const a of agents) {
    if (!personaMap.has(a.persona)) personaMap.set(a.persona, { count: 0, totalEng: 0 });
    const p = personaMap.get(a.persona)!;
    p.count++;
    p.totalEng += a.engagementScore;
  }
  const personaBreakdown = Array.from(personaMap.entries())
    .map(([persona, d]) => ({ persona, count: d.count, avgEngagement: Math.round(d.totalEng / d.count) }))
    .sort((a, b) => b.count - a.count);

  // Hourly traffic (simulated bell curve peaking at 9am and 8pm Israel time)
  const hourlyTraffic = Array.from({ length: 24 }, (_, h) => {
    const morningPeak = Math.exp(-Math.pow(h - 9, 2) / 8);
    const eveningPeak = Math.exp(-Math.pow(h - 20, 2) / 6);
    const visitors = Math.round((morningPeak + eveningPeak) * 40 + 5);
    return { hour: h, visitors };
  });

  // Feature requests (derived from criticisms and retention triggers)
  const featureRequests = [
    { feature: 'Push Notifications / Alerts', votes: 34, priority: 'p0' as const },
    { feature: 'Track Record / Accuracy Dashboard', votes: 28, priority: 'p0' as const },
    { feature: 'Personal Watchlist', votes: 25, priority: 'p0' as const },
    { feature: 'Daily Email Digest', votes: 22, priority: 'p1' as const },
    { feature: 'Mobile PWA', votes: 19, priority: 'p1' as const },
    { feature: 'API Access', votes: 15, priority: 'p1' as const },
    { feature: 'Dark/Light Theme Toggle', votes: 12, priority: 'p2' as const },
    { feature: 'Export to PDF/CSV', votes: 11, priority: 'p2' as const },
    { feature: 'Keyboard Shortcuts', votes: 8, priority: 'p2' as const },
    { feature: 'Multi-language Sources', votes: 7, priority: 'p2' as const },
  ];

  return {
    totalAgents: agents.length,
    activeToday,
    avgSessionMinutes: Math.round(avgSession * 10) / 10,
    bounceRate: Math.round(bounceRate * 10) / 10,
    returnRate: Math.round(returnRate * 10) / 10,
    topSections,
    topCriticisms,
    retentionDrivers,
    churnDistribution,
    personaBreakdown,
    hourlyTraffic,
    featureRequests,
  };
}
