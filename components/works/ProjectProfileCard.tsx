"use client";

import Image from "next/image";
import type { Project } from "@/lib/projects";
import { getCardMeta } from "@/lib/projects";
import styles from "./ProjectProfileCard.module.css";

type Mode = "drink" | "profile";

/**
 * Cafe serving in two beats:
 * 1. drink — hero photo previewed from the menu
 * 2. profile — drink slides aside; paper card accompanies
 */
export default function ProjectProfileCard({
  project,
  mode,
}: {
  project: Project;
  mode: Mode;
}) {
  const { number, eyebrow, collection } = getCardMeta(project);
  const story = project.story ?? project.summary;
  const notes = project.notes;
  const profile = project.profile === "" ? "" : (project.profile ?? "Case Study");
  const isProfile = mode === "profile";
  const [drinkW, drinkH] = (project.heroAspectRatio ?? "831 / 864")
    .split("/")
    .map((part) => part.trim());
  const isWide = Number(drinkW) / Number(drinkH) > 1.15;
  const drinkScale = project.heroScale ?? 1;
  const cardTitle = project.cardTitle ?? project.title;
  const titleClass = project.cardTitleCompact
    ? cardTitle.replace(/\s/g, "").length >= 11
      ? styles.titleTight
      : styles.titleCompact
    : "";

  return (
    <div
      className={`${styles.serving} ${isProfile ? styles.isProfile : styles.isDrink}`}
      data-serving
      style={
        {
          "--drink-w": drinkW,
          "--drink-h": drinkH,
          "--drink-scale": String(drinkScale),
        } as React.CSSProperties
      }
    >
      <div className={styles.drinkBlock} data-drink-block>
        <div
          className={`${styles.drink} ${isWide ? styles.drinkWide : ""}`}
          data-drink
          {...(isWide ? { "data-drink-wide": true } : {})}
        >
          <Image
            src={project.cover}
            alt=""
            fill
            sizes="(max-width: 1099px) 90vw, (max-width: 1439px) 48vw, 50vw"
            priority
            unoptimized={project.cover.endsWith(".png")}
            className={styles.drinkImg}
          />
        </div>
      </div>

      <article
        className={styles.card}
        data-profile-card
        aria-hidden={!isProfile}
        inert={!isProfile ? true : undefined}
      >
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <span className={`${styles.eyebrow} ${styles.eyebrowRight}`}>
            Ethan G.R. Lee
          </span>
        </div>

        <h2 className={`${styles.title} ${titleClass}`}>{cardTitle}</h2>
        <div className={styles.titleRule} aria-hidden="true" />

        <div className={styles.specs}>
          <div className={styles.specRow}>
            <span className={styles.specLabel}>Role</span>
            <span className={styles.specValue}>{project.role}</span>
          </div>
          {profile ? (
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Profile</span>
              <span className={styles.specValue}>{profile}</span>
            </div>
          ) : null}
          {notes ? (
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Notes</span>
              <span
                className={`${styles.specValue} ${styles.notesValue} ${
                  project.notesCompact ? styles.notesCompact : ""
                }`}
              >
                {notes}
              </span>
            </div>
          ) : null}
          {project.recognition ? (
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Recognition</span>
              <span className={`${styles.specValue} ${styles.award}`}>
                {project.recognition}
              </span>
            </div>
          ) : null}
        </div>

        <div className={styles.story}>
          <p className={styles.storyLabel}>The Story</p>
          <p className={styles.storyBody}>{story}</p>
        </div>

        <footer className={styles.footerRow}>
          <span>
            {number} / {collection}
          </span>
          <span>{project.client}</span>
        </footer>
      </article>
    </div>
  );
}
