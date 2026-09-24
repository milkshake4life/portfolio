"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import {
  cardFocusVars,
  type GalleryEntry,
} from "@/lib/gallery";
import { COUNTER, STRIP, MORPH, RIPPLE } from "@/lib/motion";
import DrinkLightbox, {
  type LightboxOrigin,
  type LightboxOriginParts,
} from "@/components/gallery/DrinkLightbox";
import TrayStage from "@/components/gallery/TrayStage";
import ProfileCard from "@/components/works/ProfileCard";
import styles from "./MenuGallery.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DRAG_THRESHOLD = 6;
const ARROW_REPEAT_MS = 480;
/** A release this long after the last pointer move is a placement, not a throw */
const STALE_FLICK_MS = 120;

function galleryProgress(index: number, total: number) {
  if (total <= 1) return 0;
  return index / (total - 1);
}

/**
 * How far forward a card is, from its distance off the centre line measured
 * in cards. Smoothstep, so a card eases into focus and eases out of it rather
 * than changing pace the instant it passes the middle.
 */
function focusFalloff(cardsFromCentre: number) {
  const d = Math.min(1, Math.abs(cardsFromCentre));
  return 1 - d * d * (3 - 2 * d);
}

/**
 * Pinned horizontal gallery (Camille-style).
 * Vertical scroll drives the strip sideways; Lenis supplies the glide.
 * Mouse drag and arrow keys scrub the same scroll, one card at a time.
 * Click any image to open a fullscreen lightbox view.
 *
 * The strip is a carousel rather than a free scroll: wherever it is let go it
 * settles onto the nearest card, and whichever card holds the centre line is
 * brought forward — larger, and at full strength against the rest.
 */
