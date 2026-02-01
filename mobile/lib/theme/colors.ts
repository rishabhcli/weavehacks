// Colors matching the web app's HSL theme converted to RGB for React Native
// Based on the dark theme from globals.css

const palette = {
  // Base colors
  background: '#0a0a0a',        // hsl(0 0% 3.9%)
  foreground: '#fafafa',        // hsl(0 0% 98%)
  
  // Card
  card: '#0a0a0a',              // hsl(0 0% 3.9%)
  cardForeground: '#fafafa',    // hsl(0 0% 98%)
  
  // Primary - Violet
  primary: '#7c3aed',           // hsl(263 70% 58%)
  primaryForeground: '#fafafa', // hsl(0 0% 98%)
  primaryMuted: 'rgba(124, 58, 237, 0.15)',
  
  // Secondary
  secondary: '#262626',         // hsl(0 0% 14.9%)
  secondaryForeground: '#fafafa',
  
  // Muted
  muted: '#262626',             // hsl(0 0% 14.9%)
  mutedForeground: '#a3a3a3',   // hsl(0 0% 63.9%)
  
  // Accent
  accent: '#262626',            // hsl(0 0% 14.9%)
  accentForeground: '#fafafa',
  
  // Destructive
  destructive: '#ef4444',       // hsl(0 84% 60%)
  destructiveForeground: '#fafafa',
  
  // Status colors
  success: '#22c55e',           // Green
  successMuted: 'rgba(34, 197, 94, 0.15)',
  warning: '#f59e0b',           // Amber
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  info: '#3b82f6',              // Blue
  infoMuted: 'rgba(59, 130, 246, 0.15)',
  
  // Border
  border: '#262626',            // hsl(0 0% 14.9%)
  input: '#262626',
  ring: '#d4d4d8',
  
  // Sidebar (matching web)
  sidebar: '#0a0a0a',
  sidebarForeground: '#fafafa',
  sidebarBorder: '#262626',
  sidebarAccent: '#262626',
  sidebarAccentForeground: '#fafafa',
  
  // Utility
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export const colors = {
  ...palette,
  dark: palette,
  light: palette,
};

export const spacing: Record<number, number> = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Run status colors
export const statusColors = {
  pending: colors.mutedForeground,
  running: colors.primary,
  completed: colors.success,
  failed: colors.destructive,
  cancelled: colors.warning,
};

// Shadow styles for React Native
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
};
