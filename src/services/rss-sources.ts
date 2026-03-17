export interface RssSource {
  id: string;
  name: string;
  url: string;
  language: 'he' | 'en' | 'ar';
  lensCategory: 'il-mainstream' | 'il-partisan' | 'international';
  country: string;
}

export const rssSources: RssSource[] = [
  // Israeli Mainstream
  { id: 'ynet', name: 'Ynet', url: 'https://www.ynet.co.il/Integration/StoryRss2.xml', language: 'he', lensCategory: 'il-mainstream', country: 'IL' },
  { id: 'mako', name: 'Mako/N12', url: 'https://rcs.mako.co.il/rss/31750a2610f26110VgnVCM1000004801000aRCRD.xml', language: 'he', lensCategory: 'il-mainstream', country: 'IL' },
  { id: 'kan', name: 'Kan News', url: 'https://www.kan.org.il/Rss/', language: 'he', lensCategory: 'il-mainstream', country: 'IL' },

  // Israeli Partisan
  { id: 'israelhayom', name: 'Israel Hayom', url: 'https://www.israelhayom.co.il/rss', language: 'he', lensCategory: 'il-partisan', country: 'IL' },
  { id: 'haaretz', name: 'Haaretz', url: 'https://www.haaretz.co.il/cmlink/1.1617539', language: 'he', lensCategory: 'il-partisan', country: 'IL' },

  // International
  { id: 'reuters-world', name: 'Reuters World', url: 'https://feeds.reuters.com/reuters/worldNews', language: 'en', lensCategory: 'international', country: 'US' },
  { id: 'bbc-mideast', name: 'BBC Middle East', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', language: 'en', lensCategory: 'international', country: 'UK' },
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', language: 'en', lensCategory: 'international', country: 'QA' },
  { id: 'almonitor', name: 'Al-Monitor', url: 'https://www.al-monitor.com/rss', language: 'en', lensCategory: 'international', country: 'US' },
];
