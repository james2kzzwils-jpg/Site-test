import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// NOTE: Cloudflare's "Managed robots.txt" can override this at the edge.
// This file is the application source-of-truth: it allows search engines and
// citation/answer AI crawlers, blocks AI *training* crawlers, and keeps the
// private client portal out of every index.
export default function robots(): MetadataRoute.Robots {
  // Crawlers allowed to index everything except the technical folders.
  // Each agent gets its own explicit group (Allow/Disallow repeated) so the
  // file is unambiguous and robust when merged with Cloudflare's managed block.
  const allowedAgents = [
    '*',
    'OAI-SearchBot',
    'PerplexityBot',
    'ClaudeBot',
    'Google-Extended',
  ];

  // AI training crawlers — blocked to honour "citation without training".
  const blockedAgents = [
    'GPTBot',
    'CCBot',
    'Bytespider',
    'Amazonbot',
    'Applebot-Extended',
    'meta-externalagent',
  ];

  return {
    rules: [
      ...allowedAgents.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/portal/', '/api/'],
      })),
      ...blockedAgents.map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
