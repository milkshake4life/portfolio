"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { flushSync } from "react-dom";
import { useLenis } from "lenis/react";
import {
  cardFocusNumbers,
  cardFocusVars,
  type GalleryEntry,
} from "@/lib/gallery";
import { EASE, DUR, MORPH, SLIDE, JOURNAL } from "@/lib/motion";
import TrayStage from "@/components/gallery/TrayStage";
import ProfileCard from "@/components/works/ProfileCard";
import styles from "./DrinkLightbox.module.css";

export type LightboxOrigin = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type LightboxOriginParts = {
  product: LightboxOrigin;
  card: LightboxOrigin | null;
};

type DrinkLightboxProps = {
  entries: GalleryEntry[];
  thumbsLabel: string;
  activeIndex: number;
  originRect: LightboxOrigin | null;
  originParts: LightboxOriginParts | null;
  getOriginRect: (index: number) => LightboxOrigin | null;
  getOriginParts: (index: number) => LightboxOriginParts | null;
  syncGalleryToIndex: (index: number) => void;
  onClose: () => void;
  onCloseBegin: () => void;
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

function isServing(entry: GalleryEntry) {
  return Boolean(entry.project && entry.screens);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function syncPrototypeVideos(
  track: HTMLElement,
  activeIndex: number,
  live: boolean
) {
  Array.from(track.children).forEach((slide, i) => {
    const video = slide.querySelector<HTMLVideoElement>(
      "[data-prototype-video]"
    );
    if (!video) return;

    if (live && i === activeIndex) {
      video.dataset.active = "";
      void video.play().catch(() => {});
      return;
    }

    delete video.dataset.active;
    video.pause();
    if (!live) {
      try {
        video.currentTime = 0;
      } catch {
        /* media not ready */
      }
    }
  });
}

function servingNodes(track: HTMLElement, index: number) {
  const slide = track.children[index] as HTMLElement | undefined;
  if (!slide) return { product: null, card: null };
  return {
    product: slide.querySelector<HTMLElement>("[data-tray-screens]"),
    card: slide.querySelector<HTMLElement>("[data-profile-card]"),
  };
}

function placeFromRect(el: HTMLElement, from: LightboxOrigin) {
  gsap.set(el, { clearProps: "transform,x,y,scale,scaleX,scaleY" });
  const to = el.getBoundingClientRect();
  gsap.set(el, {
    x: from.left - to.left,
    y: from.top - to.top,
    scaleX: from.width / Math.max(1, to.width),
    scaleY: from.height / Math.max(1, to.height),
    transformOrigin: "0 0",
  });
}

function tweenCrop(
  el: HTMLElement,
  entry: GalleryEntry,
  toCard: boolean,
  duration: number,
  ease: string
) {
  const focus = cardFocusNumbers(entry.cardFocus);
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
  entries,
  thumbsLabel,
  activeIndex,
  originRect,
  originParts,
  getOriginRect,
  getOriginParts,
  syncGalleryToIndex,
  onClose,
  onCloseBegin,
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
  const [prototypeLive, setPrototypeLive] = useState(false);
  activeIndexRef.current = activeIndex;
  const total = entries.length;
  const entry = entries[activeIndex];
  const morphEntry = entries[morphDisplayIndex];
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
      const { product, card } = servingNodes(track, activeIndexRef.current);
      if (product) gsap.set(product, { clearProps: "transform,x,y,scale,scaleX,scaleY" });
      if (card) gsap.set(card, { clearProps: "transform,x,y,scale,scaleX,scaleY" });
      if (!preserveTrackPosition) {
        const index = activeIndexRef.current;
        gsap.set(track, { x: slideOffset(index, step) });
        prevIndexRef.current = index;
      }
    }

    canCloseRef.current = true;
    if (!prefersReducedMotion()) setPrototypeLive(true);
  }, []);

  const animateClose = useCallback(() => {
    if (closingRef.current || !canCloseRef.current) return;
    closingRef.current = true;
    setPrototypeLive(false);
    if (slideTrackRef.current) {
      syncPrototypeVideos(slideTrackRef.current, activeIndex, false);
    }

    // Release the chrome legibility treatment now (not at unmount) so the
    // wordmark/counter cross-fade back in step with the zoom-out.
    delete document.body.dataset.lightboxOpen;

    const wrap = imageWrapRef.current;
    const root = scope.current;
    syncGalleryToIndex(activeIndex);
    onCloseBegin();
    const origin = getOriginRect(activeIndex);
    const parts = getOriginParts(activeIndex);
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
    const serving = isServing(entries[activeIndex]);

    if (!wrap || !root || !origin || reduced) {
      gsap.to(root, { opacity: 0, duration: DUR.fast, onComplete: finish });
      return;
    }

    gsap.to("[data-lightbox-ui]", {
      opacity: 0,
      duration: DUR.fast,
      ease: EASE.out,
    });

    if (serving && parts && track) {
      const { product, card } = servingNodes(track, activeIndex);
      const tl = gsap.timeline({ onComplete: finish });
      if (product) {
        const from = product.getBoundingClientRect();
        const scaleX = Number(gsap.getProperty(product, "scaleX")) || 1;
        const scaleY = Number(gsap.getProperty(product, "scaleY")) || 1;
        tl.to(
          product,
          {
            x: `+=${parts.product.left - from.left}`,
            y: `+=${parts.product.top - from.top}`,
            scaleX: scaleX * (parts.product.width / Math.max(1, from.width)),
            scaleY: scaleY * (parts.product.height / Math.max(1, from.height)),
            transformOrigin: "0 0",
            duration: MORPH.splitDuration,
            ease: MORPH.closeEase,
          },
          0
        );
      }
      if (card && parts.card) {
        const from = card.getBoundingClientRect();
        const scaleX = Number(gsap.getProperty(card, "scaleX")) || 1;
        const scaleY = Number(gsap.getProperty(card, "scaleY")) || 1;
        tl.to(
          card,
          {
            x: `+=${parts.card.left - from.left}`,
            y: `+=${parts.card.top - from.top}`,
            scaleX: scaleX * (parts.card.width / Math.max(1, from.width)),
            scaleY: scaleY * (parts.card.height / Math.max(1, from.height)),
            transformOrigin: "0 0",
            duration: MORPH.splitDuration,
            ease: MORPH.closeEase,
          },
          0
        );
      }
      tl.to(
        root,
        {
          backgroundColor: "rgba(10, 10, 10, 0)",
          duration: MORPH.closeDuration,
          ease: MORPH.closeEase,
        },
        0
      );
      return;
    }

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
        entries[activeIndex],
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
  }, [
    activeIndex,
    entries,
    getOriginParts,
    getOriginRect,
    onClose,
    onCloseBegin,
    syncGalleryToIndex,
  ]);

  useLayoutEffect(() => {
    lockPageScroll();
    lenis?.stop();

    return () => {
      unlockPageScroll();
      lenis?.start();
    };
  }, [lenis]);

  // Grow the viewport clip from the clicked frame to fullscreen.
  // Work serving: trays recede first, then the product and card split apart.
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
    const serving = isServing(entries[activeIndex]);

    if (track) {
      const step = syncSlideStep(wrap);
      gsap.set(track, { x: slideOffset(activeIndex, step), autoAlpha: 0 });
    }
    if (morph) {
      const focus = cardFocusNumbers(entries[activeIndex].cardFocus);
      gsap.set(morph, {
        autoAlpha: serving ? 0 : 1,
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
      if (!reduced) setPrototypeLive(true);
      return;
    }

    gsap.set(ui, { opacity: 0 });
    hideJournal();

    if (serving && originParts && track) {
      setWrapBounds(wrap, "fullscreen");
      gsap.set(root, { backgroundColor: "rgba(10, 10, 10, 0)" });
      const step = syncSlideStep(wrap);
      gsap.set(track, { x: slideOffset(activeIndex, step), autoAlpha: 1 });
      if (morph) gsap.set(morph, { autoAlpha: 0 });

      const { product, card } = servingNodes(track, activeIndex);
      if (product) placeFromRect(product, originParts.product);
      if (card && originParts.card) placeFromRect(card, originParts.card);

      const splitAt = MORPH.fadeDuration + MORPH.splitHold;
      const tl = gsap.timeline({
        onComplete: () => {
          finalizeOpen();
        },
      });
      openTimelineRef.current = tl;

      tl.to(
        root,
        {
          backgroundColor: "rgb(10, 10, 10)",
          duration: MORPH.splitDuration,
          ease: MORPH.splitEase,
        },
        splitAt
      );

      if (product) {
        tl.to(
          product,
          {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            duration: MORPH.splitDuration,
            ease: MORPH.splitEase,
          },
          splitAt
        );
      }
      if (card) {
        tl.to(
          card,
          {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            duration: MORPH.splitDuration,
            ease: MORPH.splitEase,
          },
          splitAt
        );
      }

      tl.to(
        ui,
        {
          opacity: 1,
          duration: DUR.base,
          ease: EASE.out,
        },
        splitAt + MORPH.splitDuration * 0.45
      );

      return () => {
        openTimelineRef.current?.kill();
        openTimelineRef.current = null;
      };
    }

    const startRect = getOriginRect(activeIndex) ?? originRect;
    setWrapBounds(wrap, startRect);
    gsap.set(root, { backgroundColor: "rgba(10, 10, 10, 0)" });

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
        entries[activeIndex],
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
    const track = slideTrackRef.current;
    if (!track) return;
    syncPrototypeVideos(track, activeIndex, prototypeLive);
    return () => syncPrototypeVideos(track, activeIndex, false);
  }, [activeIndex, prototypeLive]);

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
      aria-label={`${entry.name} — full view`}
    >
      <div ref={imageWrapRef} className={styles.imageWrap} onClick={animateClose}>
        <div
          ref={morphLayerRef}
          className={`${styles.morphLayer} ${styles.cardCrop}`}
          aria-hidden="true"
        >
          {morphEntry.screens ? (
            <TrayStage
              screens={morphEntry.screens}
              alt=""
              sizes="78vw"
              priority
              card={
                morphEntry.project ? (
                  <ProfileCard project={morphEntry.project} />
                ) : null
              }
            />
          ) : (
            <Image
              src={morphEntry.image}
              alt=""
              fill
              sizes="100vw"
              priority
              unoptimized={morphEntry.unoptimized}
            />
          )}
        </div>
        <div ref={slideTrackRef} className={styles.slideTrack}>
          {entries.map((item, i) => (
            <div key={item.id} className={styles.slide}>
              {item.project && item.screens ? (
                <div className={styles.serving}>
                  <div className={styles.servingProduct}>
                    <TrayStage
                      screens={item.screens}
                      alt={
                        i === activeIndex
                          ? item.name
                          : ""
                      }
                      sizes="64vw"
                      priority={Math.abs(i - activeIndex) <= 1}
                      shelf={false}
                      project={item.project}
                      live={!prefersReducedMotion()}
                      playing={prototypeLive && i === activeIndex}
                      preload={
                        Math.abs(i - activeIndex) <= 1 ? "metadata" : "none"
                      }
                    />
                  </div>
                  <div className={styles.servingCard}>
                    <ProfileCard project={item.project} />
                  </div>
                </div>
              ) : item.screens ? (
                <TrayStage
                  screens={item.screens}
                  alt={
                    i === activeIndex
                      ? item.name
                      : ""
                  }
                  sizes="78vw"
                  priority={Math.abs(i - activeIndex) <= 1}
                />
              ) : (
                <Image
                  src={item.image}
                  alt={
                    i === activeIndex
                      ? item.name
                      : ""
                  }
                  fill
                  sizes="100vw"
                  priority={Math.abs(i - activeIndex) <= 1}
                  aria-hidden={i !== activeIndex}
                  unoptimized={item.unoptimized}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {!entry.project ? (
      <aside
        data-lightbox-ui
        className={styles.journal}
        aria-label={`${entry.name} — journal entry`}
      >
        <div ref={journalInnerRef} className={styles.journalInner}>
          <p className={styles.journalEyebrow}>
            No. {String(activeIndex + 1).padStart(2, "0")} · {entry.journal.category}
          </p>
          <h2 className={styles.journalName}>{entry.name}</h2>
          {entry.journal.sublines.map((line) => (
            <p key={line} className={styles.journalSub}>
              {line}
            </p>
          ))}

          <span className={styles.journalRule} aria-hidden="true" />

          <p className={styles.journalEntry}>{entry.journal.entry}</p>

          <span className={styles.journalRule} aria-hidden="true" />

          <dl className={styles.journalMeta}>
            {entry.journal.meta.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
      ) : null}

      {entry.project ? (
        <p data-lightbox-ui className={styles.closeHint}>
          Click or press Escape to close
        </p>
      ) : null}

      {!entry.project ? (
      <div
        ref={thumbsRef}
        data-lightbox-ui
        className={styles.thumbs}
        role="tablist"
        aria-label={thumbsLabel}
      >
        {entries.map((item, i) => (
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
              unoptimized={item.unoptimized}
            />
          </button>
        ))}
      </div>
      ) : null}
    </div>
  );
}
