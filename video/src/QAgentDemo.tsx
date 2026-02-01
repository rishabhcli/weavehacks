import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';

// Intro Scene - QAgent Logo
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  const textOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b4e 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Animated background particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: `rgba(139, 92, 246, ${0.3 + Math.random() * 0.3})`,
              left: `${10 + (i * 4.5)}%`,
              top: `${20 + Math.sin(frame / 30 + i) * 20}%`,
              transform: `translateY(${Math.sin(frame / 20 + i * 0.5) * 30}px)`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1, #4f46e5)',
            borderRadius: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(139, 92, 246, 0.4)',
          }}
        >
          <span style={{ fontSize: 60, color: 'white' }}>⚡</span>
        </div>

        <h1
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            opacity: textOpacity,
            letterSpacing: -2,
          }}
        >
          QAgent
        </h1>

        <p
          style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            opacity: subtitleOpacity,
          }}
        >
          Self-Healing QA Agent
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Feature Scene - Shows a feature with animation
const FeatureScene: React.FC<{
  icon: string;
  title: string;
  description: string;
  color: string;
}> = ({ icon, title, description, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 15 },
  });

  const contentOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 80,
          transform: `translateX(${interpolate(slideIn, [0, 1], [-100, 0])}px)`,
          opacity: slideIn,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 200,
            height: 200,
            background: `linear-gradient(135deg, ${color}, ${color}88)`,
            borderRadius: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 20px 60px ${color}44`,
          }}
        >
          <span style={{ fontSize: 100 }}>{icon}</span>
        </div>

        {/* Content */}
        <div style={{ opacity: contentOpacity, maxWidth: 800 }}>
          <h2
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: 'white',
              margin: 0,
              marginBottom: 20,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: 32,
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Flow Scene - Shows the QAgent loop
const FlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const agents = [
    { name: 'Tester', icon: '🔍', color: '#8b5cf6' },
    { name: 'Triage', icon: '🩺', color: '#6366f1' },
    { name: 'Fixer', icon: '🔧', color: '#4f46e5' },
    { name: 'Verifier', icon: '✅', color: '#22c55e' },
  ];

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h2
        style={{
          position: 'absolute',
          top: 80,
          fontSize: 48,
          fontWeight: 700,
          color: 'white',
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateRight: 'clamp',
          }),
        }}
      >
        The QAgent Loop
      </h2>

      <div
        style={{
          display: 'flex',
          gap: 40,
          alignItems: 'center',
        }}
      >
        {agents.map((agent, i) => {
          const delay = i * 15;
          const agentScale = spring({
            frame: frame - delay,
            fps,
            config: { damping: 12 },
          });

          const isActive = Math.floor((frame - 30) / 30) % 4 === i && frame > 30;

          return (
            <React.Fragment key={agent.name}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  transform: `scale(${agentScale})`,
                }}
              >
                <div
                  style={{
                    width: 140,
                    height: 140,
                    background: isActive
                      ? `linear-gradient(135deg, ${agent.color}, ${agent.color}dd)`
                      : 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive ? `0 10px 40px ${agent.color}66` : 'none',
                    border: isActive ? `3px solid ${agent.color}` : '3px solid rgba(255,255,255,0.2)',
                    transition: 'all 0.3s',
                  }}
                >
                  <span style={{ fontSize: 60 }}>{agent.icon}</span>
                </div>
                <span
                  style={{
                    fontSize: 24,
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.6)',
                    fontWeight: isActive ? 700 : 400,
                  }}
                >
                  {agent.name}
                </span>
              </div>

              {i < agents.length - 1 && (
                <div
                  style={{
                    fontSize: 40,
                    color: 'rgba(255, 255, 255, 0.4)',
                    opacity: spring({
                      frame: frame - delay - 10,
                      fps,
                      config: { damping: 12 },
                    }),
                  }}
                >
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Loop arrow */}
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          fontSize: 32,
          color: 'rgba(255, 255, 255, 0.5)',
          opacity: interpolate(frame, [60, 80], [0, 1], {
            extrapolateRight: 'clamp',
          }),
        }}
      >
        ↻ Continuous improvement loop
      </div>
    </AbsoluteFill>
  );
};

// Outro Scene
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b4e 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            marginBottom: 24,
          }}
        >
          Built for WeaveHacks 2026
        </h1>

        <div
          style={{
            display: 'flex',
            gap: 40,
            justifyContent: 'center',
            marginTop: 40,
            opacity: interpolate(frame, [20, 40], [0, 1], {
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {['W&B Weave', 'Redis', 'Browserbase', 'Vercel'].map((sponsor) => (
            <div
              key={sponsor}
              style={{
                padding: '16px 32px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: 24,
              }}
            >
              {sponsor}
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 28,
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: 60,
            opacity: interpolate(frame, [40, 60], [0, 1], {
              extrapolateRight: 'clamp',
            }),
          }}
        >
          Self-healing QA powered by AI agents
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Main Composition
export const QAgentDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Intro - 0 to 90 frames (3 seconds) */}
      <Sequence from={0} durationInFrames={90}>
        <IntroScene />
      </Sequence>

      {/* Feature 1: Auto Bug Detection - 90 to 165 frames */}
      <Sequence from={90} durationInFrames={75}>
        <FeatureScene
          icon="🐛"
          title="Auto Bug Detection"
          description="AI-powered tester finds bugs before your users do. Simulates real user flows in actual browsers."
          color="#8b5cf6"
        />
      </Sequence>

      {/* Feature 2: Self-Healing - 165 to 240 frames */}
      <Sequence from={165} durationInFrames={75}>
        <FeatureScene
          icon="✨"
          title="Self-Healing Fixes"
          description="Automatically generates and applies code patches. Creates PRs for review and deploys to verify."
          color="#6366f1"
        />
      </Sequence>

      {/* Flow Scene - 240 to 360 frames (4 seconds) */}
      <Sequence from={240} durationInFrames={120}>
        <FlowScene />
      </Sequence>

      {/* Outro - 360 to 450 frames (3 seconds) */}
      <Sequence from={360} durationInFrames={90}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
