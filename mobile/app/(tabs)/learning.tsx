import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/lib/theme/colors';
import { swrFetcher } from '@/lib/api/client';
import type { LearningMetrics, LearningTrend, KnowledgeBaseStats } from '@/lib/types';

function MetricCard({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}{unit}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function LearningScreen() {
  const { data: metrics, mutate: mutateMetrics, isLoading: metricsLoading } = useSWR<LearningMetrics>(
    '/api/learning/metrics',
    swrFetcher
  );
  const { data: trend, mutate: mutateTrend } = useSWR<LearningTrend>(
    '/api/learning/trend',
    swrFetcher
  );
  const { data: kbStats, mutate: mutateKb } = useSWR<KnowledgeBaseStats>(
    '/api/learning/knowledge-base',
    swrFetcher
  );

  const refreshing = metricsLoading;

  const onRefresh = useCallback(async () => {
    await Promise.all([mutateMetrics(), mutateTrend(), mutateKb()]);
  }, [mutateMetrics, mutateTrend, mutateKb]);

  const trendRows = useMemo(() => {
    if (!trend?.labels?.length) return [];
    const last = trend.labels.slice(-7);
    return last.map((label, index) => {
      const pointIndex = trend.labels.length - last.length + index;
      return {
        label,
        passRate: trend.passRates[pointIndex] ?? 0,
      };
    });
  }, [trend]);

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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Self-Improvement</Text>
          <Text style={styles.subtitle}>How QAgent evolves over time</Text>
        </View>
        <View style={styles.improvementBadge}>
          <Ionicons name="sparkles-outline" size={16} color={colors.dark.success} />
          <Text style={styles.improvementText}>+{Math.round(metrics?.improvementPercent ?? 0)}%</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="Pass Rate" value={Math.round(metrics?.passRate ?? 0)} unit="%" />
        <MetricCard label="Avg Time to Fix" value={Math.round(metrics?.avgTimeToFix ?? 0)} unit="s" />
        <MetricCard label="First-Try Success" value={Math.round(metrics?.firstTryRate ?? 0)} unit="%" />
        <MetricCard label="Knowledge Reuse" value={Math.round(metrics?.knowledgeReuseRate ?? 0)} unit="%" />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Learning Trend</Text>
        {trendRows.length === 0 ? (
          <Text style={styles.sectionEmpty}>No trend data yet.</Text>
        ) : (
          <View style={styles.trendList}>
            {trendRows.map((row) => (
              <View key={row.label} style={styles.trendRow}>
                <Text style={styles.trendLabel}>{row.label}</Text>
                <View style={styles.trendBar}>
                  <View
                    style={[
                      styles.trendFill,
                      { width: `${Math.min(100, Math.max(0, row.passRate))}%` },
                    ]}
                  />
                </View>
                <Text style={styles.trendValue}>{Math.round(row.passRate)}%</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Knowledge Base</Text>
        <View style={styles.kbStats}>
          <View style={styles.kbItem}>
            <Text style={styles.kbValue}>{kbStats?.totalPatterns ?? 0}</Text>
            <Text style={styles.kbLabel}>Patterns</Text>
          </View>
          <View style={styles.kbItem}>
            <Text style={styles.kbValue}>{kbStats?.totalFixes ?? 0}</Text>
            <Text style={styles.kbLabel}>Fixes</Text>
          </View>
          <View style={styles.kbItem}>
            <Text style={styles.kbValue}>{kbStats?.successfulFixes ?? 0}</Text>
            <Text style={styles.kbLabel}>Successful</Text>
          </View>
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
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.dark.successMuted,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  improvementText: {
    fontSize: typography.sizes.sm,
    color: colors.dark.success,
    fontFamily: 'Inter-SemiBold',
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
  trendList: {
    gap: spacing[3],
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  trendLabel: {
    width: 60,
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  trendBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.dark.secondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  trendFill: {
    height: '100%',
    backgroundColor: colors.dark.primary,
  },
  trendValue: {
    width: 40,
    textAlign: 'right',
    fontSize: typography.sizes.xs,
    color: colors.dark.foreground,
    fontFamily: 'Inter-Medium',
  },
  kbStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kbItem: {
    alignItems: 'center',
    flex: 1,
  },
  kbValue: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Inter-Bold',
    color: colors.dark.foreground,
  },
  kbLabel: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[1],
  },
});
