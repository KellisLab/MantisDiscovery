# Mantis Discovery website

The site for Mantis Discovery at MIT CSAIL: the lab, its papers, how it works with AI, and who is in it.
Next.js 16 (App Router, statically generated), React 19 and TypeScript, with GSAP and Lenis for motion,
OGL (WebGL) for the hero and Canvas 2D for the paper figures. The design system and the decisions behind it
are in [DESIGN.md](DESIGN.md).

## Run

Node 20 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm run start
npm run lint
```

## Deploy

1. Set `site.url` in `src/data/site.ts`. Canonical URLs, Open Graph, the sitemap and robots.txt all read it.
2. Deploy this folder as a Next.js project. On Vercel, set the project's root directory to this folder; no
   other configuration is needed.

## Where things live

- `src/data/site.ts`: every visible string. The 15 papers (titles, abstracts, what each shows and does not
  claim), the method stages, the team and their bios, the olympiads and the contact address.
- `src/app/`: the pages (home, research, one page per paper, method, lab, 404), metadata, sitemap and robots.
- `src/plates/`: one computed figure per paper. Each draws the object its paper studies and runs a real check
  while it draws (see `src/plates/README.md`). In development, `/plates-lab/<id>/` shows one plate at a time.
- `src/hero/`: the heat-flow torus. `torus.ts` holds the math; `stage.ts` is the WebGL stage that draws it
  and carries its points down the page as the Mantis demo and the film.
- `src/components/`: page parts, including `HeroTorus`, `MethodLoop` (the method figure), `Plate` and
  `PaperIndex`.
- `src/engine/`: the motion engine (one GSAP ticker, Lenis scroll, reveals, page transitions) and its Next.js
  adapter.
- `src/app/globals.css`, `src/styles/`: tokens and styles.
- `src/fonts/`: MantisSans and MantisMono (the Mantis brand cuts of Inter and Space Mono), plus subsets of
  STIX Two and Inter cut by `node scripts/stix-subset.mjs`. Re-run it when the content gains new symbols.
- `public/`: the Mantis mark, the olympiad logos, the film and the Mantis demo recording, and the Open Graph
  image.

## Adding a paper

1. Add an entry to `papers` in `src/data/site.ts` with a new `plate` id.
2. Write `src/plates/<id>.ts` following `src/plates/README.md`, and register it in `src/plates/registry.ts`
   and `src/components/plates.tsx`.
3. Run `node scripts/stix-subset.mjs`, then build.

## Third-party assets

The fonts are under the SIL Open Font License. The olympiad logos belong to their organizations and are used
only to name the competitions.
