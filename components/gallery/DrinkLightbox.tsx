"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { flushSync } from "react-dom";
import { useLenis } from "lenis/react";
import {
  cardFocusNumbers,
  cardFocusVars,
  type Drink,
} from "@/lib/drinks";
import { EASE, DUR, MORPH, SLIDE, JOURNAL } from "@/lib/motion";
import styles from "./DrinkLightbox.module.css";

export type LightboxOrigin = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type DrinkLightboxProps = {
  drinks: Drink[];
  activeIndex: number;
  originRect: LightboxOrigin | null;
  getOriginRect: (index: number) => LightboxOrigin | null;
  syncGalleryToIndex: (index: number) => void;
  onClose: () => void;
  onChange: (index: number) => void;
};

function viewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function setWrapBounds(
  wrap: HTMLElement,
  rect: LightboxOrigin | "fullscreen"
) {
  if (rect === "fullscreen") {
    const { width, height } = viewportSize();
    gsap.set(wrap, {
      top: 0,
      left: 0,
      width,
      height,
      clearProps: "scale,transform,x,y,xPercent,yPercent",
    });
    return;
  }

  gsap.set(wrap, {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    clearProps: "scale,transform,x,y,xPercent,yPercent",
  });
}

function lockPageScroll() {
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;
  document.body.dataset.lightboxOpen = "true";
  document.body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function unlockPageScroll() {
  delete document.body.dataset.lightboxOpen;
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
}

function syncSlideStep(wrap: HTMLElement) {
  const step = wrap.clientWidth;
  wrap.style.setProperty("--slide-step", `${step}px`);
  return step;
}

function slideOffset(index: number, step: number) {
  return -index * step;
}

function tweenCrop(
  el: HTMLElement,
  drink: Drink,
  toCard: boolean,
  duration: number,
  ease: string
) {
  const focus = cardFocusNumbers(drink.cardFocus);
  if (!focus) return;

  gsap.to(el, {
    "--card-x": toCard ? focus.x : 50,
    "--card-y": toCard ? focus.y : 50,
    "--card-zoom": toCard ? focus.zoom : 1,
    duration,
    ease,
    overwrite: "auto",
  });
}

function animateSlide(
  track: HTMLElement,
  wrap: HTMLElement,
  toIndex: number
) {
  const step = syncSlideStep(wrap);

  gsap.to(track, {
    x: slideOffset(toIndex, step),
    duration: SLIDE.duration,
    ease: SLIDE.ease,
    overwrite: "auto",
  });
}

export default function DrinkLightbox({
  drinks,
  activeIndex,
  originRect,
  getOriginRect,
  syncGalleryToIndex,
  onClose,
  onChange,
}: DrinkLightboxProps) {
  const scope = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const morphLayerRef = useRef<HTMLDivElement>(null);
  const slideTrackRef = useRef<HTMLDivElement>(null);
  const journalInnerRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const canCloseRef = useRef(false);
  const closingRef = useRef(false);
  const prevIndexRef = useRef(activeIndex);
  const activeIndexRef = useRef(activeIndex);
  const openTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const [morphDisplayIndex, setMorphDisplayIndex] = useState(activeIndex);
  activeIndexRef.current = activeIndex;
  const total = drinks.length;
  const drink = drinks[activeIndex];
  const morphDrink = drinks[morphDisplayIndex];
  const lenis = useLenis();
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < total - 1;

  const goPrev = useCallback(() => {
    if (canGoPrev) onChange(activeIndex - 1);
  }, [activeIndex, canGoPrev, onChange]);

  const goNext = useCallback(() => {
    if (canGoNext) onChange(activeIndex + 1);
  }, [activeIndex, canGoNext, onChange]);

  const journalLines = useCallback(() => {
    const inner = journalInnerRef.current;
    return inner ? Array.from(inner.children) : null;
  }, []);

  const hideJournal = useCallback(() => {
    const lines = journalLines();
    if (lines) gsap.set(lines, { autoAlpha: 0 });
  }, [journalLines]);

  // Compose the journal entry line by line. Triggered from JS (not CSS) so
  // it can wait for the open morph to finish and replay on each slide change.
  const playJournal = useCallback(() => {
    const lines = journalLines();
    if (!lines) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      gsap.set(lines, { autoAlpha: 1, y: 0, filter: "blur(0px)" });
      return;
    }

    gsap.fromTo(
      lines,
      { autoAlpha: 0, y: JOURNAL.rise, filter: `blur(${JOURNAL.blur}px)` },
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: JOURNAL.duration,
        ease: JOURNAL.ease,
        stagger: JOURNAL.stagger,
        overwrite: true,
      }
    );
  }, [journalLines]);

  const finalizeOpen = useCallback((preserveTrackPosition = false) => {
    openTimelineRef.current?.kill();
    openTimelineRef.current = null;

    const wrap = imageWrapRef.current;
    const root = scope.current;
    const morph = morphLayerRef.current;
    const track = slideTrackRef.current;
    if (!wrap || !root) return;

    setWrapBounds(wrap, "fullscreen");
    gsap.set(root, { backgroundColor: "rgb(10, 10, 10)" });
    gsap.set(root.querySelectorAll("[data-lightbox-ui]"), { opacity: 1 });

    if (morph) gsap.set(morph, { autoAlpha: 0 });
    if (track) {
      const step = syncSlideStep(wrap);
      gsap.set(track, { autoAlpha: 1 });
      if (!preserveTrackPosition) {
        const index = activeIndexRef.current;
        gsap.set(track, { x: slideOffset(index, step) });
        prevIndexRef.current = index;
      }
    }

    canCloseRef.current = true;
  }, []);

  const animateClose = useCallback(() => {
    if (closingRef.current || !canCloseRef.current) return;
    closingRef.current = true;

    // Release the chrome legibility treatment now (not at unmount) so the
    // wordmark/counter cross-fade back in step with the zoom-out.
    delete document.body.dataset.lightboxOpen;

    const wrap = imageWrapRef.current;
    const root = scope.current;
    syncGalleryToIndex(activeIndex);
    const origin = getOriginRect(activeIndex);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const finish = () => {
      closingRef.current = false;
      canCloseRef.current = false;
      onClose();
    };

    const morph = morphLayerRef.current;
    const track = slideTrackRef.current;

    if (!wrap || !root || !origin || reduced) {
      gsap.to(root, { opacity: 0, duration: DUR.fast, onComplete: finish });
      return;
    }

    gsap.to("[data-lightbox-ui]", {
      opacity: 0,
      duration: DUR.fast,
      ease: EASE.out,
    });

    flushSync(() => setMorphDisplayIndex(activeIndex));

    if (track) gsap.set(track, { autoAlpha: 0 });
    if (morph) {
      gsap.set(morph, {
        autoAlpha: 1,
        "--card-x": 50,
        "--card-y": 50,
        "--card-zoom": 1,
      });
      tweenCrop(
        morph,
        drinks[activeIndex],
        true,
        MORPH.closeDuration,
        MORPH.closeEase
      );
    }

    setWrapBounds(wrap, "fullscreen");

    gsap
      .timeline({ onComplete: finish })
      .to(
        wrap,
        {
          top: origin.top,
          left: origin.left,
          width: origin.width,
          height: origin.height,
          duration: MORPH.closeDuration,
          ease: MORPH.closeEase,
        },
        0
      )
      .to(
        root,
        {
          backgroundColor: "rgba(10, 10, 10, 0)",
          duration: MORPH.closeDuration,
          ease: MORPH.closeEase,
        },
        0
      );
  }, [activeIndex, drinks, getOriginRect, onClose, syncGalleryToIndex]);

  useLayoutEffect(() => {
    lockPageScroll();
    lenis?.stop();

    return () => {
      unlockPageScroll();
      lenis?.start();
    };
  }, [lenis]);

  // Grow the viewport clip from the clicked frame to fullscreen.
  useLayoutEffect(() => {
    const wrap = imageWrapRef.current;
    const morph = morphLayerRef.current;
    const track = slideTrackRef.current;
    const root = scope.current;
    if (!wrap || !root) return;

    canCloseRef.current = false;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ui = root.querySelectorAll("[data-lightbox-ui]");
    const { width, height } = viewportSize();

    if (track) {
      const step = syncSlideStep(wrap);
      gsap.set(track, { x: slideOffset(activeIndex, step), autoAlpha: 0 });
    }
    if (morph) {
      const focus = cardFocusNumbers(drinks[activeIndex].cardFocus);
      gsap.set(morph, {
        autoAlpha: 1,
        ...(focus
          ? {
              "--card-x": focus.x,
              "--card-y": focus.y,
              "--card-zoom": focus.zoom,
            }
          : { "--card-x": 50, "--card-y": 50, "--card-zoom": 1 }),
      });
    }

    if (!originRect || reduced) {
      setWrapBounds(wrap, "fullscreen");
      gsap.set(root, { backgroundColor: "rgb(10, 10, 10)" });
      gsap.set(ui, { opacity: 1 });
      if (track) gsap.set(track, { autoAlpha: 1 });
      if (morph) gsap.set(morph, { autoAlpha: 0 });
      playJournal();
      canCloseRef.current = true;
      prevIndexRef.current = activeIndexRef.current;
      return;
    }

    const startRect = getOriginRect(activeIndex) ?? originRect;
    setWrapBounds(wrap, startRect);
    gsap.set(root, { backgroundColor: "rgba(10, 10, 10, 0)" });
    gsap.set(ui, { opacity: 0 });
    hideJournal();

    const tl = gsap.timeline({
      onComplete: () => {
        finalizeOpen();
        playJournal();
      },
    });
    openTimelineRef.current = tl;

    tl.to(
      root,
      {
        backgroundColor: "rgb(10, 10, 10)",
        duration: MORPH.openDuration,
        ease: MORPH.openEase,
      },
      0
    )
      .to(
        wrap,
        {
          top: 0,
          left: 0,
          width,
          height,
          duration: MORPH.openDuration,
          ease: MORPH.openEase,
        },
        0
      )
      .to(
        ui,
        {
          opacity: 1,
          duration: DUR.base,
          ease: EASE.out,
        },
        MORPH.openDuration * 0.5
      );

    if (morph) {
      tweenCrop(
        morph,
        drinks[activeIndex],
        false,
        MORPH.openDuration,
        MORPH.openEase
      );
    }

    return () => {
      openTimelineRef.current?.kill();
      openTimelineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on open
  }, []);

  useLayoutEffect(() => {
    if (prevIndexRef.current === activeIndex) return;

    const wrap = imageWrapRef.current;
    const track = slideTrackRef.current;
    const morph = morphLayerRef.current;
    if (!wrap || !track) return;

    const opening = Boolean(openTimelineRef.current?.isActive());
    const morphVisible =
      morph !== null && Number(gsap.getProperty(morph, "autoAlpha")) > 0;

    if (opening || morphVisible) {
      finalizeOpen(true);
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      const step = syncSlideStep(wrap);
      gsap.set(track, { x: slideOffset(activeIndex, step) });
    } else {
      animateSlide(track, wrap, activeIndex);
    }

    playJournal();
    prevIndexRef.current = activeIndex;
  }, [activeIndex, finalizeOpen, playJournal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") animateClose();
      if (e.key === "ArrowLeft" && canGoPrev) goPrev();
      if (e.key === "ArrowRight" && canGoNext) goNext();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [animateClose, canGoNext, canGoPrev, goNext, goPrev]);

  useEffect(() => {
    const wrap = imageWrapRef.current;
    const track = slideTrackRef.current;
    if (!wrap || !track) return;

    const onResize = () => {
      const step = syncSlideStep(wrap);
      gsap.set(track, { x: slideOffset(activeIndex, step) });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex]);

  useEffect(() => {
    const strip = thumbsRef.current;
    const activeThumb = thumbRefs.current[activeIndex];
    if (!strip || !activeThumb) return;

    const maxScroll = strip.scrollWidth - strip.clientWidth;
    const offset = Math.min(
      maxScroll,
      Math.max(
        0,
        activeThumb.offsetLeft -
          strip.offsetLeft -
          strip.clientWidth / 2 +
          activeThumb.offsetWidth / 2
      )
    );

    strip.scrollTo({ left: offset, behavior: "smooth" });
  }, [activeIndex]);

  return (
    <div
      ref={scope}
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={`${drink.name} — full view`}
    >
      <div ref={imageWrapRef} className={styles.imageWrap} onClick={animateClose}>
        <div
          ref={morphLayerRef}
          className={`${styles.morphLayer} ${styles.cardCrop}`}
          aria-hidden="true"
        >
          <Image
            src={morphDrink.image}
            alt=""
            fill
            sizes="100vw"
            priority
          />
        </div>
        <div ref={slideTrackRef} className={styles.slideTrack}>
          {drinks.map((item, i) => (
            <div key={item.id} className={styles.slide}>
              <Image
                src={item.image}
                alt={
                  i === activeIndex ? `${item.name} — ${item.notes}` : ""
                }
                fill
                sizes="100vw"
                priority={Math.abs(i - activeIndex) <= 1}
                aria-hidden={i !== activeIndex}
              />
            </div>
          ))}
        </div>
      </div>

      <aside
        data-lightbox-ui
        className={styles.journal}
        aria-label={`${drink.name} — journal entry`}
      >
        <div ref={journalInnerRef} className={styles.journalInner}>
          <p className={styles.journalEyebrow}>
            No. {String(activeIndex + 1).padStart(2, "0")} · {drink.category}
          </p>
          <h2 className={styles.journalName}>{drink.name}</h2>
          <p className={styles.journalSub}>{drink.origin}</p>
          <p className={styles.journalSub}>{drink.method}</p>

          <span className={styles.journalRule} aria-hidden="true" />

          <p className={styles.journalEntry}>{drink.entry}</p>

          <span className={styles.journalRule} aria-hidden="true" />

          <dl className={styles.journalMeta}>
            <div>
              <dt>Brewed</dt>
              <dd>{drink.place}</dd>
            </div>
            <div>
              <dt>On</dt>
              <dd>{drink.date}</dd>
            </div>
            <div>
              <dt>For</dt>
              <dd>{drink.occasion}</dd>
            </div>
          </dl>
        </div>
      </aside>

      <div
        ref={thumbsRef}
        data-lightbox-ui
        className={styles.thumbs}
        role="tablist"
        aria-label="All drinks"
      >
        {drinks.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => {
              thumbRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`View ${item.name}`}
            className={`${styles.thumb} ${
              i === activeIndex ? styles.thumbActive : ""
            }`}
            style={cardFocusVars(item.cardFocus)}
            onClick={(e) => {
              e.stopPropagation();
              onChange(i);
            }}
          >
            <Image
              src={item.image}
              alt=""
              fill
              sizes="80px"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
