import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import { useRun, cancelRun, type RunStatus } from '@/lib/hooks';

const statusConfig: Record<
  RunStatus,
  { color: string; icon: keyof typeof Ionicons.glyphMap; label: string; variant: 'default' | 'success' | 'destructive' | 'warning' | 'secondary' }
> = {
  pending: {
    color: colors.mutedForeground,
    icon: 'time-outline',
    label: 'Pending',
    variant: 'secondary',
  },
  running: {
    color: colors.primary,
    icon: 'play-circle',
    label: 'Running',
    variant: 'default',
  },
  passed: {
    color: colors.success,
    icon: 'checkmark-circle',
    label: 'Passed',
    variant: 'success',
  },
  failed: {
    color: colors.destructive,
    icon: 'close-circle',
    label: 'Failed',
    variant: 'destructive',
  },
  cancelled: {
    color: colors.warning,
    icon: 'ban',
    label: 'Cancelled',
    variant: 'warning',
  },
};

const agentSteps = [
  { key: 'tester', label: 'Tester', icon: 'bug-outline' },
  { key: 'triage', label: 'Triage', icon: 'analytics-outline' },
  { key: 'fixer', label: 'Fixer', icon: 'construct-outline' },
  { key: 'verifier', label: 'Verifier', icon: 'checkmark-done-outline' },
];

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { run, isLoading, error, mutate } = useRun(id);

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelRun(id);
      mutate();
    } catch (err) {
      console.error('Failed to cancel run:', err);
    }
  };

  if (!id) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Invalid run ID</Text>
      </View>
    );
  }

  if (isLoading && !run) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !run) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.destructive} />
        <Text style={styles.errorText}>Failed to load run</Text>
        <Button onPress={() => mutate()} variant="secondary">
          Retry
        </Button>
      </View>
    );
  }

  const status = statusConfig[run.status];
  const passRate =
    run.testsTotal > 0
      ? Math.round((run.testsPassed / run.testsTotal) * 100)
      : 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: run.repoName,
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => mutate()}
            tintColor={colors.primary}
          />
        }
      >
        {/* Status Card */}
        <Card style={styles.card}>
          <CardContent style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusRow}>
                <Ionicons name={status.icon} size={24} color={status.color} />
                <Text style={[styles.statusLabel, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
              <Badge variant={status.variant}>{run.status}</Badge>
            </View>

            <Text style={styles.repoName}>{run.repoName}</Text>
            <Text style={styles.runId}>Run ID: {run.id.slice(0, 8)}...</Text>

            {run.status === 'running' && (
              <Button
                onPress={handleCancel}
                variant="destructive"
                style={styles.cancelButton}
              >
                Cancel Run
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{run.testsPassed}</Text>
            <Text style={styles.statLabel}>Passed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{run.testsTotal - run.testsPassed}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{passRate}%</Text>
            <Text style={styles.statLabel}>Pass Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{run.patchesApplied}</Text>
            <Text style={styles.statLabel}>Patches</Text>
          </View>
        </View>

        {/* Progress */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Iteration {run.iteration} of {run.maxIterations}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(run.iteration / run.maxIterations) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Agent Pipeline */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Agent Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.pipeline}>
              {agentSteps.map((step, index) => {
                const isActive = run.currentAgent === step.key;
                const isPast =
                  agentSteps.findIndex((s) => s.key === run.currentAgent) >
                  index;

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
                        size={20}
                        color={
                          isActive || isPast
                            ? colors.primaryForeground
                            : colors.mutedForeground
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.pipelineLabel,
                        isActive && styles.pipelineLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                    {isActive && run.status === 'running' && (
                      <View style={styles.pipelineIndicator}>
                        <ActivityIndicator size="small" color={colors.primary} />
                      </View>
                    )}
                    {index < agentSteps.length - 1 && (
                      <View
                        style={[
                          styles.pipelineConnector,
                          isPast && styles.pipelineConnectorActive,
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.timelineItem}>
              <Ionicons
                name="play-circle-outline"
                size={18}
                color={colors.mutedForeground}
              />
              <Text style={styles.timelineLabel}>Started</Text>
              <Text style={styles.timelineValue}>
                {new Date(run.startedAt).toLocaleString()}
              </Text>
            </View>
            {run.completedAt && (
              <View style={styles.timelineItem}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={colors.mutedForeground}
                />
                <Text style={styles.timelineLabel}>Completed</Text>
                <Text style={styles.timelineValue}>
                  {new Date(run.completedAt).toLocaleString()}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.mutedForeground,
  },
  card: {
    marginBottom: spacing.lg,
  },
  statusCard: {
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  repoName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  runId: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    fontFamily: 'monospace',
  },
  cancelButton: {
    marginTop: spacing.lg,
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.foreground,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  progressInfo: {
    gap: spacing.sm,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  pipeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pipelineStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  pipelineIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pipelineIconActive: {
    backgroundColor: colors.primary,
  },
  pipelineIconPast: {
    backgroundColor: colors.success,
  },
  pipelineLabel: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  pipelineLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  pipelineIndicator: {
    marginTop: spacing.xs,
  },
  pipelineConnector: {
    position: 'absolute',
    top: 22,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: colors.border,
  },
  pipelineConnectorActive: {
    backgroundColor: colors.success,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  timelineLabel: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    flex: 1,
  },
  timelineValue: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontWeight: '500',
  },
});
