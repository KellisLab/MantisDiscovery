# Mantis Discovery: design notes

What the site is built from and why, so later changes stay consistent. Content lives in
`src/data/site.ts`; the files named below hold each system.

## Concept

Every figure is computed from the paper, not illustrated. Each paper has a short 3D film of its main result,
built from the paper's own numbers and data (the clique figure is drawn from the certificate files), played
in beats with one plain caption per beat set as text under it. The motion verb across the site is **draft,
then ink**: lines creep in at plotter speed and the ink strikes over them in one fast pass.

Two colours carry one idea in the hero: **azure is people and chartreuse is AI**, the torus's two heat
sources.

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
| people | `stage.ts` | `#3D8BFF`, azure lightened for the night ground |
| AI | `stage.ts` | `#B6D034` chartreuse |

Each paper's figure has its own lead and second hue: opaque sets mint `#3DDBB4` and sky `#62D0FF`, clique
minors amber `#FFB547` and coral `#FF8A5C`, gyrokinetics azure `#4F9DFF` and violet `#A285FF`, elliptic
solvers rose `#FF6F91` and violet. The lead colour also tints the figure frame's corner ticks (`Plate.tsx`).
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
  rows turn □ into ■ and put their figure on the sticky plate; inline links keep their underline.
- Reduced motion: no smooth scroll, no WebGL, no scrubbing. The torus is one settled still, and figures
  show their poster (a frame with labels) and its caption until the visitor presses Play.

## Systems

### Figures (`graphics/`, `src/components/Plate.tsx`)

Each paper's figure is a 3D film written with Kinetograph (kinetograph.dev, a Remotion-style renderer with
its own GPU 3D layer) in `graphics/src`, one composition per paper plus `void` for the 404. A 3D scene is
lit by a generated studio light (`scripts/env.mjs`) and a 2D layer is drawn exactly over it with the same
camera (`kit3d.tsx`), for hairlines and numbers. Surfaces and the torus are glTF files written by
`scripts/models.mjs`, which also computes the elliptic figure's Green's function (79.9% outside the window,
checked by a direct solve). `node render.mjs` renders each film (960 px H.264, about 1 to 3 MB) and its poster
into `public/media/figures/`, and writes the beat start times to `src/data/figure-timing.json`.

- Opaque sets: a slab for the unit square, the classic fence as walls, lines as beams that all stop on it,
  the theorem's hull and distances, the 105 + 45 cases as tiles turning over, and the open gap on a number line.
- Clique minors: the paper's K56 certificate in H, 100 vertices contracting into 56 branch sets, all 1,540
  pairs checked in the verifier's order, then the negative control failing at (0, 23).
- Gyrokinetics: a cut-away torus with nested flux surfaces and passing and trapped particles (a schematic),
  the surface sin(δt)/(δt) with its two limits, and the 23.2% between the two stationary fields.
- Elliptic solvers: the discrete Green's function on a 32 × 32 grid as bars with the 7 × 7 window, the
  64 blocks, and smooth and white forcings beside the 6.1% and 67.0% errors.

`Plate.tsx` plays a figure muted while it is on screen and sets the caption for the beat it is on (site.ts
holds one caption per beat; a mismatch with the timing file throws at build). Modes: `fixed` (paper pages,
the Method page, 404), `cycle` (Lab) and `stage` (the research index, where the row you point at, focus or
scroll to puts its figure on the sticky plate). The 404 is an open problem: the unit square with no
barrier, where every line gets through.

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

### Method page (`src/app/method`)

Written the way a lab's methods page is: a title ("How we work"), one plain sentence under it, and four
sections, each a heading on the left with paragraphs on the right (Running a project, Checking results, An
example, Publishing). Links sit inline in the prose (`Prose.tsx` reads `[text](href)`). The example is the
Higman-Sims bound in the clique minors paper, told in order: the open question in the project notes, the
early draft that claimed χ − 8, the audit that found an inequality used the wrong way round, the χ − 6
rewrite and the χ − 2 in the paper. Figure 1 shows the four records as panels a to d, cut from the walkthrough
recording (`public/media/mantis/method-*.webp`, each opens full size); Figure 2 is the clique figure. The
owner rejected an earlier version (sticky panel, five stage cards with AI and Researchers columns, a large
bound counter, slogan headings) as reading like AI, so keep this page in plain prose.

### Our approach (home) and each work's space in Mantis

