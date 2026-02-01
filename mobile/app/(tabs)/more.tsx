import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/lib/theme/colors';

const sections = [
  { label: 'Overview', description: 'Dashboard summary', icon: 'grid-outline', route: '/' },
  { label: 'Runs', description: 'Run history & details', icon: 'play-outline', route: '/runs' },
  { label: 'Patches', description: 'Generated fixes', icon: 'git-branch-outline', route: '/patches' },
  { label: 'Monitoring', description: 'Continuous checks', icon: 'radio-outline', route: '/monitoring' },
  { label: 'Learning', description: 'Self-improvement metrics', icon: 'school-outline', route: '/learning' },
  { label: 'Tests', description: 'E2E test specs', icon: 'flask-outline', route: '/tests' },
  { label: 'Settings', description: 'Account & preferences', icon: 'settings-outline', route: '/settings' },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>More</Text>
      <Text style={styles.subtitle}>All PatchPilot sections</Text>

      <View style={styles.list}>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.label}
            style={styles.listItem}
            onPress={() => router.push(section.route)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={section.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.dark.primary} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.itemTitle}>{section.label}</Text>
              <Text style={styles.itemDescription}>{section.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.dark.mutedForeground} />
          </TouchableOpacity>
        ))}
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
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  title: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Inter-Bold',
    color: colors.dark.foreground,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  list: {
    gap: spacing[3],
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.sizes.base,
    color: colors.dark.foreground,
    fontFamily: 'Inter-SemiBold',
  },
  itemDescription: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[0.5],
  },
});
