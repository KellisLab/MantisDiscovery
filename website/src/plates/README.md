# Plates

Every figure on the site is a plate: a drawing computed from the object a Mantis paper studies, with a
check that actually runs in the browser while it draws. The plotter (`plotter.ts`) drafts the scene in
non-photo-blue pencil, runs the check against the draft, strikes the ink only once a reading reports
`done`, then keeps the check running live. Read `opaque.ts` and `sidon.ts` first: they are the reference.

## API (`types.ts`)

```ts
const plate: PlateDef = {
  id: 'sidon',                       // PlateId from src/data/site.ts
  bounds: [x0, y0, x1, y1],          // plate-space box fitted (contain) into the square canvas; y points UP
  check: 'Every difference occurs exactly once', // short name of the check, <= 44 characters, sentence case
  create(seed) {                     // pure: no DOM, no Math.random (use rng(seed) from kit.ts)
    return {
      scene: { strokes, dots, labels },        // static figure, drafted then inked
      update(dt, time) {},                     // advance the check and the dynamics (seconds)
      draw(p, time, inked) {},                 // live layer every frame after the draft pass
      readings: () => [r1, r2],                // EXACTLY two { label, value, done? }
      settle() {},                             // reduced motion: finish the check synchronously
    };
  },
};
export default plate;
```

- `Stroke { pts: flat [x,y,...], tone, w?, dash?, closed?, at?, transient? }`. Tones: `ink` (bone, the
  object that is shown), `draft` (blue pencil, construction), `faint` (light pencil, rays, hatching),
  `ghost` (frames, grids, axis labels). `at` (0..1) orders the drafting. `transient: true` means the
  plotter drafts it in the intro and the plate's `draw()` owns it afterwards (anything that moves).
- `Dot { x, y, r (CSS px), tone, hollow?, square?, transient? }`, `Label { x, y, text, tone, align?, baseline?, math?, size? }`.
  `math: true` sets STIX Two italic (use for formulas: `Λ = √2 + √6/2`). Keep labels sparse and small.
- `draw(p, time, inked)`: `inked` is 0 while the check runs on the draft, rises to 1 during the ink
  strike, then stays 1. Draw moving objects in pencil while `inked === 0` and ink them as it rises.
- The Painter (`painter.ts`): `p.poly(pts, tone, {w, dash, closed, alpha, to})`, `p.line(...)`,
  `p.dot(x, y, r, tone, {hollow, square, alpha})`, `p.rect(x0, y0, x1, y1, tone, {fill, alpha})`,
  `p.text(x, y, str, tone, {align, math, size, alpha})`. Coordinates are plate units.
- Helpers in `kit.ts`: `rng`, `arc`, `graph`, `segHit`, `lineInBox`, `contours` (marching squares), `fmt`.

## The check (the point of the whole site)

- It must be a real computation on the drawn object, honestly named, never a fake progress bar.
  Example: opaque casts random lines and intersects each with the barrier; sidon computes the 30
  differences and counts repeats.
- Reading 1 counts the work done (tested, sampled, checked). Reading 2 is the verdict; set
  `done: true` on it once the check has passed (this is what makes the plotter strike the ink).
  Pass within about 0.5 to 2.5 s of the test phase starting, then keep running live.
- Never claim to verify a theorem of the paper unless the code really does. Checking a property of the
  drawn example (an identity, an invariant, a bound evaluated at the drawn parameters) is right.
- The figure must match the `figure` description of its paper in `src/data/site.ts` (it is the alt text).
  If the honest version differs, say so in your report so the description can be edited.

## Look

- One instrument, one hand: hairlines, generous margins inside `bounds`, composition filling the square.
  Ink only on the object the paper is about; construction in pencil. No colors besides the tones.
- Something must keep moving slowly at rest (the check, particles, a parameter sweep). Calm, not busy.
- Performance: update + draw under ~2 ms per frame on a laptop. Precompute in `create()`; cache
  geometry; never allocate big arrays per frame. Static parts go in `scene` (cached once inked).
- Deterministic for a given seed. `settle()` must leave a meaningful still frame with real readings.

## Inspecting a plate

Dev server: http://localhost:4300/plates-lab/<id>/ (first load compiles for ~5 to 10 s). It shows the
plate at 640 px and at 300 px with its check and readings.
