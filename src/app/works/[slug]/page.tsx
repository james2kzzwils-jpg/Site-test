import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import en from '@/i18n/en.json';
import ProjectDetail from '@/components/ProjectDetail';
import JsonLd from '@/components/JsonLd';
import { absUrl, breadcrumbLd, creativeWorkLd, projectUrl } from '@/lib/seo';

export function generateStaticParams() {
  return en.works.projects.map((p) => ({ slug: p.id }));
}

export const dynamicParams = false;

function getProject(slug: string) {
  return en.works.projects.find((p) => p.id === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  const title = `${project.title}${project.client ? ` — ${project.client}` : ''}`;
  const description = project.description?.slice(0, 300) || undefined;
  const url = projectUrl(slug);
  const image = absUrl(project.cover);

  return {
    title: project.title,
    description,
    keywords: project.tags,
    alternates: { canonical: `/works/${slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      images: [{ url: image, alt: project.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <>
      <JsonLd data={[creativeWorkLd(project), breadcrumbLd(project)]} />
      <ProjectDetail slug={slug} />
    </>
  );
}
