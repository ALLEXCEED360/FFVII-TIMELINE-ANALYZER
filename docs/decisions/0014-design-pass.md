# 0014 — The design pass

- **Status:** Accepted; its look and feel superseded by [0015](0015-game-menu-design.md)
- **Date:** 2026-09-29
- **Builds on:** [0007](0007-web-app.md), [0013](0013-hardening.md)

## Context

Blueprint §19 sets the direction: a serious digital archive influenced by FFVII, not a fan-site dashboard — a dark blue-black base, restrained Mako-green accents, subtle metallic touches, glass panels, technical typography, thin timeline lines and restrained glow. §21 asks for hover previews on the timeline, and §36 lists the polish that comes only once the functions are stable, always respecting reduced motion. The foundation (colours, fonts, grid background) was laid in Phase 4; each page since was built on it but styled locally.

## Decision

### A small design system, in `styles.css`

- **Panels** are dark glass: a subtle vertical gradient, a faint highlight along the top edge, a soft drop shadow and a light blur. **Linked panels** (`.panel-link`) light their edge in Mako and lift a pixel when pointed at or focused.
- **Page titles** (`.page-title`) share one size and weight; the label above them (`.eyebrow`) carries a small Mako diamond. A **hairline** (`.rule`) fading in from the edges, Mako at its centre, sits under the header.
- **Buttons** gain a primary variant (`.btn-primary`, a soft Mako glow) and a proper disabled state.
- **Motion** is short and quiet: pages settle in over 0.28 s, the selected timeline event breathes, and light travels along the home page's emblem. All of it stops under reduced motion; the travelling light is hidden, since it has no still state worth keeping.
- The design database the design tool offered suggested a generic light-blue enterprise dashboard; it was set aside for the blueprint's own direction.

### Pages

- **Home:** a hero with an emblem of the app's idea — four coloured lines, one per title, running as one story and then parting ways — beside the headline; a "Ways in" grid of the six sections with icons (Lucide); title cards that open each title's archive; the dataset in numbers, with a link to how facts are checked.
- **Timeline:** event names are set at an angle, so neighbours a few pixels apart never collide and every name is readable at normal zoom; the inspector column opens only once an event is selected, giving the chart the full width until then; hovering or focusing a marker shows a **preview card** (event, title, status, framing, other world).
- **Everywhere:** consistent page titles and eyebrows, glass panels, and lighting cards in Explore and on entity pages.

### Artwork, prepared but not yet downloaded

`src/art/manifest.ts` lists official artwork, each entry with its file, size, alt text, source and copyright; `<Artwork id>` renders an image only when the manifest has one, with its dimensions reserved so nothing shifts as it loads. Slots exist for the home hero and each title card. A **Credits** page (`/credits`, linked from the footer) lists every image with its source, the typefaces and their licences, and the project's own licences. The manifest is empty until the owner approves each download (`canon-and-sources.md` §11).

## Consequences

- ✅ The app reads as one designed product, while every page keeps the structure its tests and accessibility audit rely on (both unchanged and passing; WCAG 2.2 AA contrast still holds on the new glass).
- ✅ Adding artwork later is a matter of approving a file and adding a manifest entry.
- ❌ `backdrop-filter` costs some rendering on low-end devices; the blur is kept small.
- ❌ Initial JavaScript grew by 3 kB (the icons and home emblem), still within its budget (121 of 135 kB).
