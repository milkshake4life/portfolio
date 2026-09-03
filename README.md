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
| `lib/projects.ts` | Case-study data. Swap placeholder entries for real projects. |
| `lib/drinks.ts` | "The Menu" data. Swap placeholder entries for real drink photos + notes. |
| `components/` | Preloader, Nav, SmoothScroll, PageTransition, page sections. |
| `public/images/` | Placeholder imagery. Replace files in place, keeping the same paths. |

## Swapping in real content

1. Drop photos into `public/images/...` using the paths referenced in `lib/projects.ts` and `lib/drinks.ts` (or update those paths).
2. Edit the copy in `lib/projects.ts`, `lib/drinks.ts`, and `components/about/AboutContent.tsx`.
3. Add your resume at `public/resume.pdf`.

To regenerate the gray placeholder images at any time:

```bash
node scripts/generate-placeholders.mjs
```

## Conventions

- Internal navigation uses `<TransitionLink>` (from `components/PageTransition.tsx`), not `next/link`, so the overlay wipe always plays.
- Scroll-entrance animation: attach the `useReveal()` ref to a container and mark children with `data-reveal` (optional `data-reveal-delay="0.1"`).
- No color anywhere in the UI — grayscale tokens only. Photography carries all color.
