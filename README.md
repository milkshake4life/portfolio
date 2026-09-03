# Ethan Lee — Portfolio

A dark, grayscale, cafe-themed portfolio. Color lives only inside the photography.

## Stack

- Next.js 15 (App Router, TypeScript)
- GSAP + `@gsap/react` — preloader, page transitions, scroll reveals
- Lenis — smooth scrolling, driven by the GSAP ticker
- Plain CSS with design tokens (no framework)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Where things live

| Path | Purpose |
| --- | --- |
| `app/styles/tokens.css` | The entire design system: grayscale ramp, type scale, spacing, easings. Change values here to retheme the whole site. |
| `lib/motion.ts` | Shared GSAP easings/durations — keep all animation pulling from these. |
| `lib/projects.ts` | Works menu + case-study data. |
| `lib/drinks.ts` | Gallery / "The Menu" drink data. |
| `lib/about.ts` | About bio, portrait path, and social links. |
| `components/` | Preloader, Nav, SmoothScroll, PageTransition, page sections. |
| `public/images/` | Photography referenced by the data files above. |

## Conventions

- Internal navigation uses `<TransitionLink>` (from `components/PageTransition.tsx`), not `next/link`, so the overlay wipe always plays.
- Scroll-entrance animation: attach the `useReveal()` ref to a container and mark children with `data-reveal` (optional `data-reveal-delay="0.1"`).
- No color anywhere in the UI — grayscale tokens only. Photography carries all color.
