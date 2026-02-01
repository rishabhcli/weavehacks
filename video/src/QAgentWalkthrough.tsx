import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Img,
  staticFile,
} from 'remotion';

// ============================================================================
// SHARED STYLES & COMPONENTS
// ============================================================================

const colors = {
  bg: '#0a0a0f',
  bgCard: '#12121a',
  bgSecondary: '#1a1a25',
  primary: '#8b5cf6',
  primaryDark: '#6d28d9',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.6)',
  textDim: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.1)',
};

const MockBrowser: React.FC<{
  children: React.ReactNode;
  url?: string;
  showControls?: boolean;
}> = ({ children, url = 'qagent.dev', showControls = true }) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: colors.bgCard,
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {showControls && (
        <div
          style={{
            height: 44,
            background: colors.bgSecondary,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28ca41' }} />
          </div>
          <div
            style={{
              flex: 1,
              height: 28,
              background: colors.bg,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              color: colors.textMuted,
            }}
          >
            {url}
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode; subtitle?: string }> = ({
  children,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const y = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{ textAlign: 'center', opacity, transform: `translateY(${y}px)` }}>
      <h2 style={{ fontSize: 42, fontWeight: 700, color: colors.text, margin: 0 }}>{children}</h2>
      {subtitle && (
        <p style={{ fontSize: 20, color: colors.textMuted, marginTop: 8 }}>{subtitle}</p>
      )}
    </div>
  );
};

const FeatureCallout: React.FC<{
  icon: string;
  title: string;
  description: string;
  delay?: number;
  position?: 'left' | 'right';
}> = ({ icon, title, description, delay = 0, position = 'left' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15 },
  });

  const xOffset = position === 'left' ? -50 : 50;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: 20,
        background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primary}05)`,
        borderRadius: 12,
        border: `1px solid ${colors.primary}30`,
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [xOffset, 0])}px)`,
        maxWidth: 350,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `${colors.primary}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <h4 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>{title}</h4>
        <p style={{ fontSize: 14, color: colors.textMuted, margin: '6px 0 0 0', lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// SCENE 1: INTRO / HOOK (0-15 seconds, frames 0-450)
// ============================================================================

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Problem text animation
  const problemOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' });
  const problemFade = interpolate(frame, [180, 210], [1, 0], { extrapolateRight: 'clamp' });

  // Solution reveal
  const solutionOpacity = interpolate(frame, [220, 260], [0, 1], { extrapolateRight: 'clamp' });

  const logoScale = spring({
    frame: frame - 260,
    fps,
    config: { damping: 12 },
  });

  const taglineOpacity = interpolate(frame, [320, 360], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, ${colors.bgSecondary} 0%, ${colors.bg} 70%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${colors.border} 1px, transparent 1px), linear-gradient(90deg, ${colors.border} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.3,
        }}
      />

      {/* Problem Statement */}
      <div
        style={{
          position: 'absolute',
          opacity: problemOpacity * problemFade,
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 28, color: colors.textMuted, marginBottom: 20 }}>
          Every developer knows the pain...
        </p>
        <h1 style={{ fontSize: 56, fontWeight: 700, color: colors.text, margin: 0 }}>
          Bugs slip through to production
        </h1>
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 30 }}>
          {['Manual testing is slow', 'QA bottlenecks', 'Users find bugs first'].map((text, i) => (
            <div
              key={text}
              style={{
                padding: '12px 24px',
                background: `${colors.error}15`,
                border: `1px solid ${colors.error}30`,
                borderRadius: 8,
                color: colors.error,
                fontSize: 16,
                opacity: interpolate(frame, [80 + i * 20, 100 + i * 20], [0, 1], {
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Solution Reveal */}
      <div
        style={{
          position: 'absolute',
          opacity: solutionOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <p style={{ fontSize: 24, color: colors.textMuted }}>Introducing</p>

        {/* Logo */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <Img
            src={staticFile('qagentlogo.png')}
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              boxShadow: `0 20px 60px ${colors.primary}40`,
            }}
          />
          <h1 style={{ fontSize: 72, fontWeight: 700, color: colors.text, margin: 0 }}>
            QAgent
          </h1>
        </div>

        <p
          style={{
            fontSize: 28,
            color: colors.textMuted,
            opacity: taglineOpacity,
          }}
        >
          The Self-Healing QA Agent
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 2: LANDING PAGE TOUR (15-40 seconds, frames 450-1200)
// ============================================================================

const LandingPageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scrollY = interpolate(frame, [60, 600], [0, 800], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

  return (
    <AbsoluteFill style={{ background: colors.bg, padding: 60 }}>
      <SectionTitle subtitle="Let's explore the landing page">Welcome to QAgent</SectionTitle>

      <div
        style={{
          marginTop: 40,
          display: 'flex',
          gap: 40,
          height: 'calc(100% - 120px)',
        }}
      >
        {/* Browser mockup */}
        <div style={{ flex: 2 }}>
          <MockBrowser url="qagent.dev">
            <div
              style={{
                height: '100%',
                overflow: 'hidden',
                background: colors.bg,
              }}
            >
              <div
                style={{
                  transform: `translateY(-${scrollY}px)`,
                  padding: 40,
                }}
              >
                {/* Hero Section */}
                <div style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 80 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      background: `${colors.primary}15`,
                      borderRadius: 20,
                      color: colors.primary,
                      fontSize: 14,
                      marginBottom: 20,
                    }}
                  >
                    ✨ Self-Healing QA Agent
                  </div>
                  <h1 style={{ fontSize: 48, fontWeight: 700, color: colors.text, margin: 0 }}>
                    Fix bugs before your
                    <br />
                    <span style={{ color: colors.primary }}>users find them</span>
                  </h1>
                  <p
                    style={{
                      fontSize: 18,
                      color: colors.textMuted,
                      marginTop: 20,
                      maxWidth: 500,
                      marginLeft: 'auto',
                      marginRight: 'auto',
                    }}
                  >
                    QAgent automatically tests your web app, detects bugs, generates fixes, and
                    deploys them.
                  </p>
                  <button
                    style={{
                      marginTop: 30,
                      padding: '14px 28px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span>🐙</span> Connect with GitHub
                  </button>
                </div>

                {/* Features Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 20,
                    marginTop: 40,
                  }}
                >
                  {[
                    { icon: '🐛', title: 'Auto Bug Detection', desc: 'AI-powered testing' },
                    { icon: '✨', title: 'Self-Healing', desc: 'Auto-generates fixes' },
                    { icon: '🔄', title: 'Continuous Learning', desc: 'Gets smarter over time' },
                  ].map((f) => (
                    <div
                      key={f.title}
                      style={{
                        padding: 24,
                        background: colors.bgCard,
                        borderRadius: 12,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          background: `${colors.primary}15`,
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 24,
                          marginBottom: 16,
                        }}
                      >
                        {f.icon}
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>
                        {f.title}
                      </h3>
                      <p style={{ fontSize: 14, color: colors.textMuted, marginTop: 8 }}>
                        {f.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Workflow Steps */}
                <div style={{ marginTop: 80, textAlign: 'center' }}>
                  <h2 style={{ fontSize: 32, fontWeight: 600, color: colors.text }}>
                    The QAgent Loop
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 16,
                      marginTop: 40,
                    }}
                  >
                    {[
                      { step: '01', title: 'Test' },
                      { step: '02', title: 'Detect' },
                      { step: '03', title: 'Fix' },
                      { step: '04', title: 'Learn' },
                    ].map((s) => (
                      <div
                        key={s.step}
                        style={{
                          padding: 24,
                          background: colors.bgCard,
                          borderRadius: 12,
                          border: `1px solid ${colors.border}`,
                          minWidth: 120,
                        }}
                      >
                        <div style={{ fontSize: 12, color: colors.primary, marginBottom: 8 }}>
                          {s.step}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: colors.text }}>
                          {s.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </MockBrowser>
        </div>

        {/* Feature callouts */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <FeatureCallout
            icon="🎯"
            title="Clean, Modern UI"
            description="Intuitive interface designed for developers"
            delay={30}
          />
          <FeatureCallout
            icon="🚀"
            title="One-Click Setup"
            description="Connect your GitHub repo and start testing instantly"
            delay={60}
          />
          <FeatureCallout
            icon="📊"
            title="Real-time Insights"
            description="Track improvements with detailed analytics"
            delay={90}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 3: GITHUB CONNECT (40-55 seconds, frames 1200-1650)
// ============================================================================

const GitHubConnectScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const step1 = spring({ frame: frame - 30, fps, config: { damping: 15 } });
  const step2 = spring({ frame: frame - 120, fps, config: { damping: 15 } });
  const step3 = spring({ frame: frame - 210, fps, config: { damping: 15 } });
  const successPulse = Math.sin(frame / 10) * 0.1 + 1;

  return (
    <AbsoluteFill style={{ background: colors.bg, padding: 60 }}>
      <SectionTitle subtitle="Secure OAuth authentication">Connect Your GitHub</SectionTitle>

      <div
        style={{
          marginTop: 60,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 60,
        }}
      >
        {/* Step 1: Click Connect */}
        <div
          style={{
            opacity: step1,
            transform: `scale(${step1})`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              background: colors.bgCard,
              borderRadius: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              border: `2px solid ${colors.primary}`,
              marginBottom: 16,
            }}
          >
            🔗
          </div>
          <p style={{ fontSize: 16, color: colors.text, fontWeight: 600 }}>Click Connect</p>
          <p style={{ fontSize: 14, color: colors.textMuted }}>One button to start</p>
        </div>

        {/* Arrow */}
        <div style={{ fontSize: 32, color: colors.primary, opacity: step2 }}>→</div>

        {/* Step 2: Authorize */}
        <div
          style={{
            opacity: step2,
            transform: `scale(${step2})`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              background: '#24292e',
              borderRadius: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            🐙
          </div>
          <p style={{ fontSize: 16, color: colors.text, fontWeight: 600 }}>Authorize Access</p>
          <p style={{ fontSize: 14, color: colors.textMuted }}>Repo permissions only</p>
        </div>

        {/* Arrow */}
        <div style={{ fontSize: 32, color: colors.primary, opacity: step3 }}>→</div>

        {/* Step 3: Connected */}
        <div
          style={{
            opacity: step3,
            transform: `scale(${step3 * successPulse})`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              background: `${colors.success}20`,
              borderRadius: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              border: `2px solid ${colors.success}`,
              marginBottom: 16,
            }}
          >
            ✅
          </div>
          <p style={{ fontSize: 16, color: colors.success, fontWeight: 600 }}>Connected!</p>
          <p style={{ fontSize: 14, color: colors.textMuted }}>Ready to test</p>
        </div>
      </div>

      {/* Security badges */}
      <div
        style={{
          marginTop: 80,
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
          opacity: step3,
        }}
      >
        {['🔒 Secure OAuth 2.0', '📝 Minimal Permissions', '🗑️ Revoke Anytime'].map((badge) => (
          <div
            key={badge}
            style={{
              padding: '12px 24px',
              background: colors.bgCard,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              color: colors.textMuted,
              fontSize: 14,
            }}
          >
            {badge}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 4: DASHBOARD OVERVIEW (55-80 seconds, frames 1650-2400)
// ============================================================================

const DashboardOverviewScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerAnim = spring({ frame: frame - 20, fps, config: { damping: 15 } });
  const statsAnim = spring({ frame: frame - 60, fps, config: { damping: 15 } });
  const cardsAnim = spring({ frame: frame - 120, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ background: colors.bg, padding: 40 }}>
      <div style={{ marginBottom: 30 }}>
        <SectionTitle subtitle="Your command center for automated QA">The Dashboard</SectionTitle>
      </div>

      <MockBrowser url="qagent.dev/dashboard">
        <div style={{ height: '100%', background: colors.bg, padding: 24 }}>
          {/* Welcome Header */}
          <div
            style={{
              padding: 24,
              background: colors.bgCard,
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              marginBottom: 24,
              opacity: headerAnim,
              transform: `translateY(${interpolate(headerAnim, [0, 1], [20, 0])}px)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div
                style={{
                  padding: '4px 12px',
                  background: `${colors.primary}15`,
                  borderRadius: 12,
                  color: colors.primary,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                ✨ Self-Healing QA Agent
              </div>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>
              Welcome to QAgent
            </h1>
            <p style={{ fontSize: 14, color: colors.textMuted, marginTop: 8 }}>
              Your unified dashboard for automated testing, bug detection, and self-healing fixes.
            </p>
          </div>

          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginBottom: 24,
              opacity: statsAnim,
              transform: `translateY(${interpolate(statsAnim, [0, 1], [20, 0])}px)`,
            }}
          >
            {[
              { label: 'Total Runs', value: '24', icon: '🚀', trend: '+12%' },
              { label: 'Pass Rate', value: '94%', icon: '📈', trend: '+7%' },
              { label: 'Patches Applied', value: '18', icon: '🔧', trend: '' },
              { label: 'Knowledge Base', value: '87%', icon: '🧠', trend: '' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: 20,
                  background: colors.bgCard,
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: `${colors.primary}15`,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    {stat.icon}
                  </div>
                  {stat.trend && (
                    <span style={{ color: colors.success, fontSize: 12 }}>{stat.trend}</span>
                  )}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: colors.textMuted }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: 24,
              opacity: cardsAnim,
              transform: `translateY(${interpolate(cardsAnim, [0, 1], [20, 0])}px)`,
            }}
          >
            {/* Recent Runs */}
            <div
              style={{
                padding: 20,
                background: colors.bgCard,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0 }}>
                  ▶️ Recent Runs
                </h3>
                <span style={{ fontSize: 12, color: colors.primary }}>View All →</span>
              </div>
              {[
                { repo: 'frontend-app', status: 'completed', pass: '100%' },
                { repo: 'api-service', status: 'running', pass: '85%' },
                { repo: 'mobile-app', status: 'completed', pass: '92%' },
              ].map((run, i) => (
                <div
                  key={run.repo}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    background: colors.bgSecondary,
                    borderRadius: 8,
                    marginBottom: i < 2 ? 8 : 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: run.status === 'completed' ? colors.success : colors.primary,
                      }}
                    />
                    <span style={{ fontSize: 14, color: colors.text }}>{run.repo}</span>
                  </div>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{run.pass} pass</span>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div
              style={{
                padding: 20,
                background: colors.bgCard,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
              }}
            >
              <h3
                style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0, marginBottom: 16 }}
              >
                ⚡ Quick Actions
              </h3>
              {[
                { icon: '▶️', label: 'Start New Run' },
                { icon: '📡', label: 'Setup Monitoring' },
                { icon: '🧠', label: 'View Learning' },
                { icon: '⚙️', label: 'Settings' },
              ].map((action) => (
                <div
                  key={action.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    background: colors.bgSecondary,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{action.icon}</span>
                  <span style={{ fontSize: 14, color: colors.text }}>{action.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MockBrowser>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 5: STARTING A RUN (80-105 seconds, frames 2400-3150)
// ============================================================================

const StartRunScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dialogAppear = spring({ frame: frame - 60, fps, config: { damping: 15 } });
  const selectRepo = spring({ frame: frame - 150, fps, config: { damping: 15 } });
  const clickStart = spring({ frame: frame - 300, fps, config: { damping: 15 } });
  const runStarted = spring({ frame: frame - 400, fps, config: { damping: 15 } });

  const buttonPulse = frame > 300 && frame < 400 ? Math.sin(frame / 5) * 3 : 0;

  return (
    <AbsoluteFill style={{ background: colors.bg, padding: 40 }}>
      <div style={{ marginBottom: 30 }}>
        <SectionTitle subtitle="Select a repo and let QAgent do the rest">
          Starting a Test Run
        </SectionTitle>
      </div>

      <div style={{ display: 'flex', gap: 40, height: 'calc(100% - 100px)' }}>
        {/* Dialog mockup */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              width: 500,
              background: colors.bgCard,
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
              opacity: dialogAppear,
              transform: `scale(${dialogAppear})`,
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Dialog header */}
            <div
              style={{ padding: 24, borderBottom: `1px solid ${colors.border}` }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: 0 }}>
                🚀 Start New Run
              </h3>
              <p style={{ fontSize: 14, color: colors.textMuted, marginTop: 6 }}>
                Select a repository to test
              </p>
            </div>

            {/* Dialog content */}
            <div style={{ padding: 24 }}>
              {/* Repo selector */}
              <label style={{ fontSize: 14, color: colors.textMuted, display: 'block', marginBottom: 8 }}>
                Repository
              </label>
              <div
                style={{
                  padding: 12,
                  background: colors.bgSecondary,
                  borderRadius: 8,
                  border: `2px solid ${selectRepo > 0.5 ? colors.primary : colors.border}`,
                  marginBottom: 20,
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>📁</span>
                  <div>
                    <p style={{ fontSize: 14, color: colors.text, margin: 0 }}>
                      {selectRepo > 0.5 ? 'myorg/frontend-app' : 'Select a repository...'}
                    </p>
                    {selectRepo > 0.5 && (
                      <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                        Last tested 2 hours ago
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div
                  style={{
                    flex: 1,
                    padding: 12,
                    background: colors.bgSecondary,
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>Max Iterations</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: '4px 0 0 0' }}>5</p>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: 12,
                    background: colors.bgSecondary,
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>Test Suite</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: '4px 0 0 0' }}>All</p>
                </div>
              </div>

              {/* Start button */}
              <button
                style={{
                  width: '100%',
                  padding: 14,
                  background: clickStart > 0.5 ? colors.success : colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  transform: `scale(${1 + buttonPulse / 100})`,
                  transition: 'background 0.3s',
                }}
              >
                {runStarted > 0.5 ? '✓ Run Started!' : '▶️ Start Run'}
              </button>
            </div>
          </div>
        </div>

        {/* Step indicators */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
          {[
            { step: 1, title: 'Select Repository', done: selectRepo > 0.5, icon: '📁' },
            { step: 2, title: 'Configure Options', done: clickStart > 0.3, icon: '⚙️' },
            { step: 3, title: 'Start Testing', done: runStarted > 0.5, icon: '🚀' },
          ].map((s, i) => (
            <div
              key={s.step}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: interpolate(frame, [60 + i * 60, 90 + i * 60], [0, 1], {
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: s.done ? colors.success : colors.bgCard,
                  border: `2px solid ${s.done ? colors.success : colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                {s.done ? '✓' : s.icon}
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: s.done ? colors.success : colors.text, margin: 0 }}>
                  {s.title}
                </p>
                <p style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>
                  Step {s.step} of 3
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 6: LIVE RUN PROGRESS (105-130 seconds, frames 3150-3900)
// ============================================================================

const LiveRunScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const agents = [
    { name: 'Tester', icon: '🔍', color: '#8b5cf6', desc: 'Running E2E tests' },
    { name: 'Triage', icon: '🩺', color: '#6366f1', desc: 'Analyzing failures' },
    { name: 'Fixer', icon: '🔧', color: '#f59e0b', desc: 'Generating patches' },
    { name: 'Verifier', icon: '✅', color: '#22c55e', desc: 'Validating fixes' },
  ];

  const cyclePhase = Math.floor(frame / 120) % 4;
  const phaseProgress = (frame % 120) / 120;

  return (
    <AbsoluteFill style={{ background: colors.bg, padding: 40 }}>
      <div style={{ marginBottom: 30 }}>
        <SectionTitle subtitle="Watch the AI agents work in real-time">Live Run Progress</SectionTitle>
      </div>

      <div style={{ display: 'flex', gap: 40, height: 'calc(100% - 100px)' }}>
        {/* Agent cycle visualization */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: 400,
              height: 400,
            }}
          >
            {/* Center status */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 8 }}>{agents[cyclePhase].icon}</div>
              <p style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>{agents[cyclePhase].name}</p>
              <p style={{ fontSize: 14, color: colors.textMuted }}>{agents[cyclePhase].desc}</p>
            </div>

            {/* Agent nodes in circle */}
            {agents.map((agent, i) => {
              const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
              const x = Math.cos(angle) * 150 + 200;
              const y = Math.sin(angle) * 150 + 200;
              const isActive = i === cyclePhase;
              const isDone = i < cyclePhase;

              return (
                <div
                  key={agent.name}
                  style={{
                    position: 'absolute',
                    left: x - 40,
                    top: y - 40,
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    background: isActive ? agent.color : isDone ? `${colors.success}30` : colors.bgCard,
                    border: `3px solid ${isActive ? agent.color : isDone ? colors.success : colors.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `scale(${isActive ? 1.1 : 1})`,
                    transition: 'all 0.3s',
                    boxShadow: isActive ? `0 10px 40px ${agent.color}50` : 'none',
                  }}
                >
                  <span style={{ fontSize: 28 }}>{isDone && !isActive ? '✓' : agent.icon}</span>
                  <span style={{ fontSize: 10, color: isActive ? 'white' : colors.textMuted, marginTop: 4 }}>
                    {agent.name}
                  </span>
                </div>
              );
            })}

            {/* Connection lines */}
            <svg
              style={{ position: 'absolute', left: 0, top: 0, width: 400, height: 400, pointerEvents: 'none' }}
            >
              {agents.map((_, i) => {
                const angle1 = (i / 4) * Math.PI * 2 - Math.PI / 2;
                const angle2 = ((i + 1) / 4) * Math.PI * 2 - Math.PI / 2;
                const x1 = Math.cos(angle1) * 150 + 200;
                const y1 = Math.sin(angle1) * 150 + 200;
                const x2 = Math.cos(angle2) * 150 + 200;
                const y2 = Math.sin(angle2) * 150 + 200;
                const isActive = i === cyclePhase;

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isActive ? colors.primary : colors.border}
                    strokeWidth={isActive ? 3 : 1}
                    strokeDasharray={isActive ? `${phaseProgress * 200} 200` : 'none'}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Run details panel */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              background: colors.bgCard,
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: 20,
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>
                  myorg/frontend-app
                </h3>
                <p style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>Run #24</p>
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  background: `${colors.primary}20`,
                  borderRadius: 6,
                  color: colors.primary,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: colors.primary,
                    animation: 'pulse 1s infinite',
                  }}
                />
                Running
              </div>
            </div>

            <div style={{ padding: 20 }}>
              {/* Progress bar */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: colors.textMuted }}>Progress</span>
                  <span style={{ fontSize: 14, color: colors.text }}>
                    {Math.min(100, Math.round((cyclePhase + phaseProgress) * 25))}%
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: colors.bgSecondary,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (cyclePhase + phaseProgress) * 25)}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${colors.primary}, ${colors.success})`,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {[
                  { label: 'Tests Run', value: `${12 + cyclePhase * 3}` },
                  { label: 'Tests Passed', value: `${10 + cyclePhase * 2}` },
                  { label: 'Bugs Found', value: `${2 + Math.floor(cyclePhase / 2)}` },
                  { label: 'Patches Applied', value: `${cyclePhase}` },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      padding: 16,
                      background: colors.bgSecondary,
                      borderRadius: 8,
                    }}
                  >
                    <p style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 7: PATCHES & DIFF VIEW (130-150 seconds, frames 3900-4500)
// ============================================================================

const PatchesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const listAppear = spring({ frame: frame - 30, fps, config: { damping: 15 } });
  const diffAppear = spring({ frame: frame - 150, fps, config: { damping: 15 } });
  const prAppear = spring({ frame: frame - 350, fps, config: { damping: 15 } });

  const diffLines = [
    { type: 'context', text: '  const handleSubmit = async (data) => {' },
    { type: 'remove', text: '-   if (data.email) {' },
    { type: 'add', text: '+   if (data.email && isValidEmail(data.email)) {' },
    { type: 'context', text: '      await submitForm(data);' },
    { type: 'context', text: '    }' },
    { type: 'add', text: '+   } else {' },
    { type: 'add', text: '+     throw new ValidationError("Invalid email");' },
    { type: 'context', text: '  };' },
  ];

  return (
    <AbsoluteFill style={{ background: colors.bg, padding: 40 }}>
      <div style={{ marginBottom: 30 }}>
        <SectionTitle subtitle="AI-generated fixes with full diff view">
          Patches & Pull Requests
        </SectionTitle>
      </div>

      <div style={{ display: 'flex', gap: 30, height: 'calc(100% - 100px)' }}>
        {/* Patches list */}
        <div
          style={{
            width: 350,
            opacity: listAppear,
            transform: `translateX(${interpolate(listAppear, [0, 1], [-30, 0])}px)`,
          }}
        >
          <div
            style={{
              background: colors.bgCard,
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 20, borderBottom: `1px solid ${colors.border}` }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>
                🔧 Generated Patches
              </h3>
            </div>
            <div style={{ padding: 12 }}>
              {[
                { file: 'form-handler.ts', lines: '+3 -1', status: 'applied' },
                { file: 'auth-service.ts', lines: '+8 -2', status: 'applied' },
                { file: 'api-client.ts', lines: '+5 -3', status: 'pending' },
              ].map((patch, i) => (
                <div
                  key={patch.file}
                  style={{
                    padding: 16,
                    background: i === 0 ? `${colors.primary}10` : 'transparent',
                    borderRadius: 8,
                    border: i === 0 ? `1px solid ${colors.primary}30` : '1px solid transparent',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>📄</span>
                      <span style={{ fontSize: 14, color: colors.text, fontFamily: 'monospace' }}>
                        {patch.file}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: patch.status === 'applied' ? `${colors.success}20` : colors.bgSecondary,
                        color: patch.status === 'applied' ? colors.success : colors.textMuted,
                      }}
                    >
                      {patch.status}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: colors.textMuted }}>
                    <span style={{ color: colors.success }}>+{patch.lines.split(' ')[0].slice(1)}</span>
                    {' / '}
                    <span style={{ color: colors.error }}>{patch.lines.split(' ')[1]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diff view */}
        <div
          style={{
            flex: 1,
            opacity: diffAppear,
            transform: `translateY(${interpolate(diffAppear, [0, 1], [30, 0])}px)`,
          }}
        >
          <div
            style={{
              background: colors.bgCard,
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: 16,
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: 14, fontFamily: 'monospace', color: colors.text }}>
                  form-handler.ts
                </span>
                <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 12 }}>
                  Fix email validation bug
                </span>
              </div>
              <button
                style={{
                  padding: '8px 16px',
                  background: prAppear > 0.5 ? colors.success : colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {prAppear > 0.5 ? '✓ PR Created' : '🔗 Create PR'}
              </button>
            </div>

            <div
              style={{
                flex: 1,
                padding: 20,
                fontFamily: 'monospace',
                fontSize: 14,
                lineHeight: 1.8,
                background: '#0d1117',
              }}
            >
              {diffLines.map((line, i) => {
                const lineOpacity = interpolate(frame, [150 + i * 15, 165 + i * 15], [0, 1], {
                  extrapolateRight: 'clamp',
                });
                return (
                  <div
                    key={i}
                    style={{
                      padding: '2px 8px',
                      opacity: lineOpacity,
                      background:
                        line.type === 'add'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : line.type === 'remove'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'transparent',
                      color:
                        line.type === 'add'
                          ? colors.success
                          : line.type === 'remove'
                            ? colors.error
                            : colors.textMuted,
                    }}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 8: MONITORING SETUP (150-165 seconds, frames 4500-4950)
// ============================================================================

const MonitoringScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelAppear = spring({ frame: frame - 30, fps, config: { damping: 15 } });
  const toggleAnim = spring({ frame: frame - 150, fps, config: { damping: 15 } });
  const chartAnim = spring({ frame: frame - 250, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ background: colors.bg, padding: 40 }}>
      <div style={{ marginBottom: 30 }}>
        <SectionTitle subtitle="Automatic testing on every push">Continuous Monitoring</SectionTitle>
      </div>

      <div style={{ display: 'flex', gap: 30, height: 'calc(100% - 100px)' }}>
        {/* Config panel */}
        <div
          style={{
            flex: 1,
            opacity: panelAppear,
            transform: `translateX(${interpolate(panelAppear, [0, 1], [-30, 0])}px)`,
          }}
        >
          <div
            style={{
              background: colors.bgCard,
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              padding: 24,
            }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: 0, marginBottom: 24 }}>
              📡 Monitored Repositories
            </h3>

            {[
              { repo: 'frontend-app', schedule: 'On Push', enabled: true },
              { repo: 'api-service', schedule: 'Hourly', enabled: true },
              { repo: 'mobile-app', schedule: 'Daily', enabled: false },
            ].map((config, i) => (
              <div
                key={config.repo}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: colors.bgSecondary,
                  borderRadius: 12,
                  marginBottom: i < 2 ? 12 : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>📁</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 500, color: colors.text, margin: 0 }}>
                      {config.repo}
                    </p>
                    <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                      {config.schedule}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 28,
                    borderRadius: 14,
                    background:
                      config.enabled && toggleAnim > 0.5 ? colors.success : colors.bgCard,
                    border: `2px solid ${config.enabled && toggleAnim > 0.5 ? colors.success : colors.border}`,
                    position: 'relative',
                    transition: 'all 0.3s',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: 2,
                      left: config.enabled && toggleAnim > 0.5 ? 24 : 2,
                      transition: 'left 0.3s',
                    }}
                  />
                </div>
              </div>
            ))}

            <button
              style={{
                width: '100%',
                padding: 14,
                background: 'transparent',
                border: `2px dashed ${colors.border}`,
                borderRadius: 12,
                color: colors.textMuted,
                fontSize: 14,
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              + Add Repository
            </button>
          </div>
        </div>

        {/* Activity chart */}
        <div
          style={{
            flex: 1,
            opacity: chartAnim,
            transform: `translateX(${interpolate(chartAnim, [0, 1], [30, 0])}px)`,
          }}
        >
          <div
            style={{
              background: colors.bgCard,
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              padding: 24,
              height: '100%',
            }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: 0, marginBottom: 24 }}>
              📊 Testing Activity
            </h3>

            {/* Simple bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200, marginTop: 40 }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const height = [60, 85, 45, 90, 70, 30, 55][i];
                const barHeight = interpolate(chartAnim, [0, 1], [0, height]);
                return (
                  <div key={day} style={{ flex: 1, textAlign: 'center' }}>
                    <div
                      style={{
                        height: `${barHeight}%`,
                        background: `linear-gradient(180deg, ${colors.primary}, ${colors.primaryDark})`,
                        borderRadius: 6,
                        marginBottom: 12,
                      }}
                    />
                    <span style={{ fontSize: 12, color: colors.textMuted }}>{day}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: colors.primary }} />
                <span style={{ fontSize: 13, color: colors.textMuted }}>Runs Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// SCENE 9: LEARNING & IMPROVEMENT (165-180 seconds, frames 4950-5400)
// ============================================================================

const LearningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerAnim = spring({ frame: frame - 20, fps, config: { damping: 15 } });
  const metricsAnim = spring({ frame: frame - 80, fps, config: { damping: 15 } });
  const chartAnim = spring({ frame: frame - 150, fps, config: { damping: 15 } });
  const outroAnim = spring({ frame: frame - 350, fps, config: { damping: 12 } });

  const improvementCount = interpolate(frame, [80, 200], [0, 23], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: colors.bg, padding: 40 }}>
      {/* Main content - fades out for outro */}
      <div style={{ opacity: interpolate(frame, [350, 400], [1, 0], { extrapolateRight: 'clamp' }) }}>
        <div style={{ marginBottom: 20 }}>
          <SectionTitle subtitle="Watch QAgent get smarter over time">Self-Improvement</SectionTitle>
        </div>

        {/* Big improvement number */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 40,
            opacity: headerAnim,
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 700, color: colors.success }}>
            +{Math.round(improvementCount)}%
          </div>
          <p style={{ fontSize: 18, color: colors.textMuted }}>Improvement this week</p>
        </div>

        {/* Metrics grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
            marginBottom: 40,
            opacity: metricsAnim,
            transform: `translateY(${interpolate(metricsAnim, [0, 1], [30, 0])}px)`,
          }}
        >
          {[
            { label: 'Pass Rate', value: '94%', prev: '87%', icon: '📈' },
            { label: 'Time to Fix', value: '45s', prev: '2m', icon: '⏱️' },
            { label: 'First-Try Success', value: '78%', prev: '62%', icon: '🎯' },
            { label: 'Knowledge Reuse', value: '87%', prev: '71%', icon: '🧠' },
          ].map((metric) => (
            <div
              key={metric.label}
              style={{
                padding: 24,
                background: colors.bgCard,
                borderRadius: 16,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{metric.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: colors.text }}>{metric.value}</div>
              <div style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>{metric.label}</div>
              <div style={{ fontSize: 12, color: colors.success, marginTop: 8 }}>
                ↑ from {metric.prev}
              </div>
            </div>
          ))}
        </div>

        {/* Learning curve chart */}
        <div
          style={{
            background: colors.bgCard,
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            padding: 24,
            opacity: chartAnim,
            transform: `translateY(${interpolate(chartAnim, [0, 1], [30, 0])}px)`,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0, marginBottom: 20 }}>
            📈 Learning Curve (Last 30 Days)
          </h3>
          <div style={{ height: 150, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const baseHeight = 30 + i * 2;
              const variance = Math.sin(i * 0.5) * 10;
              const height = Math.min(100, baseHeight + variance);
              const barProgress = interpolate(chartAnim, [0, 1], [0, 1]);
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${height * barProgress}%`,
                    background: `linear-gradient(180deg, ${colors.success}, ${colors.success}60)`,
                    borderRadius: 4,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Outro overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: colors.bg,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: outroAnim,
          pointerEvents: outroAnim > 0.1 ? 'auto' : 'none',
        }}
      >
        <div style={{ transform: `scale(${outroAnim})`, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30 }}>
            <Img
              src={staticFile('qagentlogo.png')}
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                boxShadow: `0 20px 60px ${colors.primary}40`,
              }}
            />
            <h1 style={{ fontSize: 56, fontWeight: 700, color: colors.text, margin: 0 }}>QAgent</h1>
          </div>

          <p style={{ fontSize: 24, color: colors.textMuted, marginBottom: 50 }}>
            Self-Healing QA for Modern Development
          </p>

          {/* Sponsors */}
          <p style={{ fontSize: 14, color: colors.textDim, marginBottom: 20 }}>
            Built for WeaveHacks 2026 • Powered by
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
            {['W&B Weave', 'Redis', 'Browserbase', 'Vercel'].map((sponsor) => (
              <div
                key={sponsor}
                style={{
                  padding: '12px 20px',
                  background: colors.bgCard,
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  color: colors.textMuted,
                  fontSize: 14,
                }}
              >
                {sponsor}
              </div>
            ))}
          </div>

          <p
            style={{
              marginTop: 50,
              fontSize: 18,
              color: colors.primary,
              opacity: interpolate(frame, [420, 450], [0, 1], { extrapolateRight: 'clamp' }),
            }}
          >
            qagent.dev
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// MAIN COMPOSITION
// ============================================================================

