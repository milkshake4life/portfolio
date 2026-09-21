"use client";

import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/PageTransition";
import { SOCIAL_LINKS } from "@/lib/about";
import styles from "./Nav.module.css";

const LINKS = [
  { href: "/", label: "Work", wordmark: "Work" },
  { href: "/about", label: "About", wordmark: "About" },
  { href: "/coffee", label: "Coffee", wordmark: "Coffee" },
] as const;

const FOOTER_ORDER = ["Email", "LinkedIn", "Resume"] as const;

const FOOTER_LINKS = FOOTER_ORDER.map((label) => {
  const link = SOCIAL_LINKS.find((item) => item.label === label);
  if (!link) {
    throw new Error(`Missing social link: ${label}`);
  }
  return link;
});

function getSection(pathname: string) {
  if (pathname.startsWith("/about")) {
    return LINKS.find((link) => link.href === "/about") ?? LINKS[0];
  }
  if (pathname.startsWith("/coffee") || pathname.startsWith("/gallery")) {
    return LINKS.find((link) => link.href === "/coffee") ?? LINKS[0];
  }
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
                  : href === "/coffee"
                    ? pathname.startsWith("/coffee") ||
                      pathname.startsWith("/gallery")
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

      <nav className={styles.footer} data-site-chrome="footer" aria-label="Contact">
        <ul className={styles.footerLinks}>
          {FOOTER_LINKS.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className={styles.footerLink}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel={
                  href.startsWith("mailto:") ? undefined : "noopener noreferrer"
                }
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
