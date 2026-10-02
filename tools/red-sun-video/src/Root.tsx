import React from "react";
import { Audio, Composition, Sequence, staticFile } from "remotion";
import { AUDIO_FILE, FPS, LEAD_IN, TOTAL_FRAMES } from "./timeline";
import { World } from "./World";

const Video: React.FC = () => (
  <>
    <World />
    <Sequence from={Math.round(LEAD_IN * FPS)}>
      <Audio src={staticFile(AUDIO_FILE)} />
    </Sequence>
  </>
);

export const Root: React.FC = () => (
  <>
    <Composition id="RedSunWide" component={Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="RedSunTall" component={Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
  </>
);
