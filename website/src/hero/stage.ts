// The home page's scroll stage (OGL): one fixed canvas behind the content. The hero's heat-flow torus is
// drawn here as a cloud of points, and those points are also the particles that carry it down the page.
// Scrolling down, the torus dissolves into them, they re-form as the Mantis demo beside "Built on
// Mantis", then dissolve again and re-form as the film's poster; at each stop the real picture fades in
// over them (HeroTorus sets that). Scrolling back up runs the same path in reverse.
// Every point has three homes, one per station, and the CPU passes in where along that path the cloud
// is (pos: 0 the torus, 1 the demo, 2 the film). Each point leaves and lands a little before or after
// the others, in a sweep down the picture, and curls out on its own heading in between, so a station
// dissolves and re-forms gradually, like smoke.
//   0  a point of the torus, projected into the hero's square and deformed by the heat (meshPoint)
//   1  a cell of the Mantis demo's rectangle, coloured from its poster
//   2  a cell of the film's rectangle, coloured from its poster
// The points add up as light. Alongside each colour the shader writes its brightest channel as alpha, so
// the canvas always holds valid premultiplied colour. Colour written with zero alpha is undefined, and
// browsers that colour-manage the page (Safari, Chrome on a Mac) drop it, so the torus would not show.
// Driven by gsap.ticker through HeroTorus; never runs its own requestAnimationFrame.
import { Camera, Geometry, Mesh, Program, Renderer, Texture, Transform } from 'ogl';
import { AMB_LIFT, AMB_RING, AMB_TUBE, CAM_Z, FOV, HEAT_SCALE, LIFT, NU, NV, R, RING_SWELL, ROLL, SWELL, SWELL_CAP, SWELL_P, TAU, TILT, r } from './torus';

/** A rectangle in normalized device coordinates: centre x, centre y, half width, half height. */
export type Rect = [number, number, number, number];
export type Frame = {
  rects: [Rect, Rect, Rect];
  pos: number; // where the cloud is: 0 the torus, 1 the demo, 2 the film, fractions in flight
  resolve: [number, number]; // how far the demo and the film pictures have faded in over their points
  spin: number;
  time: number;
  reveal: number; // the torus's opening sweep around the ring
};

/** The share of a flight by which points' departures are spread: each point flies the rest of it. */
const STAGGER = 0.38;

