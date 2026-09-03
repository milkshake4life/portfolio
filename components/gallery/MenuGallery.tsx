"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cardFocusVars, drinks } from "@/lib/drinks";
import { EASE, COUNTER, DUR } from "@/lib/motion";
import DrinkLightbox, {
  type LightboxOrigin,
} from "@/components/gallery/DrinkLightbox";
import styles from "./MenuGallery.module.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const TOTAL = drinks.length;

function galleryProgress(index: number) {
  if (TOTAL <= 1) return 0;
  return index / (TOTAL - 1);
}

/**
 * "The Menu" — pinned horizontal gallery (Camille-style).
 * Vertical scroll drives the strip sideways; Lenis supplies the glide.
 * Click any image to open a fullscreen lightbox view.
 */
export default function MenuGallery() {
  const scope = useRef<HTMLElement>(null);
  const mediaRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterTrackRef = useRef<HTMLSpanElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const displayedIndexRef = useRef(1);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [openOrigin, setOpenOrigin] = useState<LightboxOrigin | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

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
      <section data-viewport className={styles.viewport}>
        <div data-track className={styles.track}>
          {drinks.map((drink, i) => (
            <figure key={drink.id} data-item className={styles.item}>
              <button
                type="button"
                className={styles.openBtn}
                onClick={(e) => {
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
