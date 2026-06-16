import en from '@/i18n/en.json';
import { SITE_URL } from '@/lib/seo';

// Serves /llms.txt — a curated, AI-friendly summary of the site so language
// models can quickly understand and cite who Andrey Epov is, the services,
// the work, and the answers to common buyer questions.
export const dynamic = 'force-static';

export function GET() {
  const lines: string[] = [];

  lines.push('# Epov Creative Labs');
  lines.push('');
  lines.push(
    '> Andrey Epov — 3D Motion Designer & CG Generalist based in Moscow. Procedural animation in Houdini, product visualization, fluid and cloth simulation, and pipeline automation for brands and studios.',
  );
  lines.push('');
  lines.push(`Website: ${SITE_URL}`);
  lines.push('Languages: English, Russian');
  lines.push('');

  lines.push('## Services');
  for (const s of en.services.items) {
    const price = (s as { price?: string }).price ? ` (${(s as { price?: string }).price})` : '';
    lines.push(`- **${s.title}**${price}: ${s.description}`);
  }
  lines.push('');

  lines.push('## Selected Works');
  for (const p of en.works.projects) {
    const client = p.client ? ` — ${p.client}` : '';
    lines.push(`- [${p.title}${client}](${SITE_URL}/works/${p.id}): ${p.description}`);
  }
  lines.push('');

  lines.push('## FAQ');
  for (const f of en.faq.items) {
    lines.push(`### ${f.q}`);
    lines.push(f.a);
    lines.push('');
  }

  lines.push('## Contact');
  lines.push(`- Email: ${en.contact.info.email}`);
  lines.push(`- Telegram: ${en.contact.info.telegram}`);
  lines.push(`- Book a call: ${en.contact.info.calendly}`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
