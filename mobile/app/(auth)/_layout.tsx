import { Stack } from 'expo-router';
import { colors } from '@/lib/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.dark.background,
        },
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}
