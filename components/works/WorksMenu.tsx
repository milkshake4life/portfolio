"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import { projectsByCategory, getProject } from "@/lib/projects";
import { EASE, DUR } from "@/lib/motion";
import ProjectProfileCard from "@/components/works/ProjectProfileCard";
import styles from "./WorksMenu.module.css";

gsap.registerPlugin(useGSAP, Flip);

const SECTIONS = projectsByCategory();
const HOVER_CLEAR_MS = 80;

const PROFILE_SEQUENCE = {
  menuExit: { duration: 0.78, x: -200, ease: "power3.inOut" },
  beat: 0.16,
  phoneFlip: { duration: 1.12, ease: EASE.out },
  beatBeforeCard: 0.08,
  cardEnter: { duration: 0.92, x: 160, ease: EASE.out },
  backEnter: { duration: 0.45 },
  cardExit: { duration: 0.62, ease: "power3.in" },
} as const;

function clearDrinkHoverScale(drink: HTMLElement | null) {
  if (!drink) return;
  const img = drink.querySelector("img");
  if (img) gsap.set(img, { clearProps: "transform" });
}

function hideProfileCard(card: HTMLElement, desktop: boolean) {
  gsap.set(card, {
    autoAlpha: 0,
    visibility: "visible",
    x: desktop ? PROFILE_SEQUENCE.cardEnter.x : 0,
    y: desktop ? 0 : 32,
  });
}

/**
 * Cafe menu docked left; right pane holds the drink preview.
 * Click a menu row → menu yields, phone FLIPs, profile card arrives.
 */
