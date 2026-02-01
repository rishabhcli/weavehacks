import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme/colors';
import { useSession } from '@/lib/hooks/useSession';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, rightElement, destructive }: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingsItemIcon, destructive && styles.destructiveIcon]}>
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? colors.dark.destructive : colors.dark.primary}
        />
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={[styles.settingsItemTitle, destructive && styles.destructiveText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightElement || (onPress && (
        <Ionicons name="chevron-forward" size={16} color={colors.dark.mutedForeground} />
      ))}
    </TouchableOpacity>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, repos } = useSession();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* User Profile */}
      {isAuthenticated && user && (
        <View style={styles.profileCard}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color={colors.dark.mutedForeground} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name || user.login}</Text>
            <Text style={styles.profileUsername}>@{user.login}</Text>
          </View>
          <View style={styles.connectedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.dark.success} />
            <Text style={styles.connectedText}>Connected</Text>
          </View>
        </View>
      )}

      {/* GitHub Section */}
      <SettingsSection title="GitHub">
        <SettingsItem
          icon="logo-github"
          title="Connected Account"
          subtitle={isAuthenticated ? `@${user?.login}` : 'Not connected'}
          rightElement={
            isAuthenticated && (
              <Ionicons name="checkmark-circle" size={20} color={colors.dark.success} />
            )
          }
        />
        <SettingsItem
          icon="git-branch-outline"
          title="Repositories"
          subtitle={`${repos.length} repos available`}
          onPress={() => {}}
        />
      </SettingsSection>

      {/* Notifications Section */}
      <SettingsSection title="Notifications">
        <SettingsItem
          icon="notifications-outline"
          title="Push Notifications"
          subtitle="Get notified when runs complete"
          onPress={() => {}}
        />
        <SettingsItem
          icon="mail-outline"
          title="Email Notifications"
          subtitle="Receive email summaries"
          onPress={() => {}}
        />
      </SettingsSection>

      {/* App Section */}
      <SettingsSection title="App">
        <SettingsItem
          icon="color-palette-outline"
          title="Appearance"
          subtitle="Dark mode"
          onPress={() => {}}
        />
        <SettingsItem
          icon="globe-outline"
          title="API Endpoint"
          subtitle={process.env.EXPO_PUBLIC_API_URL || 'Default'}
          onPress={() => {}}
        />
        <SettingsItem
          icon="information-circle-outline"
          title="About"
          subtitle="Version 1.0.0"
          onPress={() => {}}
        />
      </SettingsSection>

      {/* Support Section */}
      <SettingsSection title="Support">
        <SettingsItem
          icon="help-circle-outline"
          title="Help Center"
          onPress={() => {}}
        />
        <SettingsItem
          icon="chatbubble-outline"
          title="Send Feedback"
          onPress={() => {}}
        />
        <SettingsItem
          icon="document-text-outline"
          title="Privacy Policy"
          onPress={() => {}}
        />
      </SettingsSection>

      {/* Sign Out */}
      {isAuthenticated && (
        <SettingsSection title="Account">
          <SettingsItem
            icon="log-out-outline"
            title="Sign Out"
            onPress={handleLogout}
            destructive
          />
        </SettingsSection>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          PatchPilot Mobile v1.0.0
        </Text>
        <Text style={styles.footerText}>
          Built for WeaveHacks 2026
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    paddingBottom: spacing[10],
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    margin: spacing[4],
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing[3],
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dark.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
  },
  profileUsername: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[0.5],
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: `${colors.dark.success}20`,
    borderRadius: borderRadius.full,
  },
  connectedText: {
    fontSize: typography.sizes.xs,
    color: colors.dark.success,
    fontFamily: 'Inter-Medium',
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  sectionContent: {
    backgroundColor: colors.dark.card,
    marginHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.dark.border,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  settingsItemIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.dark.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  destructiveIcon: {
    backgroundColor: `${colors.dark.destructive}15`,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: typography.sizes.base,
    fontFamily: 'Inter-Medium',
    color: colors.dark.foreground,
  },
  destructiveText: {
    color: colors.dark.destructive,
  },
  settingsItemSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[0.5],
  },
  footer: {
    alignItems: 'center',
    padding: spacing[6],
    gap: spacing[1],
  },
  footerText: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
});
