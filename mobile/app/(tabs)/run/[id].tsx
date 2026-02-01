import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/lib/theme/colors';
import { useRun } from '@/lib/hooks/useRuns';

const stepConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; description: string }> = {
  tester: { icon: 'eye-outline', description: 'Testing application' },
  triage: { icon: 'bug-outline', description: 'Analyzing errors' },
  fixer: { icon: 'code-slash-outline', description: 'Generating patches' },
  verifier: { icon: 'checkmark-circle-outline', description: 'Verifying fixes' },
  deployer: { icon: 'git-branch-outline', description: 'Creating PR' },
};

const statusColors: Record<string, string> = {
  pending: colors.dark.mutedForeground,
  running: colors.dark.primary,
  completed: colors.dark.success,
  failed: colors.dark.destructive,
};

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { run, isLoading, mutate } = useRun(id);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  }, [mutate]);

  if (isLoading || !run) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="sync" size={32} color={colors.dark.primary} />
        <Text style={styles.loadingText}>Loading run details...</Text>
      </View>
    );
  }

  const statusColor = statusColors[run.status] || colors.dark.mutedForeground;

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
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
        </Text>
      </View>

      {/* Target URL */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Target URL</Text>
        <Text style={styles.targetUrl}>{run.targetUrl}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{run.bugsFound}</Text>
          <Text style={styles.statLabel}>Bugs Found</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{run.patchesGenerated}</Text>
          <Text style={styles.statLabel}>Patches</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{run.patchesApplied}</Text>
          <Text style={styles.statLabel}>Applied</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{run.prsCreated}</Text>
          <Text style={styles.statLabel}>PRs</Text>
        </View>
      </View>

      {/* Agent Pipeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agent Pipeline</Text>
        <View style={styles.pipeline}>
          {run.agentSteps.map((step, index) => {
            const config = stepConfig[step.name.toLowerCase()] || {
              icon: 'help-circle-outline',
              description: step.name,
            };
            const stepColor = statusColors[step.status];
            const isLast = index === run.agentSteps.length - 1;

            return (
              <View key={step.name} style={styles.pipelineStep}>
                <View style={styles.stepIconContainer}>
                  <View style={[styles.stepIcon, { borderColor: stepColor }]}>
                    {step.status === 'running' ? (
                      <Ionicons name="sync" size={20} color={stepColor} />
                    ) : (
                      <Ionicons name={config.icon} size={20} color={stepColor} />
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.stepConnector,
                        { backgroundColor: step.status === 'completed' ? colors.dark.success : colors.dark.border },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepName}>{step.name}</Text>
                  <Text style={styles.stepDescription}>{config.description}</Text>
                  {step.startedAt && (
                    <Text style={styles.stepTime}>
                      Started: {new Date(step.startedAt).toLocaleTimeString()}
                    </Text>
                  )}
                  {step.completedAt && (
                    <Text style={styles.stepTime}>
                      Completed: {new Date(step.completedAt).toLocaleTimeString()}
                    </Text>
                  )}
                  {step.error && (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle" size={14} color={colors.dark.destructive} />
                      <Text style={styles.errorText}>{step.error}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Timestamps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <Ionicons name="play-circle-outline" size={16} color={colors.dark.mutedForeground} />
            <Text style={styles.timelineText}>
              Created: {new Date(run.createdAt).toLocaleString()}
            </Text>
          </View>
          <View style={styles.timelineItem}>
            <Ionicons name="refresh-circle-outline" size={16} color={colors.dark.mutedForeground} />
            <Text style={styles.timelineText}>
              Updated: {new Date(run.updatedAt).toLocaleString()}
            </Text>
          </View>
          {run.completedAt && (
            <View style={styles.timelineItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.dark.success} />
              <Text style={styles.timelineText}>
                Completed: {new Date(run.completedAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Error */}
      {run.error && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error</Text>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.dark.destructive} />
            <Text style={styles.errorMessage}>{run.error}</Text>
          </View>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dark.background,
    gap: spacing[3],
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
    marginBottom: spacing[3],
  },
  targetUrl: {
    fontSize: typography.sizes.base,
    fontFamily: 'Inter-Medium',
    color: colors.dark.foreground,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  statNumber: {
    fontSize: typography.sizes['2xl'],
    fontFamily: 'Inter-Bold',
    color: colors.dark.foreground,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[1],
  },
  pipeline: {
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  pipelineStep: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  stepIconContainer: {
    alignItems: 'center',
    marginRight: spacing[3],
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dark.background,
  },
  stepConnector: {
    width: 2,
    height: 40,
    marginTop: spacing[2],
  },
  stepContent: {
    flex: 1,
    paddingBottom: spacing[4],
  },
  stepName: {
    fontSize: typography.sizes.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
  },
  stepDescription: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[0.5],
  },
  stepTime: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[1],
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginTop: spacing[2],
    padding: spacing[2],
    backgroundColor: `${colors.dark.destructive}15`,
    borderRadius: borderRadius.md,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.dark.destructive,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  timeline: {
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: spacing[3],
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  timelineText: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    backgroundColor: `${colors.dark.destructive}15`,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: `${colors.dark.destructive}30`,
  },
  errorMessage: {
    fontSize: typography.sizes.sm,
    color: colors.dark.destructive,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
});
