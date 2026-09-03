"use client";

import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/PageTransition";
import styles from "./Nav.module.css";

const LINKS = [
  { href: "/", label: "Menu", wordmark: "The Menu" },
  { href: "/gallery", label: "Gallery", wordmark: "Gallery" },
  { href: "/about", label: "About", wordmark: "About" },
] as const;

function getSection(pathname: string) {
  if (pathname.startsWith("/gallery")) return LINKS[1];
  if (pathname.startsWith("/about")) return LINKS[2];
  return LINKS[0];
}

export default function Nav() {
  const pathname = usePathname();
  const section = getSection(pathname);

  return (
    <>
      <header className={styles.nav} data-site-chrome="top">
        <nav aria-label="Primary">
          <ul className={styles.links}>
            {LINKS.map(({ href, label }) => {
              const active =
                href === "/"
                  ? pathname === "/" || pathname.startsWith("/works")
                  : pathname.startsWith(href);
              return (
                <li key={href}>
                  <TransitionLink
                    href={href}
                    className={`${styles.link} ${active ? styles.active : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </TransitionLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <TransitionLink
        href={section.href}
        className={styles.wordmark}
        data-site-chrome="wordmark"
      >
        Ethan G.R. Lee — {section.wordmark}
      </TransitionLink>
    </>
  );
}
