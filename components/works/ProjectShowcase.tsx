"use client";

import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { projects } from "@/lib/projects";
import { TransitionLink } from "@/components/PageTransition";
import { useReveal } from "@/lib/useReveal";
import styles from "./ProjectShowcase.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const TOTAL = String(projects.length).padStart(2, "0");

/**
 * Fullscreen, one-project-at-a-time showcase (Camille-style).
 * Each viewport-height section is a door into its case study.
 */
export default function ProjectShowcase() {
  const scope = useReveal<HTMLElement>();

  // Slow parallax drift on each cover as it passes through the viewport.
  useGSAP(
    () => {
      gsap
        .utils.toArray<HTMLElement>("[data-showcase-section]")
        .forEach((section) => {
          const media = section.querySelector("[data-showcase-media]");
          if (!media) return;
          gsap.fromTo(
            media,
            { yPercent: -8 },
            {
              yPercent: 8,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });
    },
    { scope }
  );

  return (
    <main ref={scope} className={styles.showcase}>
      <header className={styles.intro}>
        <p data-reveal className={`monoLabel ${styles.introLabel}`}>
          Selected Works — 2024–2026
        </p>
        <h1 data-reveal data-reveal-delay="0.1" className={styles.introTitle}>
          Product designer crafting quiet, considered experiences.
        </h1>
        <p data-reveal data-reveal-delay="0.2" className="monoLabel">
          Scroll
        </p>
      </header>

      {projects.map((project, i) => (
        <section
          key={project.slug}
          data-showcase-section
          className={styles.section}
        >
          <TransitionLink
            href={`/works/${project.slug}`}
            className={styles.link}
            aria-label={`${project.title} — view case study`}
          >
            <div className={styles.media}>
              <div data-showcase-media className={styles.mediaInner}>
                <Image
                  src={project.cover}
                  alt={project.title}
                  fill
                  sizes="100vw"
                  priority={i === 0}
                />
              </div>
            </div>

            <div className={styles.meta}>
              <p data-reveal className="monoLabel">
                {String(i + 1).padStart(2, "0")} / {TOTAL} — {project.year}
              </p>
              <h2 data-reveal data-reveal-delay="0.08" className={styles.title}>
                {project.title}
              </h2>
              <p data-reveal data-reveal-delay="0.16" className="monoLabel">
                {project.role}
              </p>
            </div>
          </TransitionLink>
        </section>
      ))}
    </main>
  );
}
