// When each figure's beats start, in frames at 30 fps. The site shows one caption per beat under the video,
// so `npm run render` writes these to ../src/data/figure-timing.json for it.
export const TIMING = {
  opaque: { frames: 540, beats: [0, 150, 310, 420] },
  clique: { frames: 660, beats: [0, 170, 420] },
  gyro: { frames: 600, beats: [0, 230, 440] },
  elliptic: { frames: 600, beats: [0, 200, 340] },
  void: { frames: 240, beats: [0] },
} as const;
