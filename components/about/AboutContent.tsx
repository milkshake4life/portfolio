"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import gsap from "gsap";
import { useLenis } from "lenis/react";
import {
  ABOUT_BIO,
  ABOUT_DESIGN,
  ABOUT_KICKERS,
  ABOUT_PORTRAIT,
  CAFE_DREAM,
  CAFE_TITLE,
  CONTACT_LINE,
  SIDE_WORK,
  SOCIAL_LINKS,
} from "@/lib/about";
import { DESKTOP_MQ } from "@/lib/layout";
import { EASE } from "@/lib/motion";
import styles from "./AboutContent.module.css";

const MAP_LABELS = [
  ABOUT_KICKERS.intro,
  ...SIDE_WORK.map((item) => item.title),
  CAFE_TITLE,
  ABOUT_KICKERS.contact,
];

function isDesktop() {
  return window.matchMedia(DESKTOP_MQ).matches;
}

export default function AboutContent() {
  const scope = useRef<HTMLElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const lenis = useLenis();
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const items = pagesRef.current?.querySelectorAll(`.${styles.introItem}`);
    if (!items?.length) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      gsap.set(items, { autoAlpha: 1, x: 0 });
      return;
    }

    const tween = gsap.fromTo(
      items,
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

    return () => {
      tween.kill();
      gsap.set(items, { clearProps: "all" });
    };
  }, []);

  useEffect(() => {
    lenis?.start();
  }, [lenis]);

  const layoutMap = useCallback(() => {
    const map = mapRef.current;
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    const pages = pagesRef.current;
    if (!map || !viewport || !canvas || !frame || !pages) return;

    if (!isDesktop()) {
      canvas.style.transform = "none";
      canvas.style.opacity = "0";
      frame.style.opacity = "0";
      return;
    }

    canvas.style.transform = "none";
    canvas.style.width = `${window.innerWidth}px`;

    const cs = getComputedStyle(map);
    const availW =
      map.clientWidth -
      parseFloat(cs.paddingLeft) -
      parseFloat(cs.paddingRight);
    const availH =
      map.clientHeight -
      parseFloat(cs.paddingTop) -
      parseFloat(cs.paddingBottom);
    const pageW = canvas.offsetWidth || window.innerWidth;
    const pageH = Math.max(pages.offsetHeight, canvas.offsetHeight, 1);
    const scale = Math.min(availW / pageW, availH / pageH);
    const visualW = pageW * scale;
    const visualH = pageH * scale;

    canvas.style.transformOrigin = "top left";
    canvas.style.transform = `scale(${scale})`;
    canvas.style.opacity = "1";
    viewport.style.width = `${visualW}px`;
    viewport.style.height = `${visualH}px`;

    const viewH = window.innerHeight;
    const scrollY = lenis?.scroll ?? window.scrollY;
    const maxScroll = Math.max(1, pageH - viewH);
    const frameH = Math.max(24, viewH * scale);
    const frameY = (scrollY / maxScroll) * Math.max(0, visualH - frameH);

    frame.style.transition = "none";
    frame.style.height = `${frameH}px`;
    frame.style.transform = `translate3d(0, ${frameY}px, 0)`;
    frame.style.opacity = "1";
  }, [lenis]);

  const syncActive = useCallback(() => {
    if (!isDesktop()) return;

    const line = window.innerHeight * 0.32;
    const panels = pagesRef.current?.querySelectorAll<HTMLElement>(
      "[data-about-panel]"
    );
    if (!panels?.length) return;

    let best = 0;
    panels.forEach((el) => {
      if (el.getBoundingClientRect().top <= line) {
        best = Number(el.dataset.aboutPanel);
      }
    });

    if (best !== activeRef.current) {
      activeRef.current = best;
      setActive(best);
    }
  }, []);

  const onScroll = useCallback(() => {
    layoutMap();
    syncActive();
  }, [layoutMap, syncActive]);

  useEffect(() => {
    const onResize = () => {
      layoutMap();
      syncActive();
    };

    lenis?.on("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onResize();

    const pages = pagesRef.current;
    const canvas = canvasRef.current;
    const ro = new ResizeObserver(() => layoutMap());
    if (pages) ro.observe(pages);
    if (canvas) ro.observe(canvas);

    return () => {
      lenis?.off("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [layoutMap, lenis, onScroll, syncActive]);

  const goToPanel = useCallback(
    (index: number) => {
      const el = pagesRef.current?.querySelector<HTMLElement>(
        `[data-about-panel="${index}"]`
      );
      if (!el) return;

      activeRef.current = index;
      setActive(index);

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const y =
        el.getBoundingClientRect().top + (lenis?.scroll ?? window.scrollY);

      if (lenis) {
        lenis.scrollTo(y, {
          immediate: reduced,
          duration: reduced ? 0 : 1.15,
        });
        return;
      }

      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    },
    [lenis]
  );

  return (
    <main ref={scope} className={styles.about}>
      <nav ref={mapRef} className={styles.map} aria-label="On this page">
        <div ref={viewportRef} className={styles.mapViewport}>
          <div ref={frameRef} className={styles.mapFrame} aria-hidden="true" />
          <div
            ref={canvasRef}
            className={styles.mapCanvas}
            aria-hidden="true"
            inert
          >
            <AboutStage mini />
          </div>
          <div className={styles.mapHits}>
            {MAP_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                className={styles.mapHit}
                onClick={() => goToPanel(i)}
                aria-label={label}
                aria-current={active === i ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      </nav>

      <div ref={pagesRef} className={styles.pages}>
        <AboutStage />
      </div>
    </main>
  );
}

function AboutStage({ mini = false }: { mini?: boolean }) {
  const id = (value: string) => (mini ? undefined : value);

  let index = 0;
  const introIndex = index++;
  const sideIndexes = SIDE_WORK.map(() => index++);
  const passionsIndex = index++;
  const contactIndex = index++;

  return (
    <>
      <section
        data-about-panel={mini ? undefined : introIndex}
        className={styles.panel}
        aria-labelledby={id("about-intro")}
      >
        <div className={styles.introLayout}>
          <div
            className={`${styles.introCopy} ${mini ? "" : styles.introItem}`}
          >
            <p className={styles.kicker} id={id("about-intro")}>
              {ABOUT_KICKERS.intro}
            </p>
            <p className={styles.bio}>{ABOUT_BIO}</p>
            <p className={styles.bio}>{ABOUT_DESIGN}</p>
          </div>

          <div
            className={`${styles.portrait} ${mini ? "" : styles.introItem}`}
          >
            <Image
              src={ABOUT_PORTRAIT}
              alt={mini ? "" : "Ethan G.R. Lee"}
              fill
              priority={!mini}
              sizes={mini ? "120px" : "(max-width: 1099px) 100vw, 28rem"}
              className={styles.portraitImage}
            />
          </div>
        </div>
      </section>

      {SIDE_WORK.map((item, i) => {
        const panelIndex = sideIndexes[i];
        const headingId = i === 0 ? "about-side" : `about-side-${i}`;
        return (
          <section
            key={item.title}
            data-about-panel={mini ? undefined : panelIndex}
            className={styles.panel}
            aria-labelledby={id(headingId)}
          >
            <div className={styles.panelInner}>
              <h2 className={styles.sectionTitle} id={id(headingId)}>
                {item.title}
              </h2>

              <article className={styles.role}>
                <div
                  className={styles.roleMedia}
                  style={{ aspectRatio: item.imageAspect }}
                >
                  <Image
                    src={item.image}
                    alt={mini ? "" : item.imageAlt}
                    fill
                    sizes={mini ? "80px" : "(max-width: 1099px) 100vw, 50vw"}
                    className={styles.roleImage}
                  />
                </div>
                <div className={styles.roleCopy}>
                  <p className={styles.roleMeta}>
                    {item.role}
                    <span className={styles.roleDates}>{item.dates}</span>
                  </p>
                  <p className={styles.roleBody}>{item.body}</p>
                </div>
              </article>
            </div>
          </section>
        );
      })}

      <section
        data-about-panel={mini ? undefined : passionsIndex}
        className={styles.panel}
        aria-labelledby={id("about-passions")}
      >
        <div className={styles.panelInner}>
          <h2 className={styles.sectionTitle} id={id("about-passions")}>
            {CAFE_TITLE}
          </h2>
          <p className={styles.cafe}>{CAFE_DREAM}</p>
        </div>
      </section>

      <section
        data-about-panel={mini ? undefined : contactIndex}
        className={styles.panel}
        aria-labelledby={id("about-contact")}
      >
        <div className={styles.contactInner}>
          <p className={styles.kicker} id={id("about-contact")}>
            {ABOUT_KICKERS.contact}
          </p>
          <p className={styles.contactLine}>{CONTACT_LINE}</p>
          <ul className={styles.links}>
            {SOCIAL_LINKS.map(({ label, href }) => (
              <li key={label}>
                {mini ? (
                  <span className={styles.link}>{label}</span>
                ) : (
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
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
