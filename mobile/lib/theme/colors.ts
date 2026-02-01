// Colors matching the web app's HSL theme converted to RGB for React Native
// Based on the dark theme from globals.css

export const colors = {
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
};
