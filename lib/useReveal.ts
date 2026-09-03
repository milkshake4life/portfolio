"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { EASE, DUR } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Scroll-entrance reveals. Attach the returned ref to a container, then
 * mark children with `data-reveal` (optionally `data-reveal-delay="0.2"`).
 * CSS sets [data-reveal] to opacity 0 so nothing flashes before GSAP runs.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const scope = useRef<T>(null);

  useGSAP(
    () => {
      const targets = gsap.utils.toArray<HTMLElement>(
        "[data-reveal]",
        scope.current
      );

      targets.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: DUR.slow,
            ease: EASE.out,
            delay: parseFloat(el.dataset.revealDelay ?? "0"),
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          }
        );
      });
    },
    { scope }
  );

  return scope;
}