export default function WorksMenu() {
  const scope = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLSpanElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLParagraphElement>(null);
  const cardSlotRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const hoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cachedProject = useRef<ReturnType<typeof getProject>>(undefined);
  const profileTl = useRef<gsap.core.Timeline | null>(null);
  const openingRef = useRef(false);

  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [pinnedSlug, setPinnedSlug] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const displaySlug = hoveredSlug ?? pinnedSlug;
  const displayed = displaySlug ? getProject(displaySlug) : undefined;
  if (displayed) cachedProject.current = displayed;
  const cardProject = displayed ?? cachedProject.current;

  const isShowing = Boolean(displaySlug);
  const isPinned = Boolean(pinnedSlug);

  const clearHoverTimer = useCallback(() => {
    if (hoverClearTimer.current) {
      clearTimeout(hoverClearTimer.current);
      hoverClearTimer.current = null;
    }
  }, []);

  const getServingParts = useCallback(() => {
    const serving = cardSlotRef.current?.querySelector<HTMLElement>(
      "[data-serving]"
    );
    return {
      serving,
      drink: serving?.querySelector<HTMLElement>("[data-drink]") ?? null,
      drinkBlock:
        serving?.querySelector<HTMLElement>("[data-drink-block]") ?? null,
      cue: serving?.querySelector<HTMLElement>("[data-cue]") ?? null,
      card: serving?.querySelector<HTMLElement>("[data-profile-card]") ?? null,
      menu: menuRef.current,
      split: splitRef.current,
      back: backRef.current,
    };
  }, []);

  const previewProject = useCallback(
    (slug: string) => {
      if (profileOpen) return;
      clearHoverTimer();
      setHoveredSlug(slug);
    },
    [clearHoverTimer, profileOpen]
  );

  const endPreview = useCallback(() => {
    if (profileOpen) return;
    clearHoverTimer();
    hoverClearTimer.current = setTimeout(() => {
      setHoveredSlug(null);
      hoverClearTimer.current = null;
    }, HOVER_CLEAR_MS);
  }, [clearHoverTimer, profileOpen]);

  const openProfile = useCallback(
    (slug: string) => {
      if (profileOpen || openingRef.current) return;

      openingRef.current = true;
      clearHoverTimer();

      flushSync(() => {
        setHoveredSlug(null);
        setPinnedSlug(slug);
      });

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const desktop = window.matchMedia("(min-width: 900px)").matches;

      const startSequence = () => {
        const placeholder = placeholderRef.current;
        const cardSlot = cardSlotRef.current;
        const menu = menuRef.current;
        const split = splitRef.current;
        const detail = detailRef.current;

        gsap.killTweensOf(
          [placeholder, cardSlot, menu, split, detail].filter(Boolean)
        );
        if (placeholder) gsap.set(placeholder, { autoAlpha: 0 });
        if (cardSlot) {
          gsap.set(cardSlot, { autoAlpha: 1, y: 0, visibility: "visible" });
        }
        if (menu && split) {
          gsap.set([menu, split], { autoAlpha: 1, x: 0, y: 0 });
        }

        const { cue, card, back } = getServingParts();
        profileTl.current?.kill();

        if (reduced) {
          flushSync(() => setProfileOpen(true));
          if (menu && split) {
            gsap.set([menu, split], { autoAlpha: 0, pointerEvents: "none" });
          }
          if (cue) gsap.set(cue, { autoAlpha: 0 });
          if (card) gsap.set(card, { autoAlpha: 1, x: 0, y: 0, visibility: "visible" });
          if (back) gsap.set(back, { autoAlpha: 1, x: 0 });
          openingRef.current = false;
          return;
        }

        if (card) gsap.set(card, { autoAlpha: 0, visibility: "hidden" });
        if (back) gsap.set(back, { autoAlpha: 0, x: -12 });

        const tl = gsap.timeline({
          defaults: { overwrite: "auto" },
          onComplete: () => {
            openingRef.current = false;
          },
        });
        profileTl.current = tl;

        if (menu && split) {
          tl.to([menu, split], {
            x: desktop ? PROFILE_SEQUENCE.menuExit.x : 0,
            y: desktop ? 0 : -22,
            autoAlpha: 0,
            duration: PROFILE_SEQUENCE.menuExit.duration,
            ease: PROFILE_SEQUENCE.menuExit.ease,
            stagger: 0.04,
            pointerEvents: "none",
          });
        }

        if (cue) {
          tl.to(
            cue,
            { autoAlpha: 0, y: 10, duration: 0.34, ease: "power2.in" },
            "<0.14"
          );
        }

        tl.to({}, { duration: PROFILE_SEQUENCE.beat });

        tl.call(() => {
          const { drink: drinkEl } = getServingParts();
          let flipState: Flip.FlipState | null = null;
          if (drinkEl) {
            clearDrinkHoverScale(drinkEl);
            try {
              flipState = Flip.getState(drinkEl);
            } catch {
              flipState = null;
            }
          }

          flushSync(() => setProfileOpen(true));

          const { drink: drinkAfter, card: cardEl, back: backEl } =
            getServingParts();

          clearDrinkHoverScale(drinkAfter);
          if (cardEl) hideProfileCard(cardEl, desktop);
          if (backEl) gsap.set(backEl, { autoAlpha: 0, x: -12 });

          if (flipState && drinkAfter) {
            tl.add(
              Flip.from(flipState, {
                duration: PROFILE_SEQUENCE.phoneFlip.duration,
                ease: PROFILE_SEQUENCE.phoneFlip.ease,
                absolute: true,
                scale: true,
                fade: false,
              })
            );
          }

          tl.to({}, { duration: PROFILE_SEQUENCE.beatBeforeCard });

          if (cardEl) {
            tl.to(cardEl, {
              autoAlpha: 1,
              x: 0,
              y: 0,
              duration: PROFILE_SEQUENCE.cardEnter.duration,
              ease: PROFILE_SEQUENCE.cardEnter.ease,
            });
          }

          if (backEl) {
            tl.to(
              backEl,
              {
                autoAlpha: 1,
                x: 0,
                duration: PROFILE_SEQUENCE.backEnter.duration,
                ease: EASE.out,
              },
              "-=0.2"
            );
          }
        });
      };

      requestAnimationFrame(() => requestAnimationFrame(startSequence));
    },
    [clearHoverTimer, getServingParts, profileOpen]
  );

  const backToMenu = useCallback(() => {
    openingRef.current = true;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const desktop = window.matchMedia("(min-width: 900px)").matches;
    const { drink, card, back, menu, split } = getServingParts();
    const cardFrame = cardSlotRef.current?.parentElement;

    profileTl.current?.kill();

    if (reduced || !drink) {
      openingRef.current = false;
      setProfileOpen(false);
      return;
    }

    const cleanupClose = () => {
      const { drink: drinkEl, drinkBlock } = getServingParts();
      if (drinkEl) gsap.set(drinkEl, { clearProps: "transform,willChange" });
      if (drinkBlock) gsap.set(drinkBlock, { clearProps: "overflow" });
      if (detailRef.current) {
        gsap.set(detailRef.current, { clearProps: "overflow" });
      }
      if (cardFrame) gsap.set(cardFrame, { clearProps: "overflow" });
    };

    const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
    profileTl.current = tl;

    // 1 — Profile card exits right, back link fades
    if (back) {
      tl.to(back, { autoAlpha: 0, x: -10, duration: 0.28, ease: "power2.in" }, 0);
    }

    if (card) {
      tl.to(
        card,
        {
          autoAlpha: 0,
          x: desktop ? PROFILE_SEQUENCE.cardEnter.x : 0,
          y: desktop ? 0 : 24,
          duration: PROFILE_SEQUENCE.cardExit.duration,
          ease: PROFILE_SEQUENCE.cardExit.ease,
        },
        0
      );
    }

    // Same beat as open: card settles, then phone, then menu.
    const phoneAt = PROFILE_SEQUENCE.cardExit.duration + PROFILE_SEQUENCE.beat;

    tl.add(() => {
      const { drink: drinkEl } = getServingParts();
      if (!drinkEl) {
        cleanupClose();
        openingRef.current = false;
        return;
      }

      clearDrinkHoverScale(drinkEl);
      gsap.set(drinkEl, { willChange: "transform", force3D: true });
      const flipState = Flip.getState(drinkEl);

      if (menu && split) {
        gsap.set([menu, split], {
          autoAlpha: 0,
          x: desktop ? PROFILE_SEQUENCE.menuExit.x : 0,
          y: desktop ? 0 : -22,
          pointerEvents: "none",
        });
      }

      if (detailRef.current) gsap.set(detailRef.current, { overflow: "visible" });
      if (cardFrame) gsap.set(cardFrame, { overflow: "visible" });

      flushSync(() => setProfileOpen(false));

      const {
        drink: drinkAfter,
        drinkBlock: blockAfter,
        cue: cueAfter,
        menu: menuAfter,
        split: splitAfter,
      } = getServingParts();

      clearDrinkHoverScale(drinkAfter);
      if (drinkAfter) gsap.set(drinkAfter, { willChange: "transform", force3D: true });
      if (blockAfter) gsap.set(blockAfter, { overflow: "visible" });
      if (cueAfter) gsap.set(cueAfter, { autoAlpha: 0, y: 10 });

      const rest = Flip.from(flipState, {
        duration: PROFILE_SEQUENCE.phoneFlip.duration,
        ease: PROFILE_SEQUENCE.phoneFlip.ease,
        absolute: true,
        scale: true,
        nested: true,
        fade: false,
        force3D: true,
      });

      rest.to({}, { duration: PROFILE_SEQUENCE.beat });

      if (menuAfter && splitAfter) {
        rest.to([menuAfter, splitAfter], {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration: 0.82,
          ease: EASE.out,
          stagger: 0.045,
          pointerEvents: "auto",
        });
      }

      if (cueAfter) {
        rest.to(
          cueAfter,
          { autoAlpha: 1, y: 0, duration: 0.42, ease: EASE.out },
          "-=0.24"
        );
      }

      rest.eventCallback("onComplete", () => {
        cleanupClose();
        openingRef.current = false;
      });
      profileTl.current = rest;
    }, phoneAt);
  }, [getServingParts]);

  useEffect(() => {
    return () => clearHoverTimer();
  }, [clearHoverTimer]);

  useEffect(() => {
    if (!isPinned && !profileOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (profileOpen) {
        backToMenu();
        return;
      }
      setPinnedSlug(null);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPinned, profileOpen, backToMenu]);

  // Initial reveal — menu + right pane together
  useGSAP(
    () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const targets = [
        menuRef.current,
        splitRef.current,
        detailRef.current,
      ].filter(Boolean);
      if (!targets.length) return;

      if (reduced) {
        gsap.set(targets, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: DUR.slow,
          ease: EASE.out,
          delay: 0.08,
          stagger: 0.05,
        }
      );
    },
    { scope, dependencies: [] }
  );

  // Swap placeholder ↔ drink serving
  useGSAP(
    () => {
      const placeholder = placeholderRef.current;
      const cardSlot = cardSlotRef.current;
      if (!placeholder || !cardSlot) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const duration = reduced ? 0 : DUR.base;
      const ease = EASE.out;
      const desktop = window.matchMedia("(min-width: 900px)").matches;

      if (isShowing) {
        gsap.to(placeholder, {
          autoAlpha: 0,
          duration: reduced ? 0 : DUR.fast,
          ease,
          overwrite: "auto",
        });
        gsap.fromTo(
          cardSlot,
          {
            autoAlpha: 0,
            y: desktop ? 14 : 10,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration,
            ease,
            overwrite: "auto",
          }
        );
      } else {
        gsap.to(cardSlot, {
          autoAlpha: 0,
          y: desktop ? 10 : 8,
          duration,
          ease,
          overwrite: "auto",
          onComplete: () => {
            cachedProject.current = undefined;
          },
        });
        gsap.to(placeholder, {
          autoAlpha: 1,
          duration,
          ease,
          overwrite: "auto",
          delay: reduced ? 0 : 0.08,
        });
      }
    },
    { scope, dependencies: [isShowing] }
  );

  // Soft refresh when the visible project changes (drink mode only)
  useGSAP(
    () => {
      if (profileOpen || openingRef.current) return;
      const inner = cardSlotRef.current?.querySelector("[data-serving]");
      if (!inner || !displaySlug) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduced) return;

      gsap.fromTo(
        inner,
        { autoAlpha: 0.4 },
        { autoAlpha: 1, duration: DUR.fast, ease: EASE.out }
      );
    },
    { scope, dependencies: [displaySlug, profileOpen] }
  );

  return (
    <main
      ref={scope}
      className={`${styles.page} ${isShowing ? styles.isOpen : ""} ${
        profileOpen ? styles.isProfile : ""
      }`}
    >
      <button
        ref={backRef}
        type="button"
        className={styles.back}
        onClick={backToMenu}
        aria-hidden={!profileOpen}
        tabIndex={profileOpen ? 0 : -1}
      >
        <span className={styles.backArrow} aria-hidden="true">
          ←
        </span>
        Back to Menu
      </button>

      <div className={styles.stage}>
        <div ref={menuRef} className={styles.menu} data-menu>
          <header className={styles.header}>
            <span className={styles.headerMeta}>Menu</span>
            <span className={styles.headerMeta}>Ethan G.R. Lee</span>
          </header>

          <div className={styles.titleBlock}>
            <h1 className={styles.title}>My Works</h1>
            <span className={styles.titleRule} aria-hidden="true" />
          </div>

          <div className={styles.sections}>
            {SECTIONS.map(({ id, label, projects: items }) => (
              <section
                key={id}
                className={styles.section}
                aria-labelledby={`section-${id}`}
              >
                <h2 id={`section-${id}`} className={styles.sectionTitle}>
                  {label}
                </h2>
                <ul className={styles.list}>
                  {items.map((project) => {
                    const active = displaySlug === project.slug;
                    const pinned = pinnedSlug === project.slug;
                    const hasNote = Boolean(project.menuNote);
                    return (
                      <li key={project.slug}>
                        <button
                          type="button"
                          className={`${styles.item} ${
                            hasNote ? styles.itemHasNote : ""
                          } ${active ? styles.itemActive : ""}`}
                          onMouseEnter={() => previewProject(project.slug)}
                          onMouseLeave={endPreview}
                          onFocus={() => previewProject(project.slug)}
                          onBlur={endPreview}
                          onClick={() => openProfile(project.slug)}
                          aria-pressed={pinned}
                          disabled={profileOpen}
                        >
                          <span className={styles.itemCopy}>
                            <span className={styles.itemName}>
                              {project.title}
                            </span>
                            {project.menuNote ? (
                              <span className={styles.itemNote}>
                                {project.menuNote}
                              </span>
                            ) : null}
                          </span>
                          <span className={styles.itemPrice}>
                            {project.dateRange}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <span
          ref={splitRef}
          className={styles.split}
          aria-hidden="true"
          data-split
        />

        <div ref={detailRef} className={styles.detailPane}>
          <p
            ref={placeholderRef}
            className={styles.placeholder}
            aria-hidden={isShowing}
          >
            Explore our drinks
          </p>

          <div className={styles.cardFrame}>
            <div
              ref={cardSlotRef}
              className={styles.cardSlot}
              aria-hidden={!isShowing}
              inert={!isPinned && !profileOpen ? true : undefined}
            >
              {cardProject ? (
                <div data-card-inner>
                  <ProjectProfileCard
                    project={cardProject}
                    mode={profileOpen ? "profile" : "drink"}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