const f = (n: number) => n.toFixed(5);
const vertex = /* glsl */ `
precision highp float;
attribute vec2 aUV;
attribute vec2 aCell;
attribute float aSeed;
attribute vec3 aColDemo;
attribute vec3 aColFilm;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform sampler2D uHeat;
uniform vec4 uRect0;
uniform vec4 uRect1;
uniform vec4 uRect2;
uniform float uPos;
uniform vec2 uResolve;
uniform float uTime;
uniform float uReveal;
uniform vec2 uRes;
uniform vec2 uGrid;
uniform float uSize;
uniform float uDpr;
uniform vec3 uPencil;
uniform vec3 uInk;
uniform vec3 uHuman;
uniform vec3 uAI;
varying vec3 vCol;
varying float vAlpha;
varying float vSquare;

// Red: the human heat. Green: the AI heat. Blue: the ground, stored as 0.5 + 0.5 b.
vec3 field(vec2 st) { return texture2D(uHeat, st + vec2(${f(0.5 / NU)}, ${f(0.5 / NV)})).rgb; }
// The swollen, rippling tube on a ring that widens, lifts and dips: meshPoint() in torus.ts.
vec3 meshPoint(vec2 st, float heat, float ring, float bulge, float ringB, float jitter) {
  float rr = ${f(r)} * (1.0 + ${f(SWELL)} * pow(clamp(heat, 0.0001, ${f(SWELL_CAP)}), ${f(SWELL_P)}) + jitter) * (1.0 + ${f(AMB_TUBE)} * bulge);
  float u = st.x * ${f(TAU)}, v = st.y * ${f(TAU)};
  float c = ${f(R)} * (1.0 + ${f(RING_SWELL)} * ring + ${f(AMB_RING)} * ringB) + rr * cos(v);
  return vec3(c * cos(u), rr * sin(v) + ${f(LIFT)} * ring + ${f(AMB_LIFT)} * ringB, c * sin(u));
}

void main() {
  // This point's own progress through the current flight, eased at both ends. Points leave and land in
  // the order of their picture cell, top rows first with a ragged edge, so a picture fills in like a
  // sweep rather than as random static (point k owns cell k in both pictures, so both sweep alike).
  float seg = min(floor(uPos), 1.0);
  float order = 0.72 * (0.7 * aCell.y + 0.3 * aCell.x) + 0.28 * fract(aSeed * 53.17);
  float fi = clamp((uPos - seg - ${f(STAGGER)} * order) / ${f(1 - STAGGER)}, 0.0, 1.0);
  float e = fi * fi * fi * (fi * (fi * 6.0 - 15.0) + 10.0);
  vec3 w = seg < 0.5 ? vec3(1.0 - e, e, 0.0) : vec3(0.0, 1.0 - e, e);
  // max(): sin(pi) rounds to a hair below zero, and pow() of a negative number is NaN, which hides the point.
  float scatter = pow(max(sin(3.14159265 * fi), 0.0), 2.2);
  // 1 at a station, 0 through the middle of the flight: points land soft and dim, then settle into cells.
  float near = 1.0 - smoothstep(0.0, 0.25, min(fi, 1.0 - fi));

  vec3 h = field(aUV);
  float heat = clamp(h.r + h.g, 0.0, 1.6);
  float bulge = h.b * 2.0 - 1.0;
  vec3 around = 0.25 * (field(vec2(aUV.x, 0.0)) + field(vec2(aUV.x, 0.25)) + field(vec2(aUV.x, 0.5)) + field(vec2(aUV.x, 0.75)));
  float ring = around.r + around.g;
  float ringB = around.b * 2.0 - 1.0;
  // Warm ground also shimmers a little, each point on its own phase.
  float jitter = 0.02 * heat * sin(uTime * 2.3 + aSeed * 40.0);
  vec4 mv = modelViewMatrix * vec4(meshPoint(aUV, heat, ring, bulge, ringB, jitter), 1.0);
  vec4 clip = projectionMatrix * mv;

  // The three homes, in device coordinates.
  vec2 p0 = uRect0.xy + (clip.xy / clip.w) * uRect0.zw;
  vec2 q = vec2(aCell.x * 2.0 - 1.0, 1.0 - aCell.y * 2.0);
  vec2 p1 = uRect1.xy + q * uRect1.zw;
  vec2 p2 = uRect2.xy + q * uRect2.zw;
  vec2 p = w.x * p0 + w.y * p1 + w.z * p2;
  // In flight each point drifts out on its own heading, which turns as it goes, and wanders a little.
  float ang = aSeed * 18.8496 + (fract(aSeed * 7.31) - 0.5) * 3.0 * fi;
  float reach = 0.06 + 0.22 * fract(aSeed * 91.37);
  p += (vec2(cos(ang), sin(ang)) * reach + 0.03 * vec2(sin(uTime * 0.7 + aSeed * 17.0), cos(uTime * 0.8 + aSeed * 23.0))) * scatter;
  gl_Position = vec4(p, 0.0, 1.0);

  // The torus's own colour: pencil where cold, azure near the source you steer, chartreuse near the one
  // that wanders, ink where both are warm.
  float hh = smoothstep(0.03, 0.55, h.r), aa = smoothstep(0.03, 0.55, h.g);
  vec3 tc = uPencil;
  tc = mix(tc, uHuman, hh * (1.0 - 0.55 * aa));
  tc = mix(tc, uAI, aa * (1.0 - 0.55 * hh));
  tc = mix(tc, uInk, smoothstep(0.12, 0.42, min(h.r, h.g)));
  // In flight the colours cool toward pencil, so a white picture does not dissolve into glare.
  vCol = mix(w.x * tc + w.y * aColDemo + w.z * aColFilm, uPencil, 0.4 * scatter);

  float depth = clamp((-mv.z - ${f(CAM_Z - 1.6)}) / 3.2, 0.0, 1.0);
  float sweep = smoothstep(aUV.x * 1.1, aUV.x * 1.1 + 0.08, uReveal * 1.2);
  // Warmer ground reads a little brighter, so the slow flow over the whole surface shows in the light too.
  float a0 = (0.3 + 0.12 * aSeed + 0.7 * max(hh, aa) + 0.12 * max(bulge, 0.0)) * (1.0 - 0.72 * depth) * sweep;
  vAlpha = (w.x * a0 + 0.92 * (w.y * (1.0 - uResolve.x) + w.z * (1.0 - uResolve.y)) * mix(0.4, 1.0, near)) * (1.0 - 0.5 * scatter) + 0.1 * scatter;
  // Soft round glow at the torus and in flight; square cells once settled into a picture.
  vSquare = (w.y + w.z) * near;
  float twinkle = 0.85 + 0.15 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0);
  float s0 = uSize * (0.75 + 0.5 * aSeed + 1.25 * heat) * twinkle * (${f(CAM_Z)} / -mv.z);
  float s1 = max(1.0, min(uRect1.z * uRes.x / uGrid.x, uRect1.w * uRes.y / uGrid.y) * 0.95);
  float s2 = max(1.0, min(uRect2.z * uRes.x / uGrid.x, uRect2.w * uRes.y / uGrid.y) * 0.95);
  gl_PointSize = (w.x * s0 + w.y * s1 + w.z * s2) * (1.0 - 0.6 * scatter) + scatter * 1.6 * uDpr;
}`;

