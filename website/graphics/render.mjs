// Renders every figure for the site: ../public/media/figures/<id>.mp4 (H.264, faststart) and <id>.webp (the
// poster, also the reduced-motion still), and writes the beat timings the captions follow to
// ../src/data/figure-timing.json. `node render.mjs clique gyro` renders only those.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { TIMING } from './src/timing.ts';

// The frame each poster is taken from: one that shows the figure's main point with its labels.
const POSTER = { opaque: 112, clique: 400, gyro: 150, elliptic: 160, void: 60 };
const FPS = 30;

const here = new URL('.', import.meta.url).pathname;
const site = new URL('../public/media/figures/', import.meta.url).pathname;
fs.mkdirSync(site, { recursive: true });
fs.mkdirSync(here + 'out', { recursive: true });

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(TIMING);
const run = (cmd, args) => execFileSync(cmd, args, { cwd: here, stdio: ['ignore', 'inherit', 'inherit'] });

// The light and the models are generated (and not committed): make them on a fresh checkout.
if (!fs.existsSync(here + 'src/public/env/studio.hdr')) run('node', ['scripts/env.mjs']);
if (!fs.existsSync(here + 'src/public/models/gyro-limits.glb')) run('node', ['scripts/models.mjs']);

for (const id of ids) {
  if (!(id in TIMING)) throw new Error(`no figure ${id}`);
  console.log(`\n${id}`);
  run('npx', ['kinetograph', 'render', 'src/index.tsx', '--comp', id, '-o', `out/${id}.mp4`, '--crf', '12']);
  // 960 px is the largest the site shows a figure at (a 480 px plate on a 2x screen)
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', `out/${id}.mp4`, '-vf', 'scale=960:960:flags=lanczos', '-c:v', 'libx264',
    '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', `${site}${id}.mp4`]);
  run('npx', ['kinetograph', 'still', 'src/index.tsx', String(POSTER[id]), '--comp', id, '-o', `out/${id}-poster.png`]);
  run('cwebp', ['-quiet', '-q', '84', `out/${id}-poster.png`, '-o', `${site}${id}.webp`]);
  console.log(`${id}.mp4 ${(fs.statSync(`${site}${id}.mp4`).size / 1e6).toFixed(2)} MB, ${id}.webp ${(fs.statSync(`${site}${id}.webp`).size / 1e3).toFixed(0)} kB`);
}

const timing = Object.fromEntries(Object.entries(TIMING).map(([id, t]) => [id, {
  duration: +(t.frames / FPS).toFixed(3),
  beats: t.beats.map((b) => +(b / FPS).toFixed(3)),
  poster: +(POSTER[id] / FPS).toFixed(3),
}]));
fs.writeFileSync(new URL('../src/data/figure-timing.json', import.meta.url), JSON.stringify(timing, null, 2) + '\n');
console.log('\nwrote src/data/figure-timing.json');
