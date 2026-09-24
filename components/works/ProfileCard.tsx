import type { Project } from "@/lib/projects";
import { getCardMeta } from "@/lib/projects";
import styles from "./ProfileCard.module.css";

/**
 * The paper case-study card. Renders at its designed size; a parent may
 * scale it down to stand on a tray.
 */
export default function ProfileCard({ project }: { project: Project }) {
  const { number, eyebrow, collection } = getCardMeta(project);
  const story = project.story ?? project.summary;
  const notes = project.notes;
  const profile =
    project.profile === "" ? "" : (project.profile ?? "Case Study");
  const cardTitle = project.cardTitle ?? project.title;
  const titleClass = project.cardTitleCompact
    ? cardTitle.replace(/\s/g, "").length >= 11
      ? styles.titleTight
      : styles.titleCompact
    : "";

  return (
    <article className={styles.card} data-profile-card>
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
  );
}
