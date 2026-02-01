import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/lib/theme/colors';
import { useRun, cancelRun } from '@/lib/hooks/useRuns';
import type { RunStatus } from '@/lib/types';

const statusConfig: Record<
  RunStatus,
  { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  pending: { color: colors.dark.warning, icon: 'time-outline', label: 'Pending' },
  running: { color: colors.dark.primary, icon: 'play-circle', label: 'Running' },
  completed: { color: colors.dark.success, icon: 'checkmark-circle', label: 'Completed' },
  failed: { color: colors.dark.destructive, icon: 'close-circle', label: 'Failed' },
  cancelled: { color: colors.dark.mutedForeground, icon: 'ban', label: 'Cancelled' },
};

const agentSteps = [
  { key: 'tester', label: 'Tester', icon: 'bug-outline' },
  { key: 'triage', label: 'Triage', icon: 'analytics-outline' },
  { key: 'fixer', label: 'Fixer', icon: 'construct-outline' },
  { key: 'verifier', label: 'Verifier', icon: 'checkmark-done-outline' },
];

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const runId = typeof id === 'string' ? id : undefined;
  const { run, isLoading, error, mutate } = useRun(runId);

  const onRefresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const handleCancel = useCallback(async () => {
    if (!runId) return;
    try {
      await cancelRun(runId);
      await mutate();
    } catch (err) {
      console.warn('Failed to cancel run:', err);
    }
  }, [runId, mutate]);

  if (isLoading && !run) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  if (error || !run) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.dark.destructive} />
        <Text style={styles.errorText}>Failed to load run</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => mutate()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const testsTotal = run.testsTotal ?? run.testSpecs?.length ?? 0;
  const testsPassed = run.testsPassed ?? run.testResults?.filter((result) => result.passed).length ?? 0;
  const failedTests = Math.max(0, testsTotal - testsPassed);
  const passRate = testsTotal > 0 ? Math.round((testsPassed / testsTotal) * 100) : 0;
  const patchesApplied = run.patchesApplied ?? run.patches?.length ?? 0;
  const status = statusConfig[run.status];

  const currentIndex = run.currentAgent
    ? agentSteps.findIndex((step) => step.key === run.currentAgent)
    : -1;
  const isDone = run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={colors.dark.primary}
        />
      }
    >
      <Stack.Screen
        options={{
          title: run.repoName || 'Run Details',
          headerBackTitle: 'Back',
        }}
      />

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusRow}>
            <Ionicons name={status.icon} size={22} color={status.color} />
            <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.statusMeta}>Run ID: {run.id.slice(0, 8)}</Text>
        </View>
        <Text style={styles.repoName}>{run.repoName}</Text>
        <Text style={styles.repoMeta}>Iterations: {run.iteration} / {run.maxIterations}</Text>

        {(run.status === 'running' || run.status === 'pending') && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Ionicons name="close" size={16} color={colors.dark.primaryForeground} />
            <Text style={styles.cancelButtonText}>Cancel Run</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{testsPassed}</Text>
          <Text style={styles.statLabel}>Passed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{failedTests}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{passRate}%</Text>
          <Text style={styles.statLabel}>Pass Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{patchesApplied}</Text>
          <Text style={styles.statLabel}>Patches</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <Text style={styles.sectionMeta}>Iteration {run.iteration} of {run.maxIterations}</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  run.maxIterations
                    ? Math.min(100, (run.iteration / run.maxIterations) * 100)
                    : 0
                }%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Agent Pipeline */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Agent Pipeline</Text>
        <View style={styles.pipelineList}>
          {agentSteps.map((step, index) => {
            const isActive = !isDone && currentIndex === index;
            const isPast = isDone || currentIndex > index;

            return (
              <View key={step.key} style={styles.pipelineStep}>
                <View
                  style={[
                    styles.pipelineIcon,
                    isActive && styles.pipelineIconActive,
                    isPast && styles.pipelineIconPast,
                  ]}
                >
                  <Ionicons
                    name={step.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={isActive || isPast ? colors.dark.primaryForeground : colors.dark.mutedForeground}
                  />
                </View>
                <View style={styles.pipelineContent}>
                  <Text
                    style={[
                      styles.pipelineLabel,
                      isActive && styles.pipelineLabelActive,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {isActive && run.status === 'running' && (
                    <Text style={styles.pipelineHint}>In progress…</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timelineRow}>
          <Ionicons name="play-circle-outline" size={18} color={colors.dark.mutedForeground} />
          <Text style={styles.timelineLabel}>Started</Text>
          <Text style={styles.timelineValue}>{new Date(run.startedAt).toLocaleString()}</Text>
        </View>
        {run.completedAt && (
          <View style={styles.timelineRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.dark.mutedForeground} />
            <Text style={styles.timelineLabel}>Completed</Text>
            <Text style={styles.timelineValue}>{new Date(run.completedAt).toLocaleString()}</Text>
          </View>
        )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dark.background,
    gap: spacing[3],
    padding: spacing[6],
  },
  errorText: {
    fontSize: typography.sizes.base,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  retryButton: {
    marginTop: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.secondary,
  },
  retryButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.dark.foreground,
    fontFamily: 'Inter-Medium',
  },
  statusCard: {
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginBottom: spacing[5],
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  statusLabel: {
    fontSize: typography.sizes.base,
    fontFamily: 'Inter-SemiBold',
  },
  statusMeta: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  repoName: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Inter-Bold',
    color: colors.dark.foreground,
  },
  repoMeta: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[1],
  },
  cancelButton: {
    marginTop: spacing[4],
    backgroundColor: colors.dark.destructive,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  cancelButtonText: {
    color: colors.dark.primaryForeground,
    fontFamily: 'Inter-SemiBold',
    fontSize: typography.sizes.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes['2xl'],
    fontFamily: 'Inter-Bold',
    color: colors.dark.foreground,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Medium',
    marginTop: spacing[1],
  },
  sectionCard: {
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.dark.border,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
    marginBottom: spacing[2],
  },
  sectionMeta: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginBottom: spacing[3],
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.dark.secondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.dark.primary,
  },
  pipelineList: {
    gap: spacing[3],
  },
  pipelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  pipelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dark.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineIconActive: {
    backgroundColor: colors.dark.primary,
  },
  pipelineIconPast: {
    backgroundColor: colors.dark.success,
  },
  pipelineContent: {
    flex: 1,
  },
  pipelineLabel: {
    fontSize: typography.sizes.base,
    color: colors.dark.foreground,
    fontFamily: 'Inter-Medium',
  },
  pipelineLabelActive: {
    color: colors.dark.primary,
  },
  pipelineHint: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[0.5],
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  timelineLabel: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  timelineValue: {
    fontSize: typography.sizes.sm,
    color: colors.dark.foreground,
    fontFamily: 'Inter-Medium',
  },
});