export default function MenuGallery({
  entries,
  thumbsLabel,
}: {
  entries: GalleryEntry[];
  thumbsLabel: string;
}) {
  const total = entries.length;
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
    lastX: number;
    lastY: number;
    lastMoveAt: number;
    /** Smoothed pointer speed in scroll px per ms, signed with the scroll */
    speed: number;
    active: boolean;
  } | null>(null);
  const didDragRef = useRef(false);
  const arrowTargetRef = useRef(0);
  const lastArrowAtRef = useRef(0);
  const scrollTweenRef = useRef<gsap.core.Tween | null>(null);
  /** Card centres along the track, and the centre-to-centre step, in layout px */
  const stripRef = useRef({ originX: 0, centres: [] as number[], step: 0 });
  const paintFocusRef = useRef<(() => void) | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  /** Read from inside ScrollTrigger, which is built once and outlives renders */
  const scheduleSettleRef = useRef<() => void>(() => {});
  const lightboxOpenRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [spotlight, setSpotlight] = useState(0);
  const setSpotlightRef = useRef(setSpotlight);
  setSpotlightRef.current = setSpotlight;
  const [dragging, setDragging] = useState(false);
  const [openOrigin, setOpenOrigin] = useState<LightboxOrigin | null>(null);
  const [openOriginParts, setOpenOriginParts] =
    useState<LightboxOriginParts | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const restoreStripRef = useRef<() => void>(() => {});
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

  const getOriginParts = useCallback(
    (index: number): LightboxOriginParts | null => {
      const el = mediaRefs.current[index];
      if (!el) return null;

      const asOrigin = (node: Element | null): LightboxOrigin | null => {
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      };

      const product =
        asOrigin(el.querySelector("[data-tray-screens]")) ?? getOriginRect(index);
      if (!product) return null;

      return {
        product,
        card: asOrigin(el.querySelector("[data-profile-card]")),
      };
    },
    [getOriginRect]
  );

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
      options?: { immediate?: boolean; duration?: number; ease?: string }
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
        ease: options?.ease ?? "power3.out",
        overwrite: true,
        onUpdate: () => applyScroll(proxy.y),
      });
    },
    [applyScroll, clampScroll, getScrollY]
  );

  /**
   * Centre-to-centre distance between cards. Read off layout rather than
   * painted rects, which carry the focus scale and would report the centred
   * card as wider than its neighbours.
   */
  const getCardStep = useCallback(() => {
    return stripRef.current.step || window.innerWidth * 0.42;
  }, []);

  /** Scroll position that puts a card on the centre line. */
  const scrollForIndex = useCallback(
    (index: number) => {
      const { min, max } = getScrollBounds();
      return min + galleryProgress(index, total) * (max - min);
    },
    [getScrollBounds, total]
  );

  const cancelSettle = useCallback(() => {
    if (settleTimerRef.current === null) return;
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = null;
  }, []);

  /**
   * Come to rest on a card. `from` is where the strip is heading rather than
   * where it is, so a flick picks the card it was thrown towards.
   */
  const settleToCard = useCallback(
    (options?: { from?: number; ease?: string }) => {
      if (lightboxOpenRef.current || total < 2) return;

      const { min, max } = getScrollBounds();
      if (max <= min) return;

      const current = getScrollY();
      const aim = clampScroll(options?.from ?? current);
      const index = Math.round(((aim - min) / (max - min)) * (total - 1));
      const target = scrollForIndex(index);
      const travel = Math.abs(target - current);
      if (travel < 1) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      scrollGalleryTo(target, {
        immediate: reduced,
        duration: gsap.utils.clamp(
          STRIP.snapMin,
          STRIP.snapMax,
          STRIP.snapMin + (travel / getCardStep()) * 0.34
        ),
        ease: options?.ease ?? STRIP.snapEase,
      });
    },
    [
      clampScroll,
      getCardStep,
      getScrollBounds,
      getScrollY,
      scrollForIndex,
      scrollGalleryTo,
      total,
    ]
  );

  /**
   * Settle once the strip has gone quiet. Every scroll change pushes this
   * back, so it only fires when the wheel, Lenis, and any tween of ours have
   * all finished — and then no-ops if a card is already centred.
   */
  const scheduleSettle = useCallback(() => {
    cancelSettle();
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null;
      if (dragRef.current?.active) return;
      settleToCard();
    }, STRIP.settleDelay);
  }, [cancelSettle, settleToCard]);

  scheduleSettleRef.current = scheduleSettle;

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
    setOpenOriginParts(getOriginParts(index));
    setActiveIndex(index);
  };

  const closeLightbox = () => {
    setActiveIndex(null);
    setOpenOrigin(null);
    setOpenOriginParts(null);
  };

  const restoreStrip = useCallback(() => {
    const root = scope.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>("[data-item]");
    const trays = root.querySelectorAll<HTMLElement>("[data-tray]");
    gsap.set(items, { y: 0 });
    gsap.to(items, {
      autoAlpha: 1,
      duration: MORPH.closeDuration,
      ease: MORPH.closeEase,
      overwrite: true,
    });
    if (trays.length) {
      gsap.set(trays, { y: 0 });
      gsap.to(trays, {
        autoAlpha: 1,
        duration: MORPH.closeDuration,
        ease: MORPH.closeEase,
        overwrite: true,
      });
    }
  }, []);
  restoreStripRef.current = restoreStrip;

  useLayoutEffect(() => {
    if (!lightboxOpen || activeIndex === null) return;

    const root = scope.current;
    if (!root) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-item]")
    );

    items.forEach((item, i) => {
      if (i === activeIndex) {
        const trays = item.querySelectorAll<HTMLElement>("[data-tray]");
        if (!trays.length) return;
        if (reduced) {
          gsap.set(trays, { autoAlpha: 0, y: MORPH.fadeY });
          return;
        }
        gsap.to(trays, {
          autoAlpha: 0,
          y: MORPH.fadeY,
          duration: MORPH.fadeDuration,
          ease: MORPH.fadeEase,
          overwrite: true,
        });
        return;
      }

      if (reduced) {
        gsap.set(item, { autoAlpha: 0, y: MORPH.fadeY });
        return;
      }
      gsap.to(item, {
        autoAlpha: 0,
        y: MORPH.fadeY,
        duration: MORPH.fadeDuration,
        ease: MORPH.fadeEase,
        overwrite: true,
      });
    });
    // Only the open, not a slide change inside the lightbox.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen]);

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

    const progress = galleryProgress(index, total);
    const { centres } = stripRef.current;
    const distance =
      centres.length > 1
        ? centres[centres.length - 1] - centres[0]
        : Math.max(0, track.scrollWidth - window.innerWidth);

    gsap.set(track, { x: -progress * distance });

    if (st) {
      const targetScroll = st.start + progress * (st.end - st.start);
      st.scroll(targetScroll);
    }

    // Bring the card forward now, not on the next frame: closing the lightbox
    // measures this card the moment after it is centred, and morphs back into
    // whatever it measures.
    paintFocusRef.current?.();
    setCounterIndex(index + 1);
  }, [setCounterIndex, total]);

  const handleLightboxChange = useCallback(
    (index: number) => {
      setActiveIndex(index);
      syncGalleryToIndex(index);
    },
    [syncGalleryToIndex]
  );

  const onViewportPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (lightboxOpen || e.button !== 0 || e.pointerType !== "mouse") return;
    scrollTweenRef.current?.kill();
    cancelSettle();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startScroll: getScrollY(),
      lastX: e.clientX,
      lastY: e.clientY,
      lastMoveAt: performance.now(),
      speed: 0,
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

    const now = performance.now();
    const elapsed = now - drag.lastMoveAt;
    if (elapsed > 0) {
      const moved = e.clientX - drag.lastX + (e.clientY - drag.lastY);
      // Scroll runs against the pointer. Weighted so the last few moves carry
      // the throw and an earlier sweep does not.
      drag.speed = drag.speed * 0.72 - (moved / elapsed) * 0.28;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      drag.lastMoveAt = now;
    }

    e.preventDefault();
    scrollGalleryTo(drag.startScroll - dx - dy, { immediate: true });
  };

  const endViewportDrag = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const wasDragging = drag.active;
    if (wasDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      setDragging(false);
    }
    dragRef.current = null;
    cancelSettle();
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);

    if (!wasDragging) return;

    // Carry the throw forward, then land on whichever card that reaches.
    const thrown =
      performance.now() - drag.lastMoveAt > STALE_FLICK_MS ? 0 : drag.speed;
    settleToCard({
      from: getScrollY() + thrown * STRIP.flingMs,
      ease: STRIP.flingEase,
    });
  };

  // A settle must never fight the hand that interrupts it: the moment a wheel
  // or a finger arrives, the strip is theirs again.
  useEffect(() => {
    const release = () => scrollTweenRef.current?.kill();
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchstart", release, { passive: true });
    return () => {
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
    };
  }, []);

  useEffect(
    () => () => {
      cancelSettle();
      scrollTweenRef.current?.kill();
    },
    [cancelSettle]
  );

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
      // Queried off this gallery rather than the document: during a route
      // change the outgoing page's strip is briefly still mounted.
      const items = Array.from(
        track.querySelectorAll<HTMLElement>("[data-item]")
      );
      const cards = items.map(
        (item) => item.querySelector<HTMLElement>("[data-media]")!
      );

      const measureStrip = () => {
        const x = Number(gsap.getProperty(track, "x")) || 0;
        stripRef.current = {
          originX: track.getBoundingClientRect().left - x,
          centres: items.map(
            (item) =>
              item.offsetLeft - track.offsetLeft + item.offsetWidth / 2
          ),
          step:
            items.length > 1
              ? items[1].offsetLeft - items[0].offsetLeft
              : window.innerWidth * 0.42,
        };
      };

      // First-to-last card centres, so the last tray lands on the same
      // midline as the first — independent of padding vs scrollWidth quirks.
      const distance = () => {
        measureStrip();
        const { centres } = stripRef.current;
        if (centres.length < 2) return 0;
        return centres[centres.length - 1] - centres[0];
      };

      // Runs on the shared ticker off the track's own transform, so the cards
      // stay in step with the strip whatever is moving it — wheel, drag,
      // arrow key, or a settle of ours.
      let paintedAt: number | null = null;
      let spotlightAt = -1;
      const paintFocus = (force = false) => {
        const { originX, centres, step } = stripRef.current;
        if (!step || !centres.length) return;

        const x = Number(gsap.getProperty(track, "x")) || 0;
        if (!force && x === paintedAt) return;
        paintedAt = x;

        const middle = window.innerWidth / 2;
        let nearest = 0;
        let nearestOff = Infinity;
        for (let i = 0; i < centres.length; i += 1) {
          const off = Math.abs(originX + x + centres[i] - middle) / step;
          const card = cards[i];
          const focus = focusFalloff(off);
          card.style.transform = `scale(${(
            1 -
            STRIP.focusRest +
            (STRIP.focusScale + STRIP.focusRest) * focus
          ).toFixed(4)})`;
          card.style.opacity = (
            STRIP.focusFade +
            (1 - STRIP.focusFade) * focusFalloff(off / STRIP.focusFadeSpread)
          ).toFixed(3);
          if (off < nearestOff) {
            nearestOff = off;
            nearest = i;
          }
        }

        if (nearest !== spotlightAt) {
          if (spotlightAt >= 0) {
            items[spotlightAt].removeAttribute("data-spotlight");
          }
          items[nearest].setAttribute("data-spotlight", "");
          spotlightAt = nearest;
          setSpotlightRef.current(nearest);
        }
      };

      // The ticker hands its callback a timestamp, so it gets its own wrapper
      // rather than being read as a request to repaint regardless.
      const paintOnTick = () => paintFocus();

      paintFocusRef.current = () => paintFocus(true);
      measureStrip();
      paintFocus(true);
      gsap.ticker.add(paintOnTick);

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
          onRefresh: () => {
            measureStrip();
            paintFocus(true);
          },
          onUpdate: (self) => {
            const index = Math.round(self.progress * (total - 1)) + 1;
            setCounterIndex(index);
            scheduleSettleRef.current();
          },
        },
      });

      scrollTriggerRef.current = tween.scrollTrigger ?? null;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const playRipple = () => {
        if (reduced) {
          gsap.set(items, { autoAlpha: 1, y: 0 });
          return;
        }

        // Spotlight is already painted, so the origin is whichever tray
        // holds the centre line — first on a fresh load, later if restored.
        const origin = Math.max(
          0,
          items.findIndex((item) => item.hasAttribute("data-spotlight"))
        );

        if (origin > 0) {
          gsap.set(items.slice(0, origin), { autoAlpha: 1, y: 0 });
        }

        gsap.fromTo(
          items.slice(origin),
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

      // The welcome overlay covers a full reload; hold the ripple until it
      // lifts so the load-in is the first thing on the shelf, not behind it.
      const welcome = document.querySelector("[aria-label='Introduction']");
      let welcomeObserver: MutationObserver | null = null;
      if (welcome) {
        welcomeObserver = new MutationObserver(() => {
          if (document.contains(welcome)) return;
          welcomeObserver?.disconnect();
          welcomeObserver = null;
          playRipple();
        });
        welcomeObserver.observe(document.body, { childList: true, subtree: true });
      } else {
        playRipple();
      }

      return () => {
        welcomeObserver?.disconnect();
        gsap.ticker.remove(paintOnTick);
        paintFocusRef.current = null;
      };
    },
    { scope, dependencies: [total] }
  );

  return (
    <main
      ref={scope}
      className={styles.gallery}
      data-lightbox={lightboxOpen ? "true" : undefined}
    >
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
          {entries.map((entry, i) => (
            <figure
              key={entry.id}
              data-item
              className={`${styles.item} ${
                entry.screens ? styles.itemTray : ""
              }`}
            >
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
                aria-label={`Open ${entry.name}`}
              >
                <div
                  data-media
                  ref={(el) => {
                    mediaRefs.current[i] = el;
                  }}
                  className={`${styles.media} ${
                    entry.screens ? styles.mediaTray : styles.mediaPhoto
                  } ${
                    activeIndex === i
                      ? entry.project
                        ? styles.mediaOpen
                        : styles.mediaHidden
                      : ""
                  }`}
                  style={cardFocusVars(entry.cardFocus)}
                >
                  {entry.screens ? (
                    <TrayStage
                      screens={entry.screens}
                      alt={entry.name}
                      sizes="(max-width: 1099px) 60vw, 78vw"
                      priority={i < 3}
                      project={entry.project}
                      live={Boolean(entry.project?.prototype)}
                      playing={
                        spotlight === i &&
                        activeIndex === null &&
                        Boolean(entry.project?.prototype)
                      }
                      preload={
                        Math.abs(spotlight - i) <= 1 ? "metadata" : "none"
                      }
                      card={
                        entry.project ? (
                          <ProfileCard project={entry.project} />
                        ) : null
                      }
                    />
                  ) : (
                    <Image
                      src={entry.image}
                      alt={entry.name}
                      fill
                      sizes="(max-width: 1099px) 70vw, (max-width: 1439px) 36vw, 42vw"
                      priority={i < 3}
                      draggable={false}
                      unoptimized={entry.unoptimized}
                    />
                  )}
                </div>
              </button>
              <figcaption className={styles.caption}>
                <span className={`monoLabel ${styles.captionIndex}`}>
                  No. {String(i + 1).padStart(2, "0")} — {entry.captionKind}
                </span>
                <span className={`monoLabel ${styles.captionNotes}`}>
                  {entry.captionNotes}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

      </section>

      <p className={styles.counter} data-site-chrome="counter" aria-hidden="true">
        <span className={styles.counterDigit}>
          <span ref={counterTrackRef} className={styles.counterDigitTrack}>
            {entries.map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </span>
        </span>
        <span className={styles.counterSep}>—</span>
        <span>{total}</span>
      </p>

      {activeIndex !== null && (
        <DrinkLightbox
          entries={entries}
          thumbsLabel={thumbsLabel}
          activeIndex={activeIndex}
          originRect={openOrigin}
          originParts={openOriginParts}
          getOriginRect={getOriginRect}
          getOriginParts={getOriginParts}
          syncGalleryToIndex={syncGalleryToIndex}
          onClose={closeLightbox}
          onCloseBegin={() => restoreStripRef.current()}
          onChange={handleLightboxChange}
        />
      )}
    </main>
  );
}
