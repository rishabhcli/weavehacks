'use client';

import { Github, ShieldCheck, Zap, Bug, Sparkles, RefreshCw, ArrowRight, Check } from 'lucide-react';
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
  { name: 'W&B Weave', fallback: 'WB' },
  { name: 'Redis', fallback: 'RD' },
  { name: 'Browserbase', fallback: 'BB' },
  { name: 'Vercel', fallback: 'VC' },
  { name: 'Daily.co', fallback: 'DL' },
  { name: 'Google ADK', fallback: 'AD' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">PatchPilot</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">View on GitHub</span>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Self-Healing QA Agent
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Fix bugs before your
              <br />
              <span className="text-primary">users find them</span>
            </h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              PatchPilot automatically tests your web application, detects bugs, 
              generates fixes, and deploys them—all without writing a single test.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/api/auth/github"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto"
              >
                <Github className="h-5 w-5" />
                Connect with GitHub
              </a>
              <a
                href="/demo"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-lg font-medium border hover:bg-accent transition-colors w-full sm:w-auto"
              >
                View Demo
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Free for open source</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>No credit card required</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-3">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to autonomous QA</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group p-6 rounded-xl border bg-card hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-3">The PatchPilot Loop</h2>
            <p className="text-muted-foreground">A continuous cycle of testing, fixing, and learning</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Test', desc: 'AI agents simulate real user flows' },
              { step: '02', title: 'Detect', desc: 'Bugs captured with full context' },
              { step: '03', title: 'Fix', desc: 'LLM generates and applies patches' },
              { step: '04', title: 'Learn', desc: 'Knowledge base improves over time' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                className="p-5 rounded-xl border bg-card"
              >
                <span className="text-xs font-medium text-primary mb-2 block">{item.step}</span>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 sm:p-12 rounded-2xl border bg-card"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to automate your QA?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join developers who are shipping with confidence. 
              Set up in minutes, see results in hours.
            </p>
            <a
              href="/api/auth/github"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Github className="h-5 w-5" />
              Get Started Free
            </a>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Secure OAuth • Repo access for PR creation only</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sponsors */}
      <section className="py-12 px-6 border-t">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-wider mb-8">
            Powered by industry leaders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.name}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-semibold">
                  {sponsor.fallback}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{sponsor.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>Built for WeaveHacks 2026</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
            <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
