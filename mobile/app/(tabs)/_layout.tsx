import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme/colors';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

export default function TabLayout() {
  // Initialize push notifications
  usePushNotifications();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.dark.primary,
        tabBarInactiveTintColor: colors.dark.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.dark.background,
          borderTopColor: colors.dark.border,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 30,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 11,
        },
        headerStyle: {
          backgroundColor: colors.dark.background,
          borderBottomColor: colors.dark.border,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.dark.foreground,
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 17,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
          headerTitle: 'QAgent',
        }}
      />
      <Tabs.Screen
        name="runs"
        options={{
          title: 'Runs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patches"
        options={{
          title: 'Patches',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-branch-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="monitoring"
        options={{
          title: 'Monitoring',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="radio-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="learning"
        options={{
          href: null,
          title: 'Learning',
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          href: null,
          title: 'Tests',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'Settings',
        }}
      />
      <Tabs.Screen
        name="runs/[id]"
        options={{
          href: null, // Hide from tab bar
          title: 'Run Details',
        }}
      />
    </Tabs>
  );
}
