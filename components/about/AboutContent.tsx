 "use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ABOUT_BIO, ABOUT_PORTRAIT, SOCIAL_LINKS } from "@/lib/about";
import { EASE } from "@/lib/motion";
import styles from "./AboutContent.module.css";

gsap.registerPlugin(useGSAP);

export default function AboutContent() {
  const scope = useRef<HTMLElement>(null);
  const aboutItemSelector = `.${styles.aboutItem}`;

  useGSAP(
    () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduced) {
        gsap.set(aboutItemSelector, { autoAlpha: 1, x: 0 });
        return;
      }

      gsap.fromTo(
        aboutItemSelector,
        { autoAlpha: 0, x: 56, willChange: "transform, opacity" },
        {
          autoAlpha: 1,
          x: 0,
          duration: 1.5,
          ease: EASE.out,
          stagger: 0.08,
          delay: 0.12,
          clearProps: "willChange",
        }
      );
    },
    { scope }
  );

  return (
    <main ref={scope} className={styles.about}>
      <div className={styles.layout}>
        <div className={`${styles.content} ${styles.aboutItem}`}>
          <p className={styles.bio}>{ABOUT_BIO}</p>
          <ul className={styles.links}>
            {SOCIAL_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className={styles.link}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={
                    href.startsWith("mailto:")
                      ? undefined
                      : "noopener noreferrer"
                  }
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${styles.portrait} ${styles.aboutItem}`}>
          <Image
            src={ABOUT_PORTRAIT}
            alt="Ethan G.R. Lee"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 20rem"
            className={styles.portraitImage}
          />
        </div>
      </div>
    </main>
  );
}
