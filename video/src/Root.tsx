import { Composition } from 'remotion';
import { QAgentDemo } from './QAgentDemo';
import { QAgentWalkthrough } from './QAgentWalkthrough';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="QAgentDemo"
        component={QAgentDemo}
        durationInFrames={450} // 15 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="QAgentWalkthrough"
        component={QAgentWalkthrough}
        durationInFrames={5400} // 3 minutes at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
