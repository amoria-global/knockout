# Connekyt Landing — Project Instructions

## UI/UX Design Directive (always apply for any UI work)

Whenever I ask you to create a new feature that needs UI, or to update/change existing UI, treat it as a DESIGN task, not a patch task. Follow this every time, without me having to restate it:

1. **Redesign, don't patch.** Build the component/screen fresh as a clean, self-contained unit first, then wire it into the codebase — rather than minimally editing existing markup. Prefer a modern rebuild over incremental tweaks unless I explicitly say "small change only."

2. **Design in isolation first.** Draft the component standalone (clean layout, no legacy baggage), get the visual result right, THEN integrate it with real data, routing, and imports. This gives greenfield design freedom while still landing in the real app.

3. **Honor brand tokens.** Use my design system: navy #083A85 and pink #F20C8F as brand colors, plus existing Tailwind config, spacing scale, and component library. Match the codebase's tokens — but apply them with fresh, intentional composition, not by copying whatever the old component did.

4. **Apply modern design principles by default:**
   - Generous, consistent whitespace and a clear spacing rhythm.
   - Strong typographic hierarchy (distinct sizes/weights for title, label, body, meta).
   - Clear visual grouping, alignment, and a defined layout grid.
   - Purposeful color — brand colors as accents, neutral surfaces for calm.
   - Subtle depth (soft shadows/borders/radius) — polished, never heavy.
   - Tasteful micro-interactions (hover, focus, transitions) where they add clarity.
   - Fully responsive (mobile-first) and accessible (WCAG-AA contrast, focus states, semantic markup).
   - Empty, loading, and error states designed, not left as afterthoughts.

5. **Aim for a portfolio-quality result** — the kind of clean, cohesive UI a strong design-focused build would produce, tailored to my brand. Avoid generic/templated defaults.

6. **Before finishing UI work,** briefly self-review against the above: hierarchy, spacing, responsiveness, states, and brand consistency. Fix anything that reads as unpolished.

## UI Build Workflow — Design in a Zero-Constraint Sandbox First

For ANY task involving new UI or redesigning existing UI, follow this two-phase workflow every time, automatically, without me restating it:

### Phase 1 — Greenfield design (zero legacy constraints)
- Create the component fresh in an isolated sandbox file, e.g. `app/_design-sandbox/<ComponentName>.preview.tsx` (or the project's equivalent).
- Design it as if the existing codebase does not exist. Do NOT read or mimic the old component's markup, structure, or styling decisions in this phase. Start from a clean slate.
- Use mock/placeholder data so nothing external constrains the layout.
- Focus purely on visual quality: layout, hierarchy, spacing, typography, color, states (default/hover/focus/loading/empty/error), responsiveness, accessibility.
- The ONLY things carried over from the real project are the brand tokens: navy #083A85, pink #F20C8F, and the base Tailwind scale. Everything else is a fresh design decision.

### Phase 2 — Integrate
- Once the sandbox component looks excellent, THEN adapt it into the real codebase: swap mock data for real props/state, wire routing, connect imports, align to the project's file conventions.
- Preserve the sandbox's visual design during integration — do not let old patterns "pull" it back toward the previous look. If the real codebase forces a compromise, tell me explicitly rather than silently reverting to the old style.
- After integrating, you may delete or keep the sandbox file — ask me which I prefer.

### Rules
- Never patch UI in place as a first move. Always design fresh, then integrate.
- If I say "small tweak only," skip Phase 1 and edit directly — otherwise always run both phases.
- Treat every UI task as a design deliverable, not a code edit. Aim for portfolio-quality output that stands on its own.

The greenfield sandbox lives at `app/_design-sandbox/` and is git-ignored, so previews never clutter commits.
