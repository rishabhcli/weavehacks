import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useCallback } from 'react';
import useSWR from 'swr';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/lib/theme/colors';
import { swrFetcher } from '@/lib/api/client';
import type { TestSpec } from '@/lib/types';

interface TestsResponse {
  testSpecs: TestSpec[];
}

function TestCard({ spec }: { spec: TestSpec }) {
  return (
    <View style={styles.testCard}>
      <View style={styles.testHeader}>
        <View style={styles.testIcon}>
          <Ionicons name="flask-outline" size={18} color={colors.dark.primary} />
        </View>
        <Text style={styles.testName} numberOfLines={1}>{spec.name}</Text>
      </View>
      <Text style={styles.testUrl} numberOfLines={1}>{spec.url}</Text>
      <Text style={styles.testMeta}>{spec.steps.length} steps</Text>
    </View>
  );
}

export default function TestsScreen() {
  const { data, isLoading, mutate } = useSWR<TestsResponse>('/api/tests', swrFetcher);
  const specs = data?.testSpecs || [];

  const onRefresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Test Specs</Text>
          <Text style={styles.subtitle}>E2E tests PatchPilot runs</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color={colors.dark.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={specs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TestCard spec={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.dark.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="flask-outline" size={48} color={colors.dark.mutedForeground} />
            <Text style={styles.emptyTitle}>No test specs yet</Text>
            <Text style={styles.emptyText}>Create test specs in the web dashboard to run automated checks.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[1],
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  testCard: {
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginBottom: spacing[3],
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  testIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testName: {
    fontSize: typography.sizes.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
    flex: 1,
  },
  testUrl: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  testMeta: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[16],
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
    marginTop: spacing[4],
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: spacing[2],
    maxWidth: 260,
  },
});
