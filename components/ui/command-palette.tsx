'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Play,
  TestTube2,
  GitBranch,
  Settings,
  Plus,
  Brain,
  Radio,
  Command,
  ArrowRight,
  Clock,
  Sparkles,
  X,
  HelpCircle,
  Moon,
  Sun,
  ExternalLink,
  Github,
  Keyboard,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: 'navigation' | 'action' | 'recent' | 'help';
  shortcut?: string;
  keywords?: string[];
}

interface RecentCommand {
  id: string;
  timestamp: number;
}

const RECENT_COMMANDS_KEY = 'patchpilot_recent_commands';
const MAX_RECENT_COMMANDS = 5;

function useRecentCommands() {
  const [recentCommands, setRecentCommands] = useState<RecentCommand[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
    if (stored) {
      try {
        setRecentCommands(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const addRecentCommand = useCallback((id: string) => {
    setRecentCommands((prev) => {
      const filtered = prev.filter((cmd) => cmd.id !== id);
      const updated = [{ id, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_COMMANDS);
      localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { recentCommands, addRecentCommand };
}

// Fuzzy search implementation
function fuzzyMatch(str: string, pattern: string): number {
  const strLower = str.toLowerCase();
  const patternLower = pattern.toLowerCase();
  
  // Exact match gets highest score
  if (strLower === patternLower) return 1000;
  
  // Starts with gets high score
  if (strLower.startsWith(patternLower)) return 100;
  
  // Contains gets medium score
  if (strLower.includes(patternLower)) return 10;
  
  // Fuzzy match gets lowest score
  let patternIdx = 0;
  let score = 0;
  for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
    if (strLower[i] === patternLower[patternIdx]) {
      score++;
      patternIdx++;
    }
  }
  
  return patternIdx === patternLower.length ? score : 0;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { recentCommands, addRecentCommand } = useRecentCommands();
  const [isDark, setIsDark] = useState(true);

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { 
      id: 'nav-overview', 
      label: 'Go to Dashboard', 
      description: 'Dashboard overview',
      icon: LayoutDashboard, 
      action: () => router.push('/dashboard'), 
      category: 'navigation',
      shortcut: 'G then O',
      keywords: ['home', 'dashboard', 'main']
    },
    { 
      id: 'nav-runs', 
      label: 'Go to Runs', 
      description: 'View all test runs',
      icon: Play, 
      action: () => router.push('/dashboard/runs'), 
      category: 'navigation',
      shortcut: 'G then R',
      keywords: ['tests', 'runs', 'executions']
    },
    { 
      id: 'nav-tests', 
      label: 'Go to Tests', 
      description: 'Manage test specs',
      icon: TestTube2, 
      action: () => router.push('/dashboard/tests'), 
      category: 'navigation',
      shortcut: 'G then T',
      keywords: ['specs', 'test cases', 'scenarios']
    },
    { 
      id: 'nav-learning', 
      label: 'Go to Learning', 
      description: 'View knowledge base',
      icon: Brain, 
      action: () => router.push('/dashboard/learning'), 
      category: 'navigation',
      shortcut: 'G then L',
      keywords: ['knowledge', 'ai', 'patterns']
    },
    { 
      id: 'nav-monitoring', 
      label: 'Go to Monitoring', 
      description: 'Real-time status',
      icon: Radio, 
      action: () => router.push('/dashboard/monitoring'), 
      category: 'navigation',
      shortcut: 'G then M',
      keywords: ['status', 'alerts', 'realtime']
    },
    { 
      id: 'nav-patches', 
      label: 'Go to Patches', 
      description: 'Applied fixes',
      icon: GitBranch, 
      action: () => router.push('/dashboard/patches'), 
      category: 'navigation',
      shortcut: 'G then P',
      keywords: ['fixes', 'pr', 'pull requests']
    },
    { 
      id: 'nav-settings', 
      label: 'Go to Settings', 
      description: 'Configure PatchPilot',
      icon: Settings, 
      action: () => router.push('/dashboard/settings'), 
      category: 'navigation',
      shortcut: 'G then S',
      keywords: ['config', 'preferences', 'account']
    },
    // Actions
    { 
      id: 'action-new-run', 
      label: 'New Test Run', 
      description: 'Start a new test run',
      icon: Plus, 
      action: () => router.push('/dashboard'), 
      category: 'action',
      shortcut: 'N then R',
      keywords: ['create', 'start', 'run']
    },
    { 
      id: 'action-new-test', 
      label: 'Create Test Spec', 
      description: 'Add a new test specification',
      icon: Plus, 
      action: () => router.push('/dashboard/tests/new'), 
      category: 'action',
      shortcut: 'N then T',
      keywords: ['create', 'add', 'spec']
    },
    { 
      id: 'action-toggle-theme', 
      label: 'Toggle Theme', 
      description: 'Switch between light and dark mode',
      icon: isDark ? Sun : Moon, 
      action: () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
      }, 
      category: 'action',
      shortcut: '⌘/Ctrl + Shift + L',
      keywords: ['theme', 'dark', 'light', 'mode']
    },
    // Help
    { 
      id: 'help-shortcuts', 
      label: 'Keyboard Shortcuts', 
      description: 'View all available shortcuts',
      icon: Keyboard, 
      action: () => setShowShortcuts(true), 
      category: 'help',
      keywords: ['shortcuts', 'hotkeys', 'cheatsheet']
    },
    { 
      id: 'help-demo', 
      label: 'View Demo App', 
      description: 'Open the demo e-commerce store',
      icon: ExternalLink, 
      action: () => router.push('/demo'), 
      category: 'help',
      keywords: ['demo', 'example', 'store']
    },
    { 
      id: 'help-github', 
      label: 'GitHub Repository', 
      description: 'View source code on GitHub',
      icon: Github, 
      action: () => window.open('https://github.com', '_blank'), 
      category: 'help',
      keywords: ['github', 'source', 'code']
    },
  ], [router, isDark]);

  // Sort and filter commands using fuzzy search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) {
      // Show recent commands first when no search
      const recentIds = new Set(recentCommands.map(r => r.id));
      const recent = recentCommands
        .map(r => commands.find(c => c.id === r.id))
        .filter(Boolean) as CommandItem[];
      const others = commands.filter(c => !recentIds.has(c.id));
      return [...recent.map(c => ({ ...c, category: 'recent' as const })), ...others];
    }

    return commands
      .map(cmd => ({
        ...cmd,
        score: Math.max(
          fuzzyMatch(cmd.label, search),
          fuzzyMatch(cmd.description || '', search),
          ...(cmd.keywords?.map(k => fuzzyMatch(k, search)) || [0])
        ),
      }))
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [search, commands, recentCommands]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Toggle palette
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen((prev) => !prev);
        setSearch('');
        setSelectedIndex(0);
        setShowShortcuts(false);
      }

      // Toggle theme
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'l') {
        event.preventDefault();
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
      }

      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            addRecentCommand(filteredCommands[selectedIndex].id);
            setIsOpen(false);
            setSearch('');
            setShowShortcuts(false);
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (showShortcuts) {
            setShowShortcuts(false);
          } else {
            setIsOpen(false);
            setSearch('');
          }
          break;
      }
    },
    [isOpen, filteredCommands, selectedIndex, addRecentCommand, showShortcuts, isDark]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const groupedCommands = useMemo(() => {
    if (search.trim()) {
      return { 'Search Results': filteredCommands };
    }
    
    const groups: Record<string, CommandItem[]> = {
      'Recent': [],
      'Navigation': [],
      'Actions': [],
      'Help': [],
    };
    
    filteredCommands.forEach(cmd => {
      const category = cmd.category === 'recent' ? 'Recent' :
                      cmd.category === 'navigation' ? 'Navigation' :
                      cmd.category === 'action' ? 'Actions' : 'Help';
      groups[category].push(cmd);
    });
    
    return Object.fromEntries(Object.entries(groups).filter(([, items]) => items.length > 0));
  }, [filteredCommands, search]);

  return (
    <>
      {/* Command Palette Trigger Button - Visible in header */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative hidden md:flex items-center gap-2 h-9 w-64 px-3 rounded-lg bg-secondary text-sm text-muted-foreground hover:bg-secondary/80 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto flex items-center gap-0.5 rounded bg-background/50 px-1.5 py-0.5 text-xs">
          <Command className="h-3 w-3" />
          <span>K</span>
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Command Palette */}
            <motion.div
              className="fixed inset-x-4 top-[15vh] z-[101] mx-auto max-w-2xl"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl">
                {/* Search Input */}
                <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
                  {showShortcuts ? (
                    <Keyboard className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Search className="h-5 w-5 text-muted-foreground" />
                  )}
                  <input
                    type="text"
                    placeholder={showShortcuts ? "Keyboard Shortcuts" : "Type a command or search..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
                    autoFocus
                    readOnly={showShortcuts}
                  />
                  <button
                    onClick={() => {
                      if (showShortcuts) {
                        setShowShortcuts(false);
                      } else {
                        setIsOpen(false);
                      }
                    }}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                  >
                    <kbd className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs text-muted-foreground">
                      <span>ESC</span>
                    </kbd>
                  </button>
                </div>

                {/* Content */}
                <div className="max-h-[50vh] overflow-y-auto p-2">
                  {showShortcuts ? (
                    <ShortcutsView onClose={() => setShowShortcuts(false)} />
                  ) : filteredCommands.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No results found</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Try a different search term
                      </p>
                    </div>
                  ) : (
                    Object.entries(groupedCommands).map(([category, items]) => (
                      <div key={category} className="mb-2">
                        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {category}
                        </p>
                        {items.map((cmd, index) => {
                          const globalIndex = filteredCommands.indexOf(cmd);
                          return (
                            <CommandRow
                              key={cmd.id}
                              command={cmd}
                              isSelected={globalIndex === selectedIndex}
                              onClick={() => {
                                cmd.action();
                                addRecentCommand(cmd.id);
                                setIsOpen(false);
                                setSearch('');
                              }}
                            />
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {!showShortcuts && (
                  <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-muted-foreground bg-muted/20">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="rounded bg-secondary px-1.5 py-0.5">↑</kbd>
                        <kbd className="rounded bg-secondary px-1.5 py-0.5">↓</kbd>
                        <span className="ml-1">navigate</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="rounded bg-secondary px-1.5 py-0.5">↵</kbd>
                        <span>select</span>
                      </span>
                    </div>
                    <button
                      onClick={() => setShowShortcuts(true)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Shortcuts</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function CommandRow({
  command,
  isSelected,
  onClick,
}: {
  command: CommandItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors group ${
        isSelected
          ? 'bg-primary/20 text-foreground'
          : 'text-foreground/80 hover:bg-secondary/50'
      }`}
    >
      <div className={`p-1.5 rounded-md transition-colors ${isSelected ? 'bg-primary/30' : 'bg-secondary group-hover:bg-secondary/80'}`}>
        <command.icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{command.label}</p>
          {command.shortcut && (
            <kbd className={`hidden sm:inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] ${
              isSelected ? 'bg-primary/30 text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}>
              {command.shortcut}
            </kbd>
          )}
        </div>
        {command.description && (
          <p className="text-xs text-muted-foreground truncate">{command.description}</p>
        )}
      </div>
      {isSelected && <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />}
    </button>
  );
}

function ShortcutsView({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: ['⌘/Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['G', 'then', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'then', 'R'], description: 'Go to Runs' },
      { keys: ['G', 'then', 'T'], description: 'Go to Tests' },
      { keys: ['G', 'then', 'S'], description: 'Go to Settings' },
    ]},
    { category: 'Actions', items: [
      { keys: ['N', 'then', 'R'], description: 'New test run' },
      { keys: ['N', 'then', 'T'], description: 'Create test spec' },
      { keys: ['⌘/Ctrl', 'Shift', 'L'], description: 'Toggle theme' },
    ]},
    { category: 'Command Palette', items: [
      { keys: ['↑', '↓'], description: 'Navigate items' },
      { keys: ['↵'], description: 'Select item' },
      { keys: ['Esc'], description: 'Close palette' },
    ]},
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Keyboard className="h-5 w-5 text-primary" />
          Keyboard Shortcuts
        </h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="space-y-6">
        {shortcuts.map((group) => (
          <div key={group.category}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {group.category}
            </h4>
            <div className="space-y-2">
              {group.items.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className={`px-2 py-1 rounded text-xs ${
                          key === 'then'
                            ? 'text-muted-foreground bg-transparent'
                            : 'bg-secondary text-foreground font-medium'
                        }`}
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 rounded bg-secondary">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