const fragment = /* glsl */ `
precision highp float;
varying vec3 vCol;
varying float vAlpha;
varying float vSquare;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float disc = d > 0.5 ? 0.0 : smoothstep(0.5, 0.05, d);
  float tile = 1.0 - smoothstep(0.44, 0.5, max(abs(c.x), abs(c.y)));
  float a = vAlpha * mix(disc, tile, vSquare);
  if (a < 0.004) discard;
  vec3 col = min(vCol, vec3(1.0)) * a;
  gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
}`;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export class Stage {
  renderer: Renderer;
  camera: Camera;
  roll = new Transform();
  tilt = new Transform();
  spin = new Transform();
  heat: Texture;
  heatData = new Uint8Array(NU * NV * 4);
  points: Mesh;
  program: Program;
  dpr: number;
  /** The picture grid: one point per cell, so a picture is GW × GH points. */
  grid: [number, number];

  constructor(canvas: HTMLCanvasElement) {
    const small = innerWidth < 768;
    this.dpr = Math.min(devicePixelRatio || 1, small ? 1.5 : 2);
    this.grid = small ? [108, 60] : [160, 88];
    this.renderer = new Renderer({ canvas, dpr: this.dpr, alpha: true, antialias: true, premultipliedAlpha: true });
    const gl = this.renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    // The torus is drawn into a square and then placed in the hero's square, so the camera's aspect is 1.
    this.camera = new Camera(gl, { fov: FOV, aspect: 1, near: 0.1, far: 50 });
    this.camera.position.set(0, 0, CAM_Z);
    this.camera.lookAt([0, 0, 0]);
    // Spin about the ring's axis, then tilt toward the viewer, then lean: toView() in torus.ts.
    this.roll.rotation.z = ROLL;
    this.tilt.rotation.x = TILT;
    this.tilt.setParent(this.roll);
    this.spin.setParent(this.tilt);

    this.heat = new Texture(gl, {
      image: this.heatData, width: NU, height: NV, generateMipmaps: false, flipY: false,
      minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.REPEAT, wrapT: gl.REPEAT,
    });

    // Points spread evenly over the torus by area; point k also owns picture cell k (row-major).
    const [GW, GH] = this.grid, n = GW * GH;
    const uv = new Float32Array(n * 2), cell = new Float32Array(n * 2), seed = new Float32Array(n);
    let s = 11;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let k = 0; k < n; k++) {
      const u = rnd();
      let v = 0;
      for (;;) { v = rnd(); if (rnd() * (R + r) <= R + r * Math.cos(v * TAU)) break; }
      uv[k * 2] = u; uv[k * 2 + 1] = v;
      cell[k * 2] = ((k % GW) + 0.5) / GW; cell[k * 2 + 1] = (Math.floor(k / GW) + 0.5) / GH;
      seed[k] = rnd();
    }
    const grey = new Float32Array(n * 3).fill(0.55);
    const geometry = new Geometry(gl, {
      aUV: { size: 2, data: uv }, aCell: { size: 2, data: cell }, aSeed: { size: 1, data: seed },
      aColDemo: { size: 3, data: grey.slice() }, aColFilm: { size: 3, data: grey.slice() },
    });
    this.program = new Program(gl, {
      vertex, fragment, transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uHeat: { value: this.heat },
        uRect0: { value: [0, 0, 1, 1] }, uRect1: { value: [0, 0, 1, 1] }, uRect2: { value: [0, 0, 1, 1] },
        uPos: { value: 0 }, uResolve: { value: [0, 0] },
        uTime: { value: 0 }, uReveal: { value: 0 }, uRes: { value: [1, 1] }, uGrid: { value: [GW, GH] },
        uSize: { value: (small ? 2.2 : 2.6) * this.dpr }, uDpr: { value: this.dpr },
        uPencil: { value: hex('#9fabc7') }, uInk: { value: hex('#eceeea') }, uHuman: { value: hex('#3d8bff') }, uAI: { value: hex('#b6d034') },
      },
    });
    // Colour and alpha both add: a glow that stays valid premultiplied colour (see the note at the top).
    this.program.setBlendFunc(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
    this.points = new Mesh(gl, { mode: gl.POINTS, geometry, program: this.program });
    this.points.frustumCulled = false;
    this.points.setParent(this.spin);
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h);
    const gl = this.renderer.gl;
    this.program.uniforms.uRes.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
  }

  /** Colours for a picture station, one per grid cell (row-major, GW across, GH down). */
  setColors(station: 1 | 2, rgb: Float32Array) {
    const attr = this.points.geometry.attributes[station === 1 ? 'aColDemo' : 'aColFilm'];
    (attr.data as Float32Array).set(rgb);
    attr.needsUpdate = true;
  }

  /** Pack the fields into the texture: red = human, green = AI, blue = the ground. */
  upload(human: Float32Array, ai: Float32Array, amb: Float32Array) {
    const d = this.heatData;
    for (let k = 0; k < NU * NV; k++) {
      d[k * 4] = Math.min(255, human[k] * HEAT_SCALE * 255);
      d[k * 4 + 1] = Math.min(255, ai[k] * HEAT_SCALE * 255);
      d[k * 4 + 2] = Math.round((0.5 + 0.5 * amb[k]) * 255);
    }
    this.heat.needsUpdate = true;
  }

  render(fr: Frame) {
    const u = this.program.uniforms;
    this.spin.rotation.y = fr.spin;
    u.uRect0.value = fr.rects[0]; u.uRect1.value = fr.rects[1]; u.uRect2.value = fr.rects[2];
    u.uPos.value = fr.pos; u.uResolve.value = fr.resolve;
    u.uTime.value = fr.time; u.uReveal.value = fr.reveal;
    this.renderer.render({ scene: this.roll, camera: this.camera });
  }

  clear() {
    const gl = this.renderer.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  destroy() {
    this.renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
