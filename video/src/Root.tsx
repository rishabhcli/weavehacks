import { Composition } from 'remotion';
import { PatchPilotDemo } from './PatchPilotDemo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PatchPilotDemo"
        component={PatchPilotDemo}
        durationInFrames={450} // 15 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
