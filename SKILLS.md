# Project Skills

> **How to use this file:**
> 1. Tick `[x]` the skills that apply to *this* project. Leave the rest unticked.
> 2. In any prompt, type `@SKILLS.md` — Claude reads this file and applies **only the ticked skills** to its work in this project.
>
> All 18 skills are installed globally at `~/.claude/skills/`, so they auto-discover and can be invoked by name (`/react-patterns`, `/ui-ux-pro-max`, etc.). This file just narrows *which subset* is relevant here.

---

## Project context

**Stack / runtime:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 (+ `@tailwindcss/postcss`), `next-intl` i18n. Animation: GSAP + ScrollTrigger and Lenis (scroll-scrubbed peel-mask sections), Framer Motion (component motion), Three.js + @react-three/fiber (3D globe). Project name: `connekt`.

**Project type:** Marketing landing page + app (photographer/event platform). The landing page is `app/page.tsx` (~5,790 lines) plus 30+ components in `app/components/`.

**Conventions / non-negotiables:**
- Keep the two animation engines in their lanes: **GSAP/ScrollTrigger + Lenis** for scroll-scrubbed/pinned section effects, **Framer Motion** for component-level motion. No skill covers GSAP/Lenis directly — match the existing patterns in `app/page.tsx`.
- Glassmorphism + gradient visual language; styling via Tailwind v4 utilities and `app/globals.css` (~1,293 lines).
- Mobile-first: recent work is heavy on mobile-layout fixes (notch/safe-area, fixed-nav, clipping). Verify breakpoints before calling layout work done.
- No preloader (client requested it disabled — code kept for reuse).

---

## Skills — tick the relevant ones

### Frontend & UI

- [x] **ui-ux-pro-max** — Master UI/UX intelligence: styles, color palettes, font pairings, UX guidelines. Use for any UI design decision.
- [x] **ui-styling** — Tailwind styling, accessible patterns, dark mode, theming.
- [x] **design-system** — Token architecture (primitive → semantic → component), CSS variables, spacing/typography scales.
- [ ] **design** — Brand identity, logos, corporate identity, presentations, banners, icons, social photos.
- [ ] **brand** — Brand voice, messaging frameworks, style guides, brand-consistency review.
- [ ] **banner-design** — Banners for social, ads, hero sections, print.
- [ ] **slides** — Strategic HTML presentations with Chart.js.
- [x] **framer-motion** — Animations for React/Next.js: transitions, scroll triggers, layout animations, gestures, AnimatePresence.

### React / Web

- [x] **react-patterns** — React 19 performance and composition patterns: re-render prevention, server/client boundaries, bundle optimization.

### Mobile

- [ ] **react-native** — React Native + Expo patterns. (Not relevant — this is web Next.js.)

### Quality / Review

- [x] **code-review** — Deep code review covering React 19, TypeScript. Use before merging.
- [ ] **codex-review** — Independent second-opinion review via OpenAI Codex CLI.
- [ ] **ux-audit** — Walks a live web app as a real user to find usability/behavioural bugs.
- [x] **responsiveness-check** — Tests responsive layout across viewport widths via browser automation. Detects breakpoint regressions.

### DevOps / Docs / Quality

- [x] **git-workflow** — Guided git workflows: prepare PRs, clean branches, resolve merge conflicts, squash-and-merge.
- [ ] **vitest** — Vitest testing setup. (No test suite present yet.)
- [ ] **project-health** — Project setup/audit: settings, CLAUDE.md, permissions, secrets, stale docs.
- [ ] **app-docs** — Generate user documentation with screenshots via browser automation.

---

## Always apply

- Follow the conventions in **Project context** above.
- When styling UI, prefer Tailwind utilities + existing `globals.css` patterns over raw inline hex/spacing.
- Mobile-first responsive — verify breakpoints before declaring layout work done.

---

## Force-load a skill into context

If a ticked skill doesn't activate automatically:

```
@~/.claude/skills/react-patterns/SKILL.md  help me split app/page.tsx
```
