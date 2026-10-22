import localFont from 'next/font/local';

// The Mantis brand faces, as served by mantis.csail.mit.edu (same files, same size-adjust), so
// Discovery sets type exactly like the main site. Sans for everything, mono for data and labels.
export const sans = localFont({
  src: [{ path: '../fonts/MantisSans.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-sans',
  display: 'swap',
  declarations: [{ prop: 'size-adjust', value: '96.7646%' }],
  // next/font would size Arial for Inter's natural width, not the 96.7646% the brand sets it at, so
  // text rewraps when the face arrives. globals.css declares a stand-in scaled to match.
  adjustFontFallback: false,
  fallback: ['MantisSans Fallback', 'Arial', 'Helvetica', 'sans-serif'],
});

// The brand subset of Inter has no Greek, arrows or math symbols. This Inter cut holds exactly the
// ones the site uses (scripts/stix-subset.mjs) and only downloads when one of them is on screen.
export const sansExtra = localFont({
  src: [{ path: '../fonts/inter-extra.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-sans-extra',
  display: 'swap',
  preload: false,
  declarations: [
    { prop: 'size-adjust', value: '96.7646%' },
    { prop: 'unicode-range', value: 'U+0370-03FF, U+2010-2BFF' },
  ],
  adjustFontFallback: false,
});

export const mono = localFont({
  src: [{ path: '../fonts/MantisMono.woff2', weight: '400', style: 'normal' }],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
  declarations: [{ prop: 'size-adjust', value: '98.0392%' }],
  fallback: ['SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
});

// The papers' voice: STIX Two Text, the face scientific publishers set mathematics in. Roman for
// abstracts, italic for what a paper shows. Subset by scripts/stix-subset.mjs to the glyphs used.
export const math = localFont({
  src: [
    { path: '../fonts/stix-two-text-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/stix-two-text-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-math',
  display: 'swap',
  preload: false,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});
