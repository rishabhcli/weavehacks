import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Switch,
} from 'react-native';
import { useCallback } from 'react';
import useSWR from 'swr';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/lib/theme/colors';
import { apiClient, swrFetcher } from '@/lib/api/client';
import type { MonitoringConfig, ImprovementMetrics, QueuedRun } from '@/lib/types';

interface ConfigsResponse {
  configs: MonitoringConfig[];
}

interface MetricsResponse {
  metrics: ImprovementMetrics[];
}

interface QueueResponse {
  pending: number;
  processing: number;
  items: QueuedRun[];
}

export default function MonitoringScreen() {
  const { data: configsData, isLoading: configsLoading, mutate: mutateConfigs } = useSWR<ConfigsResponse>(
    '/api/monitoring/configs',
    swrFetcher
  );
  const { data: metricsData, mutate: mutateMetrics } = useSWR<MetricsResponse>(
    '/api/monitoring/metrics',
    swrFetcher
  );
  const { data: queueData, mutate: mutateQueue } = useSWR<QueueResponse>(
    '/api/monitoring/queue',
    swrFetcher
  );

  const onRefresh = useCallback(async () => {
    await Promise.all([mutateConfigs(), mutateMetrics(), mutateQueue()]);
  }, [mutateConfigs, mutateMetrics, mutateQueue]);

  const handleToggle = useCallback(
    async (repoId: string, enabled: boolean) => {
      await apiClient(`/api/monitoring/configs/${repoId}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      });
      await mutateConfigs();
    },
    [mutateConfigs]
  );

  const configs = configsData?.configs || [];
  const metric = metricsData?.metrics?.[0];
  const queue = queueData;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={configsLoading}
          onRefresh={onRefresh}
          tintColor={colors.dark.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Monitoring</Text>
        <Text style={styles.subtitle}>Continuous QA checks on push or schedule</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{Math.round(metric?.passRate ?? 0)}%</Text>
          <Text style={styles.metricLabel}>Pass Rate</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{Math.round((metric?.avgTimeToFix ?? 0) / 1000)}s</Text>
          <Text style={styles.metricLabel}>Avg Time</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metric?.totalRuns ?? 0}</Text>
          <Text style={styles.metricLabel}>Runs</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metric?.successfulPatches ?? 0}</Text>
          <Text style={styles.metricLabel}>Successful Fixes</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Monitored Repositories</Text>
        {configs.length === 0 ? (
          <Text style={styles.sectionEmpty}>No repositories configured yet.</Text>
        ) : (
          <View style={styles.configList}>
            {configs.map((config) => (
              <View key={config.repoId} style={styles.configRow}>
                <View style={styles.configInfo}>
                  <Text style={styles.configName} numberOfLines={1}>{config.repoFullName}</Text>
                  <Text style={styles.configMeta}>{config.schedule.replace('_', ' ')}</Text>
                </View>
                <Switch
                  value={config.enabled}
                  onValueChange={(value) => handleToggle(config.repoId, value)}
                  thumbColor={colors.dark.primaryForeground}
                  trackColor={{ false: colors.dark.secondary, true: colors.dark.primary }}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Queue</Text>
        <View style={styles.queueSummary}>
          <View style={styles.queueBadge}>
            <Ionicons name="time-outline" size={16} color={colors.dark.warning} />
            <Text style={styles.queueText}>Pending: {queue?.pending ?? 0}</Text>
          </View>
          <View style={styles.queueBadge}>
            <Ionicons name="sync" size={16} color={colors.dark.primary} />
            <Text style={styles.queueText}>Processing: {queue?.processing ?? 0}</Text>
          </View>
        </View>
        {(queue?.items?.length ?? 0) === 0 ? (
          <Text style={styles.sectionEmpty}>No queued runs.</Text>
        ) : (
          <View style={styles.queueList}>
            {queue?.items?.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.queueRow}>
                <Ionicons name="radio-outline" size={16} color={colors.dark.mutedForeground} />
                <View style={styles.queueInfo}>
                  <Text style={styles.queueRepo} numberOfLines={1}>{item.repoFullName}</Text>
                  <Text style={styles.queueMeta}>{item.trigger} • {item.status}</Text>
                </View>
              </View>
            ))}
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
  header: {
    marginBottom: spacing[6],
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
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  metricCard: {
    width: '47%',
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  metricValue: {
    fontSize: typography.sizes['2xl'],
    fontFamily: 'Inter-Bold',
    color: colors.dark.foreground,
  },
  metricLabel: {
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
    marginBottom: spacing[3],
  },
  sectionEmpty: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  configList: {
    gap: spacing[3],
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingBottom: spacing[2],
  },
  configInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  configName: {
    fontSize: typography.sizes.base,
    fontFamily: 'Inter-Medium',
    color: colors.dark.foreground,
  },
  configMeta: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[1],
  },
  queueSummary: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
    flexWrap: 'wrap',
  },
  queueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.secondary,
  },
  queueText: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  queueList: {
    gap: spacing[2],
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  queueInfo: {
    flex: 1,
  },
  queueRepo: {
    fontSize: typography.sizes.sm,
    color: colors.dark.foreground,
    fontFamily: 'Inter-Medium',
  },
  queueMeta: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[0.5],
  },
});
