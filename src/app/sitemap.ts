import type { MetadataRoute } from 'next';
import en from '@/i18n/en.json';
import { SITE_URL } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const home: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];

  const works: MetadataRoute.Sitemap = en.works.projects.map((p) => ({
    url: `${SITE_URL}/works/${p.id}`,
    lastModified: p.published_at ? new Date(`${p.published_at}-01`) : now,
    changeFrequency: 'yearly',
    priority: 0.8,
  }));

  return [...home, ...works];
}
