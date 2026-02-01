import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme/colors';
import { useSession } from '@/lib/hooks/useSession';
import { useRuns } from '@/lib/hooks/useRuns';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

interface RecentRunItemProps {
  id: string;
  targetUrl: string;
  status: string;
  bugsFound: number;
  createdAt: string;
  onPress: () => void;
}

function RecentRunItem({ id, targetUrl, status, bugsFound, createdAt, onPress }: RecentRunItemProps) {
  const statusColors: Record<string, string> = {
    completed: colors.dark.success,
    running: colors.dark.primary,
    failed: colors.dark.destructive,
    pending: colors.dark.warning,
  };

  const statusIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    completed: 'checkmark-circle',
    running: 'sync',
    failed: 'close-circle',
    pending: 'time',
  };

  return (
    <TouchableOpacity style={styles.runItem} onPress={onPress}>
      <View style={styles.runItemLeft}>
        <Ionicons
          name={statusIcons[status] || 'help-circle'}
          size={20}
          color={statusColors[status] || colors.dark.mutedForeground}
        />
        <View style={styles.runItemInfo}>
          <Text style={styles.runItemUrl} numberOfLines={1}>{targetUrl}</Text>
          <Text style={styles.runItemMeta}>
            {new Date(createdAt).toLocaleDateString()} • {bugsFound} bugs found
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.dark.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useSession();
  const { runs, total, isLoading, mutate } = useRuns({ limit: 5 });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  }, [mutate]);

  // Calculate stats
  const stats = {
    totalRuns: total,
    bugsFound: runs.reduce((acc, run) => acc + run.bugsFound, 0),
    patchesApplied: runs.reduce((acc, run) => acc + run.patchesApplied, 0),
    successRate: total > 0
      ? Math.round((runs.filter(r => r.status === 'completed').length / total) * 100)
      : 0,
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.dark.primary}
        />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Welcome back{user ? `, @${user.login}` : ''}
          </Text>
          <Text style={styles.subtitle}>Here's your QA overview</Text>
        </View>
        <TouchableOpacity
          style={styles.newRunButton}
          onPress={() => router.push('/runs')}
        >
          <Ionicons name="add" size={20} color={colors.dark.primaryForeground} />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Runs"
          value={stats.totalRuns}
          icon="play-circle-outline"
          color={colors.dark.primary}
        />
        <StatCard
          title="Bugs Found"
          value={stats.bugsFound}
          icon="bug-outline"
          color={colors.dark.destructive}
        />
        <StatCard
          title="Patches Applied"
          value={stats.patchesApplied}
          icon="git-branch-outline"
          color={colors.dark.success}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon="trending-up-outline"
          color={colors.dark.warning}
        />
      </View>

      {/* Recent Runs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Runs</Text>
          <TouchableOpacity onPress={() => router.push('/runs')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {runs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={40} color={colors.dark.mutedForeground} />
            <Text style={styles.emptyStateText}>No runs yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start a new run to see it here
            </Text>
          </View>
        ) : (
          <View style={styles.runsList}>
            {runs.map((run) => (
              <RecentRunItem
                key={run.id}
                id={run.id}
                targetUrl={run.targetUrl}
                status={run.status}
                bugsFound={run.bugsFound}
                createdAt={run.createdAt}
                onPress={() => router.push(`/run/${run.id}`)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="play" size={24} color={colors.dark.primary} />
            <Text style={styles.actionText}>New Run</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="mic" size={24} color={colors.dark.primary} />
            <Text style={styles.actionText}>Voice Command</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="analytics" size={24} color={colors.dark.primary} />
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  greeting: {
    fontSize: typography.sizes['2xl'],
    fontFamily: 'Inter-Bold',
    color: colors.dark.foreground,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[1],
  },
  newRunButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  statValue: {
    fontSize: typography.sizes['2xl'],
    fontFamily: 'Inter-Bold',
    color: colors.dark.foreground,
  },
  statTitle: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Medium',
    marginTop: spacing[1],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
  },
  seeAllText: {
    fontSize: typography.sizes.sm,
    color: colors.dark.primary,
    fontFamily: 'Inter-Medium',
  },
  runsList: {
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.dark.border,
    overflow: 'hidden',
  },
  runItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  runItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  runItemInfo: {
    flex: 1,
  },
  runItemUrl: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark.foreground,
  },
  runItemMeta: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[0.5],
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing[10],
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  emptyStateText: {
    fontSize: typography.sizes.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
    marginTop: spacing[3],
  },
  emptyStateSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[1],
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  actionText: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Inter-Medium',
    color: colors.dark.foreground,
    marginTop: spacing[2],
    textAlign: 'center',
  },
});
