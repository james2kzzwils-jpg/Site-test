// Centralized SEO / GEO (Generative Engine Optimization) constants and
// structured-data (JSON-LD) builders. Used by metadata, sitemap, robots
// and the JsonLd component so AI engines can discover, parse and cite the site.

import en from '@/i18n/en.json';

export const SITE_URL = 'https://aepovcg.pro';
export const SITE_NAME = "Epov Creative Lab's";
export const PERSON_NAME = 'Andrey Epov';
export const SITE_TAGLINE = '3D Motion Designer & CG Generalist';
export const SITE_DESCRIPTION =
  'Epov Creative Labs — 3D Motion Designer and CG Generalist. Procedural animation in Houdini, product visualization, simulations and pipeline tools for brands and studios.';

export const SAME_AS = [
  'https://www.behance.net/2kzz',
  'https://www.instagram.com/2kzz___/',
  'https://www.linkedin.com/in/andrey-epov-cg',
  'https://t.me/aepov_2kzz',
];

export const CONTACT_EMAIL = 'cggeneralistandrey@gmail.com';

export function absUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

type Project = (typeof en)['works']['projects'][number];

export function projectUrl(slug: string): string {
  return `${SITE_URL}/works/${slug}`;
}

// --- JSON-LD builders -------------------------------------------------------

export function personLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: PERSON_NAME,
    alternateName: SITE_NAME,
    url: SITE_URL,
    jobTitle: ['3D Motion Designer', 'CG Generalist', 'Houdini FX Artist'],
    description: SITE_DESCRIPTION,
    email: `mailto:${CONTACT_EMAIL}`,
    knowsAbout: [
      '3D Motion Design',
      'Procedural Animation',
      'Houdini FX',
      'Product Visualization',
      'Fluid and Cloth Simulation',
      'Pipeline Automation',
      'Blender',
      'Unreal Engine',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Moscow',
      addressCountry: 'RU',
    },
    sameAs: SAME_AS,
  };
}

export function professionalServiceLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE_URL}/#business`,
    name: SITE_NAME,
    url: SITE_URL,
    image: absUrl('/works/cosmos/cover.webp'),
    description: SITE_DESCRIPTION,
    founder: { '@id': `${SITE_URL}/#person` },
    priceRange: '$$',
    areaServed: 'Worldwide',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Moscow',
      addressCountry: 'RU',
    },
    sameAs: SAME_AS,
    knowsLanguage: ['en', 'ru'],
    makesOffer: en.services.items.map((s: { title: string; description: string }) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: s.title,
        description: s.description,
      },
    })),
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: ['en', 'ru'],
    publisher: { '@id': `${SITE_URL}/#person` },
  };
}

export function creativeWorkLd(project: Project) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${projectUrl(project.id)}#work`,
    name: project.title,
    headline: project.title,
    url: projectUrl(project.id),
    image: absUrl(project.cover),
    description: project.description,
    genre: project.category,
    keywords: (project.tags || []).join(', '),
    creator: { '@id': `${SITE_URL}/#person` },
    ...(project.client ? { sourceOrganization: { '@type': 'Organization', name: project.client } } : {}),
    ...(project.year ? { dateCreated: project.year } : {}),
  };
}

export function breadcrumbLd(project: Project) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Works', item: `${SITE_URL}/#works` },
      { '@type': 'ListItem', position: 3, name: project.title, item: projectUrl(project.id) },
    ],
  };
}

type FaqItem = { q: string; a: string };

export function faqLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}
