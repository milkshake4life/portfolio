"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import type { Project } from "@/lib/projects";
import { getPrototypeWell } from "@/lib/projects";
import type { ProjectScreen } from "@/lib/gallery";
import styles from "./TrayStage.module.css";

/**
 * A project screenshot standing in a tray drawn as a line diagram: back and
 * side rims, floor, corner connectors, then a front wall filled with the page
 * background so it occludes the screenshot's base. Nothing is shaded or
 * rendered — it is the same hairline language as the rest of the site.
 *
 * The screenshot itself is only ever scaled, never tilted or cropped. Several
 * screenshots stand in one tray, side by side, bases aligned.
 *
 * Every length is a container unit, so the whole composition keeps its
 * proportions from a strip card up to the fullscreen view. The serving
 * layout drops the shelf so the product can leave it and sit on its own.
 * After the split, a looping screen recording can sit in the device well.
 */
export default function TrayStage({
  screens,
  alt,
  sizes,
  priority = false,
  card = null,
  shelf = true,
  project,
  live = false,
  playing = false,
  preload = "none",
}: {
  screens: ProjectScreen[];
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Paper profile card standing on the tray, in front of the screenshot. */
  card?: ReactNode;
  /** When false, only the screenshot remains — used after the tray recedes. */
  shelf?: boolean;
  project?: Project;
  /** Mount the prototype video. Strip cards stay still. */
  live?: boolean;
  /** Fade the video in and let the parent start playback. */
  playing?: boolean;
  preload?: "none" | "metadata" | "auto";
}) {
  const well = live && project ? getPrototypeWell(project) : null;
  const prototypeSrc = well ? project?.prototype?.src : undefined;

  const screenRow = (
    <div className={styles.screens} data-tray-screens>
      {screens.map((screen, i) => (
        <div
          key={screen.src}
          className={styles.device}
          style={
            {
              "--ratio": screen.width / screen.height,
              "--fit": screen.trayFit ?? 1,
            } as CSSProperties
          }
        >
          <Image
            className={styles.screen}
            src={screen.src}
            alt={i === 0 ? alt : ""}
            width={screen.width}
            height={screen.height}
            sizes={sizes}
            priority={priority}
            draggable={false}
            unoptimized
          />
          {well && prototypeSrc && i === 0 ? (
            <video
              className={styles.prototype}
              data-prototype-video
              data-active={playing ? "" : undefined}
              muted
              loop
              playsInline
              preload={preload}
              aria-hidden="true"
              style={
                {
                  "--well-x": `${well.screen.x}%`,
                  "--well-y": `${well.screen.y}%`,
                  "--well-w": `${well.screen.w}%`,
                  "--well-h": `${well.screen.h}%`,
                  "--well-radius": well.radius,
                } as CSSProperties
              }
              onCanPlay={(e) => {
                e.currentTarget.dataset.ready = "";
              }}
              onError={(e) => {
                e.currentTarget.dataset.failed = "";
              }}
            >
              <source src={prototypeSrc} type="video/mp4" />
            </video>
          ) : null}
        </div>
      ))}
    </div>
  );

  if (!shelf) {
    return (
      <div
        className={`${styles.stage} ${styles.stageServing}`}
        style={{ "--slots": screens.length } as CSSProperties}
      >
        {screenRow}
      </div>
    );
  }

  return (
    <div
      className={styles.stage}
      style={{ "--slots": screens.length } as CSSProperties}
    >
      <div className={styles.tray}>
        <svg
          data-tray
          className={styles.lines}
          viewBox="0 0 420 120"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        >
          {/* back rim, side rims, floor, corner connectors */}
          <path d="M20 8 H400" />
          <path d="M20 8 L6 96 M400 8 L414 96" />
          <path d="M32 19 H388 L400 84 H20 Z" />
          <path d="M20 8 L32 19 M400 8 L388 19 M414 96 L400 84 M6 96 L20 84" />
        </svg>

        {screenRow}

        {card ? (
          <div className={styles.mini} data-tray-card>
            {card}
          </div>
        ) : null}

        <svg
          data-tray
          className={`${styles.lines} ${styles.front}`}
          viewBox="0 0 420 120"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        >
          {/* front wall — opaque, so the screenshot stands inside the tray */}
          <path d="M6 96 H414 L411 114 H9 Z" />
        </svg>
      </div>
    </div>
  );
}
