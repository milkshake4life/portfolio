import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CaseStudy from "@/components/works/CaseStudy";
import { getNextProject, getProject, projects } from "@/lib/projects";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.title} — Ethan G.R. Lee`,
    description: project.summary,
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return <CaseStudy project={project} next={getNextProject(slug)} />;
}
