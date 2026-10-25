// One composition per paper. Render them all with `npm run render` (see render.mjs).
import { Composition, registerRoot } from 'remotion';
import { FPS, SIZE } from './kit';
import { CLIQUE_FRAMES, Clique } from './clique';
import { ELLIPTIC_FRAMES, Elliptic } from './elliptic';
import { GYRO_FRAMES, Gyro } from './gyro';
import { OPAQUE_FRAMES, Opaque } from './opaque';
import { VOID_FRAMES, Void } from './void';

registerRoot(() => (
  <>
    <Composition id="opaque" component={Opaque} durationInFrames={OPAQUE_FRAMES} fps={FPS} width={SIZE} height={SIZE} background="#080B10" />
    <Composition id="clique" component={Clique} durationInFrames={CLIQUE_FRAMES} fps={FPS} width={SIZE} height={SIZE} background="#080B10" />
    <Composition id="gyro" component={Gyro} durationInFrames={GYRO_FRAMES} fps={FPS} width={SIZE} height={SIZE} background="#080B10" />
    <Composition id="elliptic" component={Elliptic} durationInFrames={ELLIPTIC_FRAMES} fps={FPS} width={SIZE} height={SIZE} background="#080B10" />
    <Composition id="void" component={Void} durationInFrames={VOID_FRAMES} fps={FPS} width={SIZE} height={SIZE} background="#080B10" />
  </>
));
