"use client";

import Image from "next/image";
import type { Project } from "@/lib/projects";
import { TransitionLink } from "@/components/PageTransition";
import { useReveal } from "@/lib/useReveal";
import styles from "./CaseStudy.module.css";

export default function CaseStudy({
  project,
  next,
}: {
  project: Project;
  next: Project;
}) {
  const scope = useReveal<HTMLElement>();

  return (
    <main ref={scope} className="pageWrap">
      <header className={styles.header}>
        <p data-reveal className="monoLabel">
          {project.client} — {project.year}
        </p>
        <h1 data-reveal data-reveal-delay="0.08" className={styles.title}>
          {project.title}
        </h1>
        <div data-reveal data-reveal-delay="0.16" className={styles.details}>
          <p className={styles.summary}>{project.summary}</p>
          <p className="monoLabel">{project.role}</p>
        </div>
      </header>

      <div data-reveal className={styles.hero}>
        <Image
          src={project.cover}
          alt={project.title}
          fill
          sizes="100vw"
          priority
        />
      </div>

      <section className={styles.images}>
        {project.images.map((src, i) => (
          <figure key={src} data-reveal className={styles.figure}>
            <Image
              src={src}
              alt={`${project.title} — image ${i + 1}`}
              fill
              sizes="(max-width: 1099px) 100vw, 80vw"
            />
          </figure>
        ))}
      </section>

      <footer className={styles.next}>
        <hr className="hairline" />
        <TransitionLink
          href={`/works/${next.slug}`}
          className={styles.nextLink}
        >
          <span className="monoLabel">Next project</span>
          <span className={styles.nextTitle}>{next.title}</span>
        </TransitionLink>
      </footer>
    </main>
  );
}
