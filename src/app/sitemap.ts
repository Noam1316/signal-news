import type { MetadataRoute } from 'next';

const BASE = 'https://signal-news-noam1316s-projects.vercel.app';

// Known story slugs — dynamic stories also generate slugs from topics
const STORY_SLUGS = [
  'iran-nuclear',
  'gaza-conflict',
  'lebanon-hezbollah',
  'saudi-normalization',
  'us-politics',
  'west-bank',
  'syria',
  'economy',
  'technology',
  'climate',
  'ukraine-russia',
  'judicial-reform',
  'security',
  'diplomacy',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE}/brief`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${BASE}/shocks`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${BASE}/intel`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE}/explore`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.7,
    },
  ];

  // Story detail pages
  const storyPages: MetadataRoute.Sitemap = STORY_SLUGS.map(slug => ({
    url: `${BASE}/story/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...storyPages];
}
