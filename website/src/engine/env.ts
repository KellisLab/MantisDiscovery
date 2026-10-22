export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = () => matchMedia('(hover: none), (pointer: coarse)').matches;
export const isMobile = () => matchMedia('(max-width: 767px)').matches;

// Shared easing vocabulary. Use these names everywhere; never invent per-component curves.
// The motion verb is "draft, then ink": drafting is linear (a plotter moves at constant speed),
// the ink strike is expo.out, the carriage between pages is expo.inOut.
export const ease = {
  out: 'expo.out', // the ink strike, default entrance
  inOut: 'expo.inOut', // the carriage pass, page transitions
  soft: 'power3.out', // small UI
  draft: 'none', // a pen moving at constant speed
} as const;
