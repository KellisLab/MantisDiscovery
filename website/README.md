# Mantis Discovery website

The site for Mantis Discovery at MIT CSAIL: the lab, its papers, how it works with AI, and who is in it.
It is published at https://kellislab.github.io/MantisDiscovery/.

Next.js 16 (App Router, exported as static files), React 19 and TypeScript, with GSAP and Lenis for motion,
OGL (WebGL) for the hero and Canvas 2D for the paper figures. The design system and the decisions behind it
are in [DESIGN.md](DESIGN.md).

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

GitHub Pages publishes the site from `.github/workflows/pages.yml` at the root of this repository. Every
push to `main` that touches `website/` builds the static export and deploys it; it can also be run by hand
from the Actions tab.

- One-time setup, by a repository admin: Settings → Pages → Build and deployment → Source: **GitHub
  Actions**.
- The workflow passes the Pages address and its sub-path (`/MantisDiscovery`) to the build. Canonical URLs,
  Open Graph, the sitemap and robots.txt read the address from `site.url` in `src/data/site.ts`.
- For a custom domain, set it under Settings → Pages. The workflow picks up the new address and drops the
  sub-path on its own.
- Any other static host works too: build with `npm run build` and publish `out/`.

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
- `public/`: the olympiad logos, the film and the Mantis demo recording, and the Open Graph image. The Mantis
  mark is in `src/brand/`, where the CSS bundle picks it up.

## Adding a paper

1. Add an entry to `papers` in `src/data/site.ts` with a new `plate` id.
2. Write `src/plates/<id>.ts` following `src/plates/README.md`, and register it in `src/plates/registry.ts`
   and `src/components/plates.tsx`.
3. Run `node scripts/stix-subset.mjs`, then build.

## Third-party assets

The fonts are under the SIL Open Font License. The olympiad logos belong to their organizations and are used
only to name the competitions.
