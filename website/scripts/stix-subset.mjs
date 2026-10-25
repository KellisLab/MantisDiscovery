#!/usr/bin/env node
// Self-host two font subsets cut to exactly the characters this site uses (every character in the
// content file, the pages and the components, plus ASCII and common punctuation), via Google's
// `text=` API, which returns a woff2 holding just those glyphs:
//   STIX Two Text (OFL), roman and italic: the papers' voice, math symbols included.
//   Inter (OFL): the glyphs the Mantis brand subset of Inter (MantisSans) leaves out, such as Greek,
//   arrows and math symbols, used as a per-glyph fallback so they render in the same face.
// Re-run after editing content:  node scripts/stix-subset.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const list = (dir, ext) => fs.readdirSync(path.join(root, dir), { recursive: true }).filter((f) => ext.some((e) => f.endsWith(e))).map((f) => path.join(root, dir, f));
const files = [path.join(root, 'src/data/site.ts'), ...list('src/components', ['.tsx']), ...list('src/app', ['.tsx'])];
const chars = new Set();
for (let c = 0x20; c < 0x7f; c++) chars.add(String.fromCharCode(c));
for (const c of '’‘“”…×·−≤≥√∞∑∈∉⊂ℓℤℝℕΛλΘθνωεχαβγδμπσΠΣΔΩφψ‖⌊⌋⌈⌉₀₁₂₃₄₅₆₇₈₉₊⁰¹²³⁴⁵⁶⁷⁸⁹ᵈᵐⁿ⋯∗→←↗□■') chars.add(c);
for (const f of files) for (const c of fs.readFileSync(f, 'utf8')) if (c.codePointAt(0) > 0x7f) chars.add(c);
const text = [...chars].filter((c) => c !== '\n' && c !== '\t').join('');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const out = path.join(root, 'src/fonts');
fs.mkdirSync(out, { recursive: true });

async function cut(family, axes, name, glyphs) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:${axes}&display=swap&text=${encodeURIComponent(glyphs)}`;
  const css = await (await fetch(url, { headers: { 'user-agent': UA } })).text();
  const blocks = css.match(/@font-face\s*{[^}]+}/g) || [];
  if (!blocks.length) { console.error(css.slice(0, 400)); process.exit(1); }
  for (const b of blocks) {
    const style = /font-style:\s*(\w+)/.exec(b)[1];
    const src = /url\(([^)]+)\)/.exec(b)[1];
    const buf = Buffer.from(await (await fetch(src, { headers: { 'user-agent': UA } })).arrayBuffer());
    const file = name(style);
    fs.writeFileSync(path.join(out, file), buf);
    console.log(`${file}: ${(buf.length / 1024).toFixed(1)} KB`);
  }
}

await cut('STIX+Two+Text', 'ital,wght@0,400;1,400', (s) => `stix-two-text-400-${s}.woff2`, text);
// MantisSans (Inter 4.0, 418 glyphs) covers ASCII, Latin-1 and basic punctuation; cut the rest from Inter.
const extra = [...chars].filter((c) => c.codePointAt(0) > 0x2000 || /[\u0370-\u03ff]/.test(c)).join('') + '→←↗↘↑↓';
await cut('Inter', 'opsz,wght@14..32,100..900', () => 'inter-extra.woff2', extra);
console.log(`${[...text].length} characters, ${[...extra].length} in the Inter extra`);