export const QAgentWalkthrough: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: 'Inter, system-ui, sans-serif', background: colors.bg }}>
      {/* Scene 1: Intro (0-15 seconds) */}
      <Sequence from={0} durationInFrames={450}>
        <IntroScene />
      </Sequence>

      {/* Scene 2: Landing Page (15-40 seconds) */}
      <Sequence from={450} durationInFrames={750}>
        <LandingPageScene />
      </Sequence>

      {/* Scene 3: GitHub Connect (40-55 seconds) */}
      <Sequence from={1200} durationInFrames={450}>
        <GitHubConnectScene />
      </Sequence>

      {/* Scene 4: Dashboard Overview (55-80 seconds) */}
      <Sequence from={1650} durationInFrames={750}>
        <DashboardOverviewScene />
      </Sequence>

      {/* Scene 5: Starting a Run (80-105 seconds) */}
      <Sequence from={2400} durationInFrames={750}>
        <StartRunScene />
      </Sequence>

      {/* Scene 6: Live Run Progress (105-130 seconds) */}
      <Sequence from={3150} durationInFrames={750}>
        <LiveRunScene />
      </Sequence>

      {/* Scene 7: Patches & Diff View (130-150 seconds) */}
      <Sequence from={3900} durationInFrames={600}>
        <PatchesScene />
      </Sequence>

      {/* Scene 8: Monitoring Setup (150-165 seconds) */}
      <Sequence from={4500} durationInFrames={450}>
        <MonitoringScene />
      </Sequence>

      {/* Scene 9: Learning & Outro (165-180 seconds) */}
      <Sequence from={4950} durationInFrames={450}>
        <LearningScene />
      </Sequence>
    </AbsoluteFill>
  );
};
