"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import {
  ABOUT_BIO,
  ABOUT_DESIGN,
  ABOUT_PORTRAIT,
  CAFE_DREAM,
  CONTACT_LINE,
  FUN_FACTS,
  SIDE_WORK,
  SOCIAL_LINKS,
} from "@/lib/about";
import { EASE } from "@/lib/motion";
import styles from "./AboutContent.module.css";

gsap.registerPlugin(useGSAP);

export default function AboutContent() {
  const scope = useRef<HTMLElement>(null);
  const introItemSelector = `.${styles.introItem}`;
  const lenis = useLenis();

  useEffect(() => {
    lenis?.start();
  }, [lenis]);

  useGSAP(
    () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduced) {
        gsap.set(introItemSelector, { autoAlpha: 1, x: 0 });
        return;
      }

      gsap.fromTo(
        introItemSelector,
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
      <section className={styles.panel} aria-labelledby="about-intro">
        <div className={styles.introLayout}>
          <div className={`${styles.introCopy} ${styles.introItem}`}>
            <p className={styles.kicker} id="about-intro">
              About me and my design
            </p>
            <p className={styles.bio}>{ABOUT_BIO}</p>
            <p className={styles.bio}>{ABOUT_DESIGN}</p>
          </div>

          <div className={`${styles.portrait} ${styles.introItem}`}>
            <Image
              src={ABOUT_PORTRAIT}
              alt="Ethan G.R. Lee"
              fill
              priority
              sizes="(max-width: 1099px) 100vw, 28rem"
              className={styles.portraitImage}
            />
          </div>
        </div>
      </section>

      {SIDE_WORK.map((item, i) => (
        <section
          key={item.title}
          className={styles.panel}
          aria-labelledby={i === 0 ? "about-side" : `about-side-${i}`}
        >
          <div className={styles.panelInner}>
            {i === 0 ? (
              <header className={styles.panelHead}>
                <p className={styles.kicker} id="about-side">
                  Design outside design work
                </p>
                <h2 className={styles.sectionTitle}>The rooms around the Menu</h2>
              </header>
            ) : (
              <p className={styles.kicker} id={`about-side-${i}`}>
                Design outside design work
              </p>
            )}

            <article className={styles.role}>
              <div className={styles.roleMedia}>
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  sizes="(max-width: 1099px) 100vw, 50vw"
                  className={styles.roleImage}
                />
              </div>
              <div className={styles.roleCopy}>
                <p className={styles.roleMeta}>
                  {item.role} – {item.dates}
                </p>
                <h3 className={styles.roleTitle}>{item.title}</h3>
                <p className={styles.roleBody}>{item.body}</p>
              </div>
            </article>
          </div>
        </section>
      ))}

      <section className={styles.panel} aria-labelledby="about-passions">
        <div className={styles.panelInner}>
          <header className={styles.panelHead}>
            <p className={styles.kicker} id="about-passions">
              Passions outside of design
            </p>
            <h2 className={styles.sectionTitle}>
              Cafe dreams, and a few other things
            </h2>
          </header>

          <div className={styles.passions}>
            <p className={styles.cafe}>{CAFE_DREAM}</p>
            <ul className={styles.facts}>
              {FUN_FACTS.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="about-contact">
        <div className={styles.contactInner}>
          <p className={styles.kicker} id="about-contact">
            Contact me
          </p>
          <p className={styles.contactLine}>{CONTACT_LINE}</p>
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
      </section>
    </main>
  );
}
