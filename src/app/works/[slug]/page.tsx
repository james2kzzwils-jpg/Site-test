import { notFound } from 'next/navigation';
import en from '@/i18n/en.json';
import ProjectDetail from '@/components/ProjectDetail';

export function generateStaticParams() {
  return en.works.projects.map((p) => ({ slug: p.id }));
}

export const dynamicParams = false;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exists = en.works.projects.some((p) => p.id === slug);
  if (!exists) notFound();
  return <ProjectDetail slug={slug} />;
}
