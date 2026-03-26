export interface RssSource {
  id: string;
  name: string;
  url: string;
  language: 'he' | 'en' | 'ar';
  lensCategory: 'il-mainstream' | 'il-partisan' | 'international';
  country: string;
}

export const rssSources: RssSource[] = [
  // ── Israeli Mainstream ──
  { id: 'ynet', name: 'Ynet', url: 'https://www.ynet.co.il/Integration/StoryRss2.xml', language: 'he', lensCategory: 'il-mainstream', country: 'IL' },
  { id: 'ynet-en', name: 'Ynet News (EN)', url: 'https://www.ynetnews.com/Integration/StoryRss2.xml', language: 'en', lensCategory: 'il-mainstream', country: 'IL' },
  { id: 'walla', name: 'Walla! News', url: 'https://rss.walla.co.il/feed/1', language: 'he', lensCategory: 'il-mainstream', country: 'IL' },
  { id: 'globes', name: 'Globes', url: 'https://www.globes.co.il/webservice/rss/rssfeeder.asmx/FeederNode?iID=2', language: 'he', lensCategory: 'il-mainstream', country: 'IL' },

  // ── Israeli Partisan / Opinion-leaning ──
  { id: 'israelhayom', name: 'Israel Hayom', url: 'https://www.israelhayom.co.il/rss', language: 'he', lensCategory: 'il-partisan', country: 'IL' },
  { id: 'haaretz', name: 'Haaretz', url: 'https://www.haaretz.co.il/cmlink/1.1617539', language: 'he', lensCategory: 'il-partisan', country: 'IL' },
  { id: 'haaretz-en', name: 'Haaretz (EN)', url: 'https://www.haaretz.com/cmlink/1.4614869', language: 'en', lensCategory: 'il-partisan', country: 'IL' },
  { id: 'inn', name: 'Arutz Sheva', url: 'https://www.israelnationalnews.com/Rss.aspx', language: 'en', lensCategory: 'il-partisan', country: 'IL' },
  { id: 'timesofisrael', name: 'Times of Israel', url: 'https://www.timesofisrael.com/feed/', language: 'en', lensCategory: 'il-partisan', country: 'IL' },
  { id: 'jpost', name: 'Jerusalem Post', url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx', language: 'en', lensCategory: 'il-partisan', country: 'IL' },
  { id: 'i24news', name: 'i24NEWS', url: 'https://www.i24news.tv/en/rss', language: 'en', lensCategory: 'il-partisan', country: 'IL' },
  { id: 'channel14', name: 'Now 14 (EN)', url: 'https://www.now14.co.il/feed/', language: 'he', lensCategory: 'il-partisan', country: 'IL' },

  // ── International – Major Wire Services ──
  { id: 'bbc-mideast', name: 'BBC Middle East', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', language: 'en', lensCategory: 'international', country: 'UK' },
  { id: 'bbc-world', name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', language: 'en', lensCategory: 'international', country: 'UK' },
  { id: 'guardian-world', name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', language: 'en', lensCategory: 'international', country: 'UK' },
  { id: 'nyt-world', name: 'NY Times World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', language: 'en', lensCategory: 'international', country: 'US' },
  { id: 'nyt-mideast', name: 'NY Times Middle East', url: 'https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml', language: 'en', lensCategory: 'international', country: 'US' },
  { id: 'cnn-world', name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss', language: 'en', lensCategory: 'international', country: 'US' },
  { id: 'cnn-mideast', name: 'CNN Middle East', url: 'http://rss.cnn.com/rss/edition_meast.rss', language: 'en', lensCategory: 'international', country: 'US' },
  { id: 'france24', name: 'France 24', url: 'https://www.france24.com/en/middle-east/rss', language: 'en', lensCategory: 'international', country: 'FR' },
  { id: 'dw', name: 'Deutsche Welle', url: 'https://rss.dw.com/rdf/rss-en-world', language: 'en', lensCategory: 'international', country: 'DE' },
  { id: 'sky-world', name: 'Sky News World', url: 'https://feeds.skynews.com/feeds/rss/world.xml', language: 'en', lensCategory: 'international', country: 'UK' },

  // ── International – Middle East Focused ──
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', language: 'en', lensCategory: 'international', country: 'QA' },
  { id: 'almonitor', name: 'Al-Monitor', url: 'https://www.al-monitor.com/rss', language: 'en', lensCategory: 'international', country: 'US' },
  { id: 'middleeasteye', name: 'Middle East Eye', url: 'https://www.middleeasteye.net/rss', language: 'en', lensCategory: 'international', country: 'UK' },
  { id: 'thenational', name: 'The National (UAE)', url: 'https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml', language: 'en', lensCategory: 'international', country: 'AE' },
  { id: 'arabnews', name: 'Arab News', url: 'https://www.arabnews.com/rss.xml', language: 'en', lensCategory: 'international', country: 'SA' },

  // ── International – Analysis / Think Tanks ──
  { id: 'foreignpolicy', name: 'Foreign Policy', url: 'https://foreignpolicy.com/feed/', language: 'en', lensCategory: 'international', country: 'US' },
  { id: 'economist', name: 'The Economist', url: 'https://www.economist.com/middle-east-and-africa/rss.xml', language: 'en', lensCategory: 'international', country: 'UK' },
];
