import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/theme/colors';

interface BadgeProps {
  children: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  style,
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`]]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },
  
  // Variants
  default: {
    backgroundColor: colors.dark.secondary,
  },
  success: {
    backgroundColor: `${colors.dark.success}20`,
  },
  warning: {
    backgroundColor: `${colors.dark.warning}20`,
  },
  destructive: {
    backgroundColor: `${colors.dark.destructive}20`,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  
  // Sizes
  size_sm: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },
  size_md: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  
  // Text styles
  text: {
    fontWeight: '500',
  },
  text_default: {
    color: colors.dark.foreground,
  },
  text_success: {
    color: colors.dark.success,
  },
  text_warning: {
    color: colors.dark.warning,
  },
  text_destructive: {
    color: colors.dark.destructive,
  },
  text_outline: {
    color: colors.dark.mutedForeground,
  },
  text_sm: {
    fontSize: typography.sizes.xs,
  },
  text_md: {
    fontSize: typography.sizes.sm,
  },
});
