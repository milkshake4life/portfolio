"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { WELCOME } from "@/lib/motion";
import styles from "./Preloader.module.css";

gsap.registerPlugin(useGSAP);

const LINES = [
  "Ethan G.R. Lee",
  "I love Design, Coffee & Tea",
  "Explore my passions through this website",
] as const;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Apple-style welcome sequence — three soft centered phrases
 * on each full page load. Click or Escape skips.
 */
export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const finishingRef = useRef(false);
  const [hidden, setHidden] = useState(false);

  const finish = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    document.body.style.overflow = "";
    setHidden(true);
  }, []);

  const skip = useCallback(() => {
    if (finishingRef.current) return;
    timelineRef.current?.kill();
    const root = rootRef.current;
    if (!root) {
      finish();
      return;
    }
    gsap.to(root, {
      opacity: 0,
      duration: 0.28,
      ease: "power2.out",
      overwrite: true,
      onComplete: finish,
    });
  }, [finish]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        finish();
        return;
      }

      document.body.style.overflow = "hidden";

      const lines = gsap.utils.toArray<HTMLElement>("[data-welcome-line]");
      const hint = hintRef.current;
      const tl = gsap.timeline({ onComplete: finish });
      timelineRef.current = tl;

      gsap.set(lines, {
        opacity: 0,
        scale: 0.985,
        filter: "blur(10px)",
      });
      if (hint) gsap.set(hint, { opacity: 0 });

      if (hint) {
        tl.to(
          hint,
          { opacity: 1, duration: WELCOME.fadeIn, ease: WELCOME.ease },
          0.2
        );
      }

      lines.forEach((line, i) => {
        const isLast = i === lines.length - 1;

        tl.to(
          line,
          {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: WELCOME.fadeIn,
            ease: WELCOME.ease,
          },
          i === 0 ? 0 : ">"
        )
          .to(line, {
            opacity: 0,
            scale: 1.01,
            filter: "blur(8px)",
            duration: WELCOME.fadeOut,
            ease: WELCOME.ease,
            delay: WELCOME.hold,
          })
          .to({}, { duration: isLast ? 0 : WELCOME.gap });
      });

      tl.to(rootRef.current, {
        opacity: 0,
        duration: WELCOME.exit,
        ease: WELCOME.ease,
      });
    },
    { scope: rootRef, dependencies: [finish] }
  );

  useEffect(() => {
    if (hidden) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        skip();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hidden, skip]);

  if (hidden) return null;

  return (
    <div
      ref={rootRef}
      className={styles.preloader}
      role="dialog"
      aria-label="Introduction"
      aria-modal="true"
      onClick={skip}
    >
      <div className={styles.stage}>
        {LINES.map((text, i) => (
          <p
            key={text}
            data-welcome-line
            className={`${styles.line}${i === LINES.length - 1 ? ` ${styles.lineNowrap}` : ""}`}
          >
            {text}
          </p>
        ))}
      </div>
      <p ref={hintRef} className={styles.skipHint}>
        Click to skip
      </p>
    </div>
  );
}
