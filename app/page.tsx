'use client';

import { Github, ShieldCheck, Zap, Bug, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Bug,
    title: 'Auto Bug Detection',
    description: 'AI-powered tester finds bugs before your users do',
  },
  {
    icon: Sparkles,
    title: 'Self-Healing',
    description: 'Automatically generates and applies fixes for detected issues',
  },
  {
    icon: RefreshCw,
    title: 'Continuous Improvement',
    description: 'Learns from patterns to prevent similar bugs in the future',
  },
];

const sponsors = [
  { name: 'W&B Weave', logo: '/logos/weave.svg', fallback: 'W&B' },
  { name: 'Redis', logo: '/logos/redis.svg', fallback: 'Redis' },
  { name: 'Browserbase', logo: '/logos/browserbase.svg', fallback: 'BB' },
  { name: 'Vercel', logo: '/logos/vercel.svg', fallback: 'Vercel' },
  { name: 'Daily.co', logo: '/logos/daily.svg', fallback: 'Daily' },
  { name: 'Google ADK', logo: '/logos/google.svg', fallback: 'ADK' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -30, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.15, 1],
              x: [0, 40, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 pt-8 pb-16">
        <motion.div
          className="max-w-4xl w-full space-y-12 text-center"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Hero */}
          <div className="flex flex-col items-center gap-4">
            <motion.div
              className="h-16 w-16 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Zap className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              PatchPilot
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-md">
              Self-healing QA agent that tests, detects bugs, and auto-fixes your codebase
            </p>
          </div>

          {/* Feature Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-violet-500/50 transition-colors"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -2 }}
              >
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Card */}
          <motion.div
            className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-8 shadow-xl max-w-md mx-auto"
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-semibold">Get Started</h2>
              <p className="text-sm text-muted-foreground">
                Connect your GitHub account to access the dashboard and start healing your codebase.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <motion.a
                href="/api/auth/github"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Github className="h-5 w-5" />
                Connect with GitHub
              </motion.a>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-green-500" />
                <span>OAuth 2.0 secured • Repo access for PR creation</span>
              </div>
            </div>
          </motion.div>

          {/* Sponsors Section */}
          <motion.div
            className="pt-8"
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-6">
              Powered by
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {sponsors.map((sponsor, index) => (
                <motion.div
                  key={sponsor.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/30 border border-border/30 hover:border-border transition-colors"
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="h-6 w-6 rounded bg-muted/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {sponsor.fallback.slice(0, 2)}
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {sponsor.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          className="absolute bottom-4 text-center"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p className="text-xs text-muted-foreground">
            Built for WeaveHacks 2026 • Self-healing QA powered by AI agents
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
