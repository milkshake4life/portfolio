"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { NAV } from "@/lib/motion";
import styles from "./PageTransition.module.css";

type TransitionContextValue = {
  navigate: (href: string) => void;
};

const TransitionContext = createContext<TransitionContextValue>({
  navigate: () => {},
});

export function useTransition() {
  return useContext(TransitionContext);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Quick fade between routes so section changes feel immediate, not delayed.
 * Use <TransitionLink> (below) instead of next/link for internal navigation.
 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<string | null>(null);
  const transitioningRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname || transitioningRef.current) return;

      if (prefersReducedMotion()) {
        router.push(href);
        window.scrollTo(0, 0);
        return;
      }

      transitioningRef.current = true;
      pendingRef.current = href;

      gsap.killTweensOf(overlayRef.current);
      gsap.set(overlayRef.current, { opacity: 0 });

      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: NAV.coverDuration,
        ease: NAV.coverEase,
        onComplete: () => {
          router.push(href);
          window.scrollTo(0, 0);
        },
      });
    },
    [pathname, router]
  );

  // New route has rendered behind the overlay — fade it away immediately.
  useEffect(() => {
    if (!transitioningRef.current || !pendingRef.current) return;
    if (pendingRef.current !== pathname) return;

    pendingRef.current = null;

    gsap.killTweensOf(overlayRef.current);
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: NAV.revealDuration,
      ease: NAV.revealEase,
      onComplete: () => {
        transitioningRef.current = false;
      },
    });
  }, [pathname]);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <div ref={overlayRef} className={styles.overlay} aria-hidden="true" />
    </TransitionContext.Provider>
  );
}

export function TransitionLink({
  href,
  children,
  className,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { navigate } = useTransition();

  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
