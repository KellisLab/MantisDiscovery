# Mantis Discovery website

The site for Mantis Discovery at MIT CSAIL. It covers the lab and its papers, posters for the projects still
under way, how the lab works with AI, and who is in it.
It is published at https://kellislab.github.io/MantisDiscovery/.

Next.js 16 (App Router, exported as static files), React 19 and TypeScript, with GSAP and Lenis for motion
and OGL (WebGL) for the hero. Each paper's figure is a short 3D film made with Kinetograph in `graphics/`.
The design system and the decisions behind it are in [DESIGN.md](DESIGN.md).

## Run

Node 20 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # writes the static site to out/
npm run lint
```

To look at the production build, serve `out/` with any static file server, for example
`python3 -m http.server -d out 3000`.

## Deploy

GitHub Pages serves the site from the root of `main` (Settings → Pages: Deploy from a branch, `main`, `/`).
That setting serves files as they are and cannot run the build, so `.github/workflows/pages.yml` builds the
static export and commits it to the repository root. It runs on every push to `main` that touches `website/`,
and it can also be run by hand from the Actions tab.

- The root also holds `.nojekyll`, which stops GitHub from running Jekyll (Jekyll would drop the `_next/`
  folder), and `.pages-files`, the list of files the last publish wrote, so a page that is removed from the
  site leaves the root too. The generated files at the root are rewritten on every publish, so don't edit
  them by hand.
- The workflow builds with the sub-path `/MantisDiscovery` and the address
  `https://kellislab.github.io/MantisDiscovery`. Canonical URLs, Open Graph, the sitemap and robots.txt read
  the address from `site.url` in `src/data/site.ts`.
- For a custom domain, set it under Settings → Pages, and in the workflow set `PAGES_BASE_PATH` to an empty
  string and `NEXT_PUBLIC_SITE_URL` to the domain.
- If a repository admin switches Pages to **GitHub Actions**, the workflow can upload `website/out` as a
  Pages artifact instead, and the generated files at the root can be deleted.
- Any other static host works too: build with `npm run build` and publish `out/`.

## Where things live

- `src/data/site.ts`: every visible string. The four papers (titles, abstracts, what each shows and does not
  claim, the caption for each beat of its figure), the work-in-progress posters, the Method page's sections
  and its example, the team and their bios, the olympiads and the contact address.
- `src/app/`: the pages (home, research, one page per paper, method, lab, 404), metadata, sitemap and robots.
- `graphics/`: the figure films, one Kinetograph composition per paper (`src/<id>.tsx`), rendered by
  `node render.mjs` into `public/media/figures/` with their posters and beat timings
  (`src/data/figure-timing.json`).
- `src/hero/`: the heat-flow torus. `torus.ts` holds the math; `stage.ts` is the WebGL stage that draws it
  and carries its points down the page as the Mantis demo and the film.
- `src/components/`: page parts, including `HeroTorus`, `Plate` (a figure and its captions), `PaperIndex`
  and `Prose` (paragraphs with inline links, used on the Method page).
- `src/engine/`: the motion engine (one GSAP ticker, Lenis scroll, reveals, page transitions) and its Next.js
  adapter.
- `src/app/globals.css`, `src/styles/`: tokens and styles.
- `src/fonts/`: MantisSans and MantisMono (the Mantis brand cuts of Inter and Space Mono), plus subsets of
  STIX Two and Inter cut by `node scripts/stix-subset.mjs`. Re-run it when the content gains new symbols.
- `posters/`: the seventeen work-in-progress posters, one LuaLaTeX file per project with its figures in
  `posters/figures/`. `sh posters/build.sh` builds them all into `public/media/posters/` (PDF and previews),
  and `sh posters/build.sh <slug>` rebuilds one without regenerating the figures. It needs TeX Live with
  LuaLaTeX, Python 3 with matplotlib, numpy and scipy, poppler (`pdftoppm`) and `cwebp`.
- `public/`: the olympiad logos, the figure films, the walkthrough film, the Mantis demo recording and stills,
  the posters and the Open Graph image. The Mantis mark is in `src/brand/`, where the CSS bundle picks it up.

## Adding a paper

1. Add an entry to `papers` in `src/data/site.ts`, with a `figure` whose `id` names a new composition.
2. Write `graphics/src/<id>.tsx`, add its beats to `graphics/src/timing.ts` and its composition to
   `graphics/src/index.tsx`, then run `node render.mjs <id>` in `graphics/`. Give the figure one caption per
   beat in `site.ts`, and its lead colour in `src/components/Plate.tsx`.
3. Run `node scripts/stix-subset.mjs`, then build.

## Third-party assets

The fonts are under the SIL Open Font License. The olympiad logos belong to their organizations and are used
only to name the competitions. Kinetograph, used in `graphics/` to render the figures, is under the PolyForm
Small Business License 1.0.0; the site ships only the rendered films.