After the film, the home page lays out how the lab works in four parts of Mantis: geometric reasoning (the
map of a project's records), traceability (every attempt, failure and fix is a record with its source and
status), audits and certificates. Each has one plain paragraph, the benefit, and a real still of the lab's
own spaces, cropped from the recordings behind the film (`public/media/mantis/`). Each paper row says how
many records its space holds and which of the four the work used, and each paper page has an "In Mantis"
panel with a still of its space. Every claim there comes from the recordings, their logs or the shot log of
the film; a work only lists a part of Mantis it can be shown to have used.

### Film and demo

The Mantis agent-inspector recording plays muted in the home page's Mantis section while it is on screen.
The film ("Walkthrough", 75 s, WebVTT captions) is a click-to-play poster in columns 5 to 12; the video loads on
request.

### Posters (`posters/`)

Each work-in-progress project has a 48 × 36 inch poster, typeset with LuaLaTeX (`latexmk -lualatex`) from
`posters/<slug>.tex` and the shared `mdposter.sty`. The owner asked for lab-quality posters and then for a more
premium look than the first version, so the system is set like a printed research poster:

- A night header band (`#0B0F16`) with the Mantis mark, a mono kicker ("Work in progress · field") and the
  title in Inter Medium, then three columns on warm paper (`#FAF9F6`) between hairlines, and a footer.
- Inter for text, IBM Plex Mono for labels and numbers, STIX Two Math for mathematics, all OpenType files
  from the TeX tree. Body 33 pt, headings 52 pt, figure labels 21 to 26 pt.
- Numbered sections (a hairline, a mono number, a heading): The question, How we are approaching it, What we
  have so far (results in pale panels with a blue rule), the figures, In Mantis (a still of the project's
  space, its record count, the open record and one more), Open questions.
- Columns run from header to footer and the gaps between sections share the spare height, so each poster is
  composed until no column has more than about 4 inches to spare. `mdcol` logs `MDCOL slack` per column in
  the LaTeX log; check it after any change to the text.
- Figures are matplotlib scripts in `posters/figures/` (`style.py` sets the fonts and the deep blue
  `#2D4BA0` with one warm signal `#D2602A`). Each is laid out at the column width, 14.13 in, and placed at
  that width, so its type keeps the sizes set in `style.py`; `save()` prints the scale and flags any figure
  that would be resized. Every figure is computed: the Sidon difference set is checked, the permanents
  counts come from homotopy continuation (cached in `out/permanents-counts.npy`, `--recompute` to redo),
  KRvK is solved by retrograde analysis (`krvk.py`, checked against the known 16-move maximum), the
  coreset ridge path and the Gibbs toy assert what they show. Toy examples say so in their captions.
- Every figure script asserts the numbers it draws, against the paper's reported values where there are any.
  Two of those assertions caught real errors on 26 Oct: the NS4A charges only reproduce with Biopython's
  residue-specific terminal pKa values, and the three-state capture bound is a sum of positive parts rather
  than a maximum. Keep the assertions when editing a script; they are the only check that a figure still
  says what the paper says.
- `sh posters/build.sh` runs the figure scripts, builds every poster, and copies each PDF with a 1,152 px
  and a 576 px WebP preview into `public/media/posters/` for the site; `sh posters/build.sh <slug>` rebuilds
  one poster without the figures.

## Content rules

- Plain first person plural. No em or en dashes, no forced triads, no "from X to Y" ranges. Paper abstracts
  and the "shows / does not claim" lists stay close to the papers' own wording.
- No slogans (owner, 25 Oct). Headings name what the section holds: Mantis, Walkthrough, Our approach,
  Research, Work in progress, The lab, Team, Joining the lab, Contact, Page not found. No taglines,
  punchline openers or catchy phrases such as "One result, start to finish" or "Worked on by the brightest
  young minds".
- Write full sentences with a subject and a verb (owner, 25 Oct). Ledes, summaries, captions and notes that
  open with a bare noun phrase read as slogans: the owner flagged "Projects still under way, each on a poster
  with its question, results so far and open questions". So the archive lede is "We have published four
  papers so far, and all of them are free to read on Zenodo", not "Four papers so far, each free to read on
  Zenodo". Keep lists of three for things that really come in threes, and don't repeat a sentence between
  sections.
- The film's narration (`public/media/mantis-discovery-demo.vtt`) still has lines in the old voice, such as
  "Mantis. Keep the work behind the result." The captions have to match the audio, so changing them means
  re-voicing the film.
- The human role stays implicit: never "human-led", never "AI alone". The lab is not described as a student
  group (it includes PhD students). Say "Research" and "papers", not "preprints".
