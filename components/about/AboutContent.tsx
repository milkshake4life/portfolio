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
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import {
  ABOUT_BIO,
  ABOUT_DESIGN,
  ABOUT_KICKERS,
  ABOUT_PORTRAIT,
  CAFE_DREAM,
  CAFE_TITLE,
  SIDE_WORK,
} from "@/lib/about";
import { DESKTOP_MQ } from "@/lib/layout";
import { RIPPLE } from "@/lib/motion";
import BeliWidget from "./BeliWidget";
import styles from "./AboutContent.module.css";

gsap.registerPlugin(ScrollTrigger);

const MAP_LABELS = [
  ABOUT_KICKERS.intro,
  ...SIDE_WORK.map((item) => item.title),
  CAFE_TITLE,
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
  const panelsRef = useRef<HTMLElement[]>([]);
  const mapMetricsRef = useRef({
    scale: 1,
    visualH: 1,
    pageH: 1,
    viewH: 1,
  });
  const lenis = useLenis();
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const pages = pagesRef.current;
    if (!pages) return;

    const items = pages.querySelectorAll<HTMLElement>(`.${styles.ripple}`);
    if (!items.length) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      gsap.set(items, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.set(items, { autoAlpha: 0, y: RIPPLE.rise });

    const playRipple = (container: HTMLElement) => {
      const group = Array.from(
        container.querySelectorAll<HTMLElement>(`.${styles.ripple}`)
      );
      if (!group.length) return;

      group.sort(
        (a, b) =>
          b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom
      );

      gsap.fromTo(
        group,
        { autoAlpha: 0, y: RIPPLE.rise, willChange: "transform, opacity" },
        {
          autoAlpha: 1,
          y: 0,
          duration: RIPPLE.duration,
          ease: RIPPLE.ease,
          stagger: { each: RIPPLE.stagger, ease: "power1.out" },
          delay: RIPPLE.delay,
          clearProps: "willChange",
        }
      );
    };

    const panels = Array.from(
      pages.querySelectorAll<HTMLElement>("[data-about-panel]")
    );
    const first = panels[0];
    const later = panels.slice(1);

    const start = () => {
      if (first) playRipple(first);
    };

    const welcome = document.querySelector("[aria-label='Introduction']");
    let welcomeObserver: MutationObserver | null = null;
    if (welcome) {
      welcomeObserver = new MutationObserver(() => {
        if (document.contains(welcome)) return;
        welcomeObserver?.disconnect();
        welcomeObserver = null;
        start();
      });
      welcomeObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } else {
      start();
    }

    const triggers = later.map((panel) =>
      ScrollTrigger.create({
        trigger: panel,
        start: "top 82%",
        once: true,
        onEnter: () => playRipple(panel),
      })
    );

    return () => {
      welcomeObserver?.disconnect();
      triggers.forEach((trigger) => trigger.kill());
      gsap.set(items, { clearProps: "all" });
    };
  }, []);

  useEffect(() => {
    lenis?.start();
  }, [lenis]);

  const paintFrame = useCallback(() => {
    const frame = frameRef.current;
    if (!frame || !isDesktop()) return;

    const { scale, visualH, pageH, viewH } = mapMetricsRef.current;
    const scrollY = lenis?.scroll ?? window.scrollY;
    const maxScroll = Math.max(1, pageH - viewH);
    const frameH = Math.max(24, viewH * scale);
    const frameY = (scrollY / maxScroll) * Math.max(0, visualH - frameH);

    frame.style.height = `${frameH}px`;
    frame.style.transform = `translate3d(0, ${frameY}px, 0)`;
    frame.style.opacity = "1";
  }, [lenis]);
  const paintFrameRef = useRef(paintFrame);
  paintFrameRef.current = paintFrame;

  const measureMap = useCallback(() => {
    const map = mapRef.current;
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    const pages = pagesRef.current;
    if (!map || !viewport || !canvas || !pages) return;

    if (!isDesktop()) {
      canvas.style.transform = "none";
      canvas.style.opacity = "0";
      if (frameRef.current) frameRef.current.style.opacity = "0";
      return;
    }

    const cs = getComputedStyle(map);
    const availW =
      map.clientWidth -
      parseFloat(cs.paddingLeft) -
      parseFloat(cs.paddingRight);
    const availH =
      map.clientHeight -
      parseFloat(cs.paddingTop) -
      parseFloat(cs.paddingBottom);
    const pageW = window.innerWidth;
    const pageH = Math.max(pages.offsetHeight, 1);
    const scale = Math.min(availW / pageW, availH / pageH);
    const visualW = pageW * scale;
    const visualH = pageH * scale;
    const viewH = window.innerHeight;

    canvas.style.width = `${pageW}px`;
    canvas.style.transformOrigin = "top left";
    canvas.style.transform = `scale(${scale})`;
    canvas.style.opacity = "1";
    viewport.style.width = `${visualW}px`;
    viewport.style.height = `${visualH}px`;

    mapMetricsRef.current = { scale, visualH, pageH, viewH };
    paintFrameRef.current();
  }, []);

  const syncActive = useCallback(() => {
    if (!isDesktop()) return;

    const line = window.innerHeight * 0.32;
    const panels = panelsRef.current;
    if (!panels.length) return;

    let best = 0;
    for (const el of panels) {
      if (el.getBoundingClientRect().top <= line) {
        best = Number(el.dataset.aboutPanel);
      }
    }

    if (best !== activeRef.current) {
      activeRef.current = best;
      setActive(best);
    }
  }, []);

  const onScroll = useCallback(() => {
    paintFrame();
    syncActive();
  }, [paintFrame, syncActive]);

  useEffect(() => {
    const collectPanels = () => {
      panelsRef.current = Array.from(
        pagesRef.current?.querySelectorAll<HTMLElement>("[data-about-panel]") ??
          []
      );
    };

    const onResize = () => {
      collectPanels();
      measureMap();
      syncActive();
    };

    collectPanels();
    if (lenis) {
      lenis.on("scroll", onScroll);
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("resize", onResize);
    onResize();

    const pages = pagesRef.current;
    const ro = new ResizeObserver(() => measureMap());
    if (pages) ro.observe(pages);

    return () => {
      lenis?.off("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [lenis, measureMap, onScroll, syncActive]);

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
  const ripple = mini ? undefined : styles.ripple;

  let index = 0;
  const introIndex = index++;
  const sideIndexes = SIDE_WORK.map(() => index++);
  const passionsIndex = index++;

  return (
    <>
      <section
        data-about-panel={mini ? undefined : introIndex}
        className={styles.panel}
        aria-labelledby={id("about-intro")}
      >
        <div className={styles.introLayout}>
          <div className={styles.introCopy}>
            <p
              className={`${styles.kicker} ${ripple ?? ""}`}
              id={id("about-intro")}
            >
              {ABOUT_KICKERS.intro}
            </p>
            <p className={`${styles.bio} ${ripple ?? ""}`}>
              {ABOUT_BIO}
            </p>
            <p className={`${styles.bio} ${ripple ?? ""}`}>
              {ABOUT_DESIGN}
            </p>
          </div>

          <div className={`${styles.portrait} ${ripple ?? ""}`}>
            <Image
              src={ABOUT_PORTRAIT}
              alt={mini ? "" : "Ethan G.R. Lee"}
              fill
              priority={!mini}
              sizes={mini ? "120px" : "(max-width: 1099px) 100vw, 36rem"}
              className={styles.portraitImage}
            />
          </div>
        </div>
      </section>

      {SIDE_WORK.map((item, i) => {
        const panelIndex = sideIndexes[i];
        return (
          <section
            key={item.title}
            data-about-panel={mini ? undefined : panelIndex}
            className={styles.panel}
            aria-labelledby={id("about-side")}
          >
            <div className={styles.panelInner}>
              <article className={styles.role}>
                <div
                  className={`${styles.roleMedia} ${ripple ?? ""}`}
                  style={{ aspectRatio: item.imageAspect }}
                >
                  <Image
                    src={item.image}
                    alt={mini ? "" : item.imageAlt}
                    fill
                    quality={mini ? 50 : 92}
                    sizes={mini ? "80px" : "(max-width: 1099px) 26rem, 40rem"}
                    className={styles.roleImage}
                  />
                </div>
                <div className={styles.roleCopy}>
                  <p
                    className={`${styles.kicker} ${ripple ?? ""}`}
                    id={id("about-side")}
                  >
                    {item.title}
                  </p>
                  <p className={`${styles.bio} ${ripple ?? ""}`}>
                    {item.body}
                  </p>
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
        <div className={styles.cafeLayout}>
          <div className={styles.cafeCopy}>
            <h2
              className={`${styles.kicker} ${ripple ?? ""}`}
              id={id("about-passions")}
            >
              {CAFE_TITLE}
            </h2>
            <p className={`${styles.cafe} ${ripple ?? ""}`}>
              {CAFE_DREAM}
            </p>
          </div>
          <div className={ripple}>
            <BeliWidget mini={mini} />
          </div>
        </div>
      </section>
    </>
  );
}
