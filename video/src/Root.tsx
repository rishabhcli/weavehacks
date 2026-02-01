import { Composition } from 'remotion';
import { QAgentDemo } from './QAgentDemo';

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
    </>
  );
};