- The hero is the lab's name and two plain sentences: "We work in mathematics, machine learning, physics
  and biology. We do our research in Mantis, a knowledge platform built at MIT CSAIL." No slogan, and the
  site never says the lab automates discovery. The Open Graph image (`public/og.png`) is a capture of the
  hero, so re-shoot it when the hero changes.
- No labels, captions or claim card on the hero torus.
- Four papers, not fifteen: two in mathematics (opaque sets, clique minors), one in physics (the zonal
  gyrokinetic model) and one in machine learning (locality in elliptic solvers). The other Zenodo records
  stay off, so a reader meets a few results that hold up rather than a long list. Nothing links to a Zenodo
  search, which would show them all.
- The lab's unfinished projects appear as work in progress (owner, 25 Oct): one poster each in the Research
  page's "Work in progress" section, linked from the home page. A poster gives the question, the approach,
  results so far, figures and open questions. Posters never link to the Zenodo records.
- There are seventeen posters. The first eleven are the other Zenodo projects, and each has a panel showing
  its space in Mantis, taken from the recordings. The six added on 26 Oct (dissociated irreducibles, integer
  optima, edge pair correlations, survival state bounds, clone composition, NS4A candidates) come from papers
  the owner supplied with no Mantis recording, so they carry no Mantis panel. They use the space for a second
  figure and, on the biology ones, a "What would settle it" section taken from the paper's own next steps.
  The NS4A poster states in its results and its open questions that nothing was tested in a laboratory.
  The lineage-tracing manuscript calls itself a private draft; the owner, as its author, approved the poster
  (26 Oct).
- Figure captions say what the beat shows in one or two plain sentences, with the paper's numbers. A
  figure only claims what the paper or its records say; schematic parts are named as such in the code.
- Team: Pranava Kumar is founder and lead, then Sushaan Kandukoori, director of mathematics and machine
  learning, then Shrikrishna Ramesh, director of biology and physics (owner's order, 30 Oct), with titles shown
  under their names. Then the owner's
  list plus everyone who answered the lab's sign-up form. Bios come only from each
  person's research answer, with no contact details.
- Olympiad logos are the organizations' official files turned white (`public/brand/olympiads`).
- The MIT CSAIL mark (`public/brand/csail.svg`, the official file from csail.mit.edu, its own colours) sits in the
  hero beside "Research initiative" and in the footer, linked to csail.mit.edu.

## Open items

- Abhijay Gangarapu, Devom Brahmbhatt, Krish and Taksh Kothari have no bio yet, and two of the leads' bios are a
  single line.
- The footer's "part of Mantis" wording is still to confirm.

## Notes for maintainers

- GitHub Pages is set to Deploy from a branch (`main`, `/`), so the publish workflow commits the built site to the
  repository root with `.nojekyll` (see the README's Deploy section). Only a repository admin can switch it to
  GitHub Actions; sushaan-k has write access.
- The site is a static export (`output: 'export'`) that GitHub Pages serves from `/MantisDiscovery/`. Point
  at files in `public/` through `asset()` (`src/data/site.ts`) and at pages through `next/link`, which add
  that sub-path; engine code compares routes with `routePath()`. CSS that needs an image imports it from
  `src/` (the Mantis mark is `src/brand/mantis-mark.png`) so the bundler resolves it.
- A link to a section on another page (`/method/#example`, `/research/#work-in-progress`) lands on that
  section after the page transition: `enter()` calls `jumpToHash()` (`src/engine/scroll.ts`), which honours
  the section's `scroll-margin-top`. Links to files carry `data-no-transition` so the engine leaves them alone.
- Cache Components stays off (`next.config.ts`): it keeps old routes mounted inside `<Activity>`, and the
  motion engine initializes whatever is in the document.
- next/font sizes its Arial fallback for Inter's natural width and ignores the brand's `size-adjust`, so
  `globals.css` declares its own 'MantisSans Fallback' (101.85%). Re-measure if the brand's size changes.
- In GLSL, `pow()` of a negative number is NaN, and `sin(π)` rounds just below zero in float32: clamp first.
- `node scripts/stix-subset.mjs` re-cuts the STIX Two and Inter subsets after the content gains new symbols.
- Figures: `cd graphics && npm install`, then `node scripts/env.mjs && node scripts/models.mjs` once, and
  `node render.mjs [ids]`. `npx kinetograph strip src/index.tsx --comp <id>` shows twelve frames in a second.
  Kinetograph is licensed under PolyForm Small Business 1.0.0; it is a build tool here and nothing of it ships
  with the site.
