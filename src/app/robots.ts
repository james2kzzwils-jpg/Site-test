import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// NOTE: Cloudflare's "Managed robots.txt" can override this at the edge.
// This file is the application source-of-truth: it allows search engines and
// citation/answer AI crawlers, blocks AI *training* crawlers, and keeps the
// private client portal out of every index.
export default function robots(): MetadataRoute.Robots {
  const trainingBots = [
    'GPTBot',
    'CCBot',
    'Bytespider',
    'Amazonbot',
    'Applebot-Extended',
    'meta-externalagent',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/portal/', '/api/'],
      },
      // AI answer / citation crawlers — explicitly allowed (no training use).
      {
        userAgent: ['OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended'],
        allow: '/',
        disallow: ['/portal/', '/api/'],
      },
      // AI training crawlers — blocked to honour "citation without training".
      {
        userAgent: trainingBots,
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
