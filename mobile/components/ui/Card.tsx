import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows } from '@/lib/theme/colors';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated';
  style?: ViewStyle;
}

export function Card({
  variant = 'default',
  style,
  children,
  ...props
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && shadows.md,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
