"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { cardFocusVars, drinks } from "@/lib/drinks";
import { EASE, COUNTER, DUR } from "@/lib/motion";
import DrinkLightbox, {
  type LightboxOrigin,
} from "@/components/gallery/DrinkLightbox";
import styles from "./MenuGallery.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DRAG_THRESHOLD = 6;
const ARROW_REPEAT_MS = 480;

const TOTAL = drinks.length;

function galleryProgress(index: number) {
  if (TOTAL <= 1) return 0;
  return index / (TOTAL - 1);
}

/**
 * Journal — pinned horizontal gallery (Camille-style).
 * Vertical scroll drives the strip sideways; Lenis supplies the glide.
 * Mouse drag and arrow keys scrub the same scroll, one card at a time.
 * Click any image to open a fullscreen lightbox view.
 */
export default function MenuGallery() {
  const scope = useRef<HTMLElement>(null);
  const mediaRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterTrackRef = useRef<HTMLSpanElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const displayedIndexRef = useRef(1);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startScroll: number;
    active: boolean;
  } | null>(null);
  const didDragRef = useRef(false);
  const arrowTargetRef = useRef(0);
  const lastArrowAtRef = useRef(0);
  const scrollTweenRef = useRef<gsap.core.Tween | null>(null);
  const lightboxOpenRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [openOrigin, setOpenOrigin] = useState<LightboxOrigin | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const lenis = useLenis();
  const lightboxOpen = activeIndex !== null;
  lightboxOpenRef.current = lightboxOpen;

  const getOriginRect = useCallback((index: number): LightboxOrigin | null => {
    const el = mediaRefs.current[index];
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  const getScrollY = useCallback(() => {
    const st = scrollTriggerRef.current;
    if (typeof st?.scroll === "function") return Number(st.scroll());
    return lenis?.scroll ?? window.scrollY;
  }, [lenis]);

  const getScrollBounds = useCallback(() => {
    const st = scrollTriggerRef.current;
    if (st) return { min: st.start, max: st.end };
    return {
      min: 0,
      max: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
    };
  }, []);

  const clampScroll = useCallback(
    (value: number) => {
      const { min, max } = getScrollBounds();
      return Math.min(max, Math.max(min, value));
    },
    [getScrollBounds]
  );

  const applyScroll = useCallback((value: number) => {
    const y = clampScroll(value);
    if (lenis) {
      lenis.scrollTo(y, { immediate: true });
      ScrollTrigger.update();
      return;
    }
    const st = scrollTriggerRef.current;
    if (st) st.scroll(y);
    else window.scrollTo(0, y);
  }, [clampScroll, lenis]);

  const scrollGalleryTo = useCallback(
    (
      value: number,
      options?: { immediate?: boolean; duration?: number }
    ) => {
      const y = clampScroll(value);
      if (options?.immediate) {
        scrollTweenRef.current?.kill();
        applyScroll(y);
        return;
      }

      const proxy = { y: getScrollY() };
      scrollTweenRef.current?.kill();
      scrollTweenRef.current = gsap.to(proxy, {
        y,
        duration: options?.duration ?? 0.42,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => applyScroll(proxy.y),
      });
    },
    [applyScroll, clampScroll, getScrollY]
  );

  const getCardStep = useCallback(() => {
    const item = scope.current?.querySelector<HTMLElement>("[data-item]");
    if (!item) return window.innerWidth * 0.42;
    const track = item.parentElement;
    const gap = track ? parseFloat(getComputedStyle(track).gap) || 0 : 0;
    return item.getBoundingClientRect().width + gap;
  }, []);

  const openLightbox = (
    index: number,
    mediaEl: HTMLElement,
    trigger: HTMLButtonElement
  ) => {
    triggerRef.current = trigger;
    trigger.blur();

    const rect = mediaEl.getBoundingClientRect();
    setOpenOrigin({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
    setActiveIndex(index);
  };

  const closeLightbox = () => {
    setActiveIndex(null);
    setOpenOrigin(null);
  };

  const setCounterIndex = useCallback((index: number) => {
    if (index === displayedIndexRef.current || !counterTrackRef.current) return;
    displayedIndexRef.current = index;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    gsap.to(counterTrackRef.current, {
      y: `${-(index - 1)}em`,
      duration: reduced ? 0 : COUNTER.duration,
      ease: COUNTER.ease,
      overwrite: true,
    });
  }, []);

  const syncGalleryToIndex = useCallback((index: number) => {
    const track = scope.current?.querySelector<HTMLElement>("[data-track]");
    const st = scrollTriggerRef.current;
    if (!track) return;

    const progress = galleryProgress(index);
    const distance = track.scrollWidth - window.innerWidth;

    gsap.set(track, { x: -progress * distance });

    if (st) {
      const targetScroll = st.start + progress * (st.end - st.start);
      st.scroll(targetScroll);
    }

    setCounterIndex(index + 1);
  }, [setCounterIndex]);

  const handleLightboxChange = useCallback(
    (index: number) => {
      setActiveIndex(index);
      syncGalleryToIndex(index);
    },
    [syncGalleryToIndex]
  );

  const onViewportPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (lightboxOpen || e.button !== 0 || e.pointerType !== "mouse") return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startScroll: getScrollY(),
      active: false,
    };
    didDragRef.current = false;
  };

  const onViewportPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.active = true;
      didDragRef.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    e.preventDefault();
    scrollGalleryTo(drag.startScroll - dx - dy, { immediate: true });
  };

  const endViewportDrag = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (drag.active) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      setDragging(false);
    }
    dragRef.current = null;
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightboxOpenRef.current) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      const dir =
        e.key === "ArrowRight" || e.key === "ArrowDown"
          ? 1
          : e.key === "ArrowLeft" || e.key === "ArrowUp"
            ? -1
            : 0;
      if (!dir) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      const now = performance.now();
      const current = getScrollY();
      const base =
        now - lastArrowAtRef.current < ARROW_REPEAT_MS
          ? arrowTargetRef.current
          : current;
      lastArrowAtRef.current = now;
      arrowTargetRef.current = clampScroll(base + dir * getCardStep());

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      scrollGalleryTo(arrowTargetRef.current, {
        immediate: reduced,
        duration: 0.42,
      });
    };

    document.addEventListener("keydown", onKey, {
      capture: true,
      passive: false,
    });
    return () =>
      document.removeEventListener("keydown", onKey, { capture: true });
  }, [clampScroll, getCardStep, getScrollY, scrollGalleryTo]);

  useEffect(() => {
    if (activeIndex !== null) {
      setCounterIndex(activeIndex + 1);
      return;
    }

    const trigger = triggerRef.current;
    if (!trigger) return;

    // Browsers restore focus to the trigger after the dialog unmounts,
    // which leaves a persistent :focus-visible ring after mouse close.
    const blurTrigger = () => {
      trigger.blur();
      triggerRef.current = null;
    };

    blurTrigger();
    const id = requestAnimationFrame(blurTrigger);

    return () => cancelAnimationFrame(id);
  }, [activeIndex, setCounterIndex]);

  useGSAP(
    () => {
      const viewport = scope.current!.querySelector<HTMLElement>(
        "[data-viewport]"
      )!;
      const track = scope.current!.querySelector<HTMLElement>("[data-track]")!;

      const distance = () => track.scrollWidth - window.innerWidth;

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: viewport,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const index = Math.round(self.progress * (TOTAL - 1)) + 1;
            setCounterIndex(index);
          },
        },
      });

      scrollTriggerRef.current = tween.scrollTrigger ?? null;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduced) {
        gsap.set("[data-item]", { autoAlpha: 1, x: 0 });
      } else {
        gsap.fromTo(
          "[data-item]",
          { autoAlpha: 0, x: 28, willChange: "transform, opacity" },
          {
            autoAlpha: 1,
            x: 0,
            duration: DUR.base,
            ease: EASE.out,
            stagger: { each: 0.04, ease: "power1.out" },
            delay: 0.04,
            clearProps: "willChange",
          }
        );
      }
    },
    { scope }
  );

  return (
    <main ref={scope} className={styles.gallery}>
      <section
        data-viewport
        data-dragging={dragging ? "true" : undefined}
        className={styles.viewport}
        onPointerDown={onViewportPointerDown}
        onPointerMove={onViewportPointerMove}
        onPointerUp={endViewportDrag}
        onPointerCancel={endViewportDrag}
      >
        <div data-track className={styles.track}>
          {drinks.map((drink, i) => (
            <figure key={drink.id} data-item className={styles.item}>
              <button
                type="button"
                className={styles.openBtn}
                onClick={(e) => {
                  if (didDragRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  const media = e.currentTarget.querySelector<HTMLElement>(
                    `.${styles.media}`
                  );
                  if (media) openLightbox(i, media, e.currentTarget);
                }}
                aria-label={`Open ${drink.name}`}
              >
                <div
                  ref={(el) => {
                    mediaRefs.current[i] = el;
                  }}
                  className={`${styles.media} ${
                    activeIndex === i ? styles.mediaHidden : ""
                  }`}
                  style={cardFocusVars(drink.cardFocus)}
                >
                  <Image
                    src={drink.image}
                    alt={`${drink.name} — ${drink.notes}`}
                    fill
                    sizes="(max-width: 768px) 80vw, 50vw"
                    priority={i < 3}
                    draggable={false}
                  />
                </div>
              </button>
              <figcaption className={styles.caption}>
                <span className={`monoLabel ${styles.captionIndex}`}>
                  No. {String(i + 1).padStart(2, "0")} — {drink.category}
                </span>
                <span className={`monoLabel ${styles.captionNotes}`}>
                  {drink.notes}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

      </section>

      <p className={styles.counter} data-site-chrome="counter" aria-hidden="true">
        <span className={styles.counterDigit}>
          <span ref={counterTrackRef} className={styles.counterDigitTrack}>
            {drinks.map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </span>
        </span>
        <span className={styles.counterSep}>—</span>
        <span>{TOTAL}</span>
      </p>

      {activeIndex !== null && (
        <DrinkLightbox
          drinks={drinks}
          activeIndex={activeIndex}
          originRect={openOrigin}
          getOriginRect={getOriginRect}
          syncGalleryToIndex={syncGalleryToIndex}
          onClose={closeLightbox}
          onChange={handleLightboxChange}
        />
      )}
    </main>
  );
}
