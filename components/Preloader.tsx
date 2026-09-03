"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { WELCOME } from "@/lib/motion";
import styles from "./Preloader.module.css";

gsap.registerPlugin(useGSAP);

const SESSION_KEY = "preloader-seen";

const LINES = [
  "Ethan G.R. Lee",
  "Welcome",
  "I love Design, Coffee & Tea",
  "Explore my passions through this website",
] as const;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Apple-style welcome sequence — soft centered phrases that
 * appear and dissolve, once per session, then reveal the site.
 */
export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useGSAP(
    () => {
      const finish = () => {
        sessionStorage.setItem(SESSION_KEY, "1");
        document.body.style.overflow = "";
        setHidden(true);
      };

      if (sessionStorage.getItem(SESSION_KEY)) {
        setHidden(true);
        return;
      }

      if (prefersReducedMotion()) {
        finish();
        return;
      }

      document.body.style.overflow = "hidden";

      const lines = gsap.utils.toArray<HTMLElement>("[data-welcome-line]");
      const tl = gsap.timeline({ onComplete: finish });

      gsap.set(lines, {
        opacity: 0,
        scale: 0.985,
        filter: "blur(10px)",
      });

      lines.forEach((line, i) => {
        const isLast = i === lines.length - 1;

        tl.to(line, {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: WELCOME.fadeIn,
          ease: WELCOME.ease,
        })
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
    { scope: rootRef }
  );

  if (hidden) return null;

  return (
    <div
      ref={rootRef}
      className={styles.preloader}
      role="presentation"
      aria-hidden="true"
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
    </div>
  );
}
