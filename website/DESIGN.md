# Mantis Discovery: design notes

What the site is built from and why, so later changes stay consistent. Content lives in
`src/data/site.ts`; the files named below hold each system.

## Concept

Every figure is computed, not illustrated. Each paper has a plate that draws the object the paper studies,
in pencil first, and inks it only when the paper's own check passes, with live readings beside it ("Lines
tested 12,408", "Missed the barrier 0"). The motion verb across the site is **draft, then ink**: lines creep
in at plotter speed and the ink strikes over them in one fast pass.

Two colours carry one idea: **azure is people and chartreuse is AI.** The hero torus has a heat source for
each, and the method figure has a strand for each.

## Brand

Discovery wears the Mantis brand (mantis.csail.mit.edu): its mark (`public/brand/mantis-mark.png`, drawn as a
CSS mask), MantisSans (Inter 4.0) and MantisMono (Space Mono), its night ground and ink. The site is dark only.

| Role | Where | Value |
|---|---|---|
| ground | `--c-bg` | `#080B10` night |
| ink | `--c-fg` | `#ECEEEA` |
| muted text | `--c-muted` | `#A8AAA9`, 8.4:1 on night |
| pencil | `--c-draft` | `#9FABC7` laurel |
| hairlines | `--c-line`, `--c-line-strong` | ink at 12% and 24% |
| focus, selection | `--c-accent` | `#006AFF` azure |
| people | `stage.ts`, `MethodLoop.tsx` | `#3D8BFF`, azure lightened for the night ground |
| AI | `stage.ts`, `MethodLoop.tsx` | `#B6D034` chartreuse |

Each paper's plate also has its own ink and draft hue (`src/plates/colors.ts`), all at least 4.5:1 on night.
Nothing else gets colour: no gradients, no glows, no decorative dots.

**Type.** MantisSans for everything (display weight 500, tracking -0.045em), MantisMono for small labels and
readings, STIX Two Text for the papers' own sentences and mathematics, and an Inter subset for the glyphs the
brand cut lacks (Greek, arrows, math). The scale is `--t-mega` to `--t-xs` in `globals.css`; headings are
64 px at 1440.

**Grid.** 12 columns, `--gutter` 16 to 32 px, `--margin` 20 to 60 px, one column on phones. Radius 0
everywhere. The only marks are squares: □ open, ■ shown.

## Motion

- One clock. Everything runs on the GSAP ticker (`src/engine`) with Lenis for smooth scroll: no other
  `requestAnimationFrame` loops and no scroll listeners. Figures pause off screen and in hidden tabs.
- Eases: expo.out for the ink strike, expo.inOut for the page carriage, power3.out for small UI, linear for
  drafting.
- Page transition: the carriage pass, a pencil line sweeping across with the ground behind it.
- Hover: nav words draw a dashed pencil line that inks solid; buttons flood with pencil from the left; index
  rows turn □ into ■ and redraw the sticky plate; inline links keep their underline.
- Reduced motion: no smooth scroll, no WebGL, no scrubbing. The torus is one settled still, plates draw
  finished, and the method figure is static and changes in steps.

## Systems

### Plates (`src/plates`, `src/components/Plate.tsx`)

One module per paper (see `src/plates/README.md`). A Canvas 2D plotter drafts the scene, inks it and runs the
check with live readings. The server renders the pencil draft into the first HTML frame (`svg.tsx`), so there
is a figure before JavaScript loads. Modes: `fixed` (paper pages, 404), `cycle` (Lab) and `stage` (the
research index, where the row you point at, focus or scroll to redraws the sticky plate). The 404 is an open
problem: the unit square with no barrier, where every line gets through.

### Hero torus and scroll stage (`src/hero`, `src/components/HeroTorus.tsx`)

- Heat flows on a torus (R 1, r 0.42) under the Laplace-Beltrami operator, from two sources: one follows the
  visitor's pointer (people) and one wanders (AI). Under both lies a ground field (`ambient()`): eight slow
  waves around the ring and the tube whose strengths and phases drift at unrelated rates, so the whole
  surface swells, thins and warps unevenly and never repeats. The tube swells where it is warm, and the ring
  widens, lifts and dips with its cross-section (`meshPoint`, mirrored in the vertex shader).
- It is drawn as a cloud of GL points (OGL) on one fixed canvas behind the page (`stage.ts`), seen from the
  side (TILT 0.6, ROLL -0.4): pencil where cold, azure and chartreuse near the sources, ink where both are
  warm.
- The same points are the scroll's particles. Each has three homes: the torus, a cell of the Mantis demo
  beside "Built on Mantis", and a cell of the film's poster. The cloud trails the scroll on a critically
  damped spring (`FOLLOW`), points leave and land in the order of their cell (top rows first), and each
  picture's real image fades in over the last 35% of the flight. Scrolling up runs it back and pauses the
  film.
- Compositing: colour and alpha both add, with alpha set to the brightest channel, so the canvas always holds
  valid premultiplied colour. Colour written with zero alpha shows in headless Chromium but vanishes in
  Safari and in Chrome on a Mac, so check WebGL changes in a real GPU browser.
- The server renders a pencil wireframe as the first frame and the figure without JavaScript. Without WebGL
  the wireframe stays and the pictures show as they are.

### Method figure (`src/components/MethodLoop.tsx`)

A (2, 5) torus knot: one strand that winds the ring twice and crosses itself at the five stages (Review,
Question, Attempt, Analyze, Check). Its two passes are people (azure) and AI (chartreuse), going over and
under in turn. It is pencilled in and inked up to the stage being read, wider and brighter where the strand
comes near (its height on the torus is cos πs), with a ring at each crossing, a dial round the counter and a
legend. Two short pulses run along the strand at rest. Phones get a sticky strip with the stage name and five
ticks.

### Film and demo

The Mantis agent-inspector recording plays muted beside "Built on Mantis" while it is on screen. The film
("A walkthrough", 75 s, WebVTT captions) is a click-to-play poster in columns 5 to 12; the video loads on
request.

## Content rules

- Plain first person plural. No em or en dashes, no aphorism headings, no forced triads, no "from X to Y"
  ranges. Paper abstracts and the "shows / does not claim" lists stay close to the papers' own wording.
- The human role stays implicit: never "human-led", never "AI alone". The lab is not described as a student
  group (it includes PhD students). Say "Research" and "papers", not "preprints".
- No labels, captions or claim card on the hero torus.
- Team: the owner's list plus everyone who answered the lab's sign-up form. Bios come only from each
  person's research answer, with no contact details.
- Olympiad logos are the organizations' official files turned white (`public/brand/olympiads`).

## Open items

- `site.url` is a placeholder; canonical URLs, Open Graph, the sitemap and robots read it.
- Zenodo record 23484622 serves another record's PDF, so its page shows only the title and DOI until the
  record is fixed.
- Abhijay Gangarapu, Devom Brahmbhatt, Krish and Taksh Kothari have no bio yet, and two co-lead bios are a
  single line.
- The footer's "part of Mantis" wording is still to confirm.

## Notes for maintainers

- Cache Components stays off (`next.config.ts`): it keeps old routes mounted inside `<Activity>`, and the
  motion engine initializes whatever is in the document.
- next/font sizes its Arial fallback for Inter's natural width and ignores the brand's `size-adjust`, so
  `globals.css` declares its own 'MantisSans Fallback' (101.85%). Re-measure if the brand's size changes.
- In GLSL, `pow()` of a negative number is NaN, and `sin(π)` rounds just below zero in float32: clamp first.
- `node scripts/stix-subset.mjs` re-cuts the STIX Two and Inter subsets after the content gains new symbols.
