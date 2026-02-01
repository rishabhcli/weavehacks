import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '@/lib/theme/colors';
import { useRuns, triggerRun, type Run } from '@/lib/hooks/useRuns';

const statusConfig: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  completed: { color: colors.dark.success, icon: 'checkmark-circle' },
  running: { color: colors.dark.primary, icon: 'sync' },
  failed: { color: colors.dark.destructive, icon: 'close-circle' },
  pending: { color: colors.dark.warning, icon: 'time' },
};

function RunCard({ run, onPress }: { run: Run; onPress: () => void }) {
  const config = statusConfig[run.status] || statusConfig.pending;
  
  return (
    <TouchableOpacity style={styles.runCard} onPress={onPress}>
      <View style={styles.runCardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: `${config.color}20` }]}>
          <Ionicons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>
            {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
          </Text>
        </View>
        <Text style={styles.runDate}>
          {new Date(run.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.runUrl} numberOfLines={1}>{run.targetUrl}</Text>
      
      {run.repoFullName && (
        <View style={styles.repoContainer}>
          <Ionicons name="git-branch-outline" size={12} color={colors.dark.mutedForeground} />
          <Text style={styles.repoText}>{run.repoFullName}</Text>
        </View>
      )}
      
      <View style={styles.runStats}>
        <View style={styles.statItem}>
          <Ionicons name="bug-outline" size={14} color={colors.dark.destructive} />
          <Text style={styles.statItemText}>{run.bugsFound} bugs</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="code-slash-outline" size={14} color={colors.dark.success} />
          <Text style={styles.statItemText}>{run.patchesApplied} patches</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="git-pull-request-outline" size={14} color={colors.dark.primary} />
          <Text style={styles.statItemText}>{run.prsCreated} PRs</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RunsScreen() {
  const router = useRouter();
  const { runs, isLoading, mutate } = useRuns();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRunUrl, setNewRunUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  }, [mutate]);

  const handleCreateRun = async () => {
    if (!newRunUrl.trim()) {
      Alert.alert('Error', 'Please enter a target URL');
      return;
    }

    setCreating(true);
    try {
      await triggerRun({ targetUrl: newRunUrl.trim() });
      setModalVisible(false);
      setNewRunUrl('');
      mutate();
    } catch (error) {
      Alert.alert('Error', 'Failed to create run');
    } finally {
      setCreating(false);
    }
  };

  const filteredRuns = filter
    ? runs.filter((run) => run.status === filter)
    : runs;

  const filterOptions = [
    { label: 'All', value: null },
    { label: 'Running', value: 'running' },
    { label: 'Completed', value: 'completed' },
    { label: 'Failed', value: 'failed' },
  ];

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value ?? 'all'}
            style={[
              styles.filterChip,
              filter === option.value && styles.filterChipActive,
            ]}
            onPress={() => setFilter(option.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === option.value && styles.filterChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Runs List */}
      <FlatList
        data={filteredRuns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RunCard
            run={item}
            onPress={() => router.push(`/run/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.dark.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="play-circle-outline" size={48} color={colors.dark.mutedForeground} />
            <Text style={styles.emptyStateTitle}>No runs yet</Text>
            <Text style={styles.emptyStateText}>
              Tap the button below to start your first QA run
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color={colors.dark.primaryForeground} />
      </TouchableOpacity>

      {/* New Run Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Run</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.dark.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Target URL</Text>
            <TextInput
              style={styles.input}
              value={newRunUrl}
              onChangeText={setNewRunUrl}
              placeholder="https://example.com"
              placeholderTextColor={colors.dark.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.inputHint}>
              Enter the URL of the application to test
            </Text>

            <TouchableOpacity
              style={[styles.createButton, creating && styles.createButtonDisabled]}
              onPress={handleCreateRun}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color={colors.dark.primaryForeground} />
              ) : (
                <>
                  <Ionicons name="play" size={20} color={colors.dark.primaryForeground} />
                  <Text style={styles.createButtonText}>Start Run</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  filterBar: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.secondary,
  },
  filterChipActive: {
    backgroundColor: colors.dark.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark.mutedForeground,
  },
  filterChipTextActive: {
    color: colors.dark.primaryForeground,
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: 100,
  },
  runCard: {
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  runCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    gap: spacing[1],
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Inter-Medium',
  },
  runDate: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  runUrl: {
    fontSize: typography.sizes.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
    marginBottom: spacing[2],
  },
  repoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[3],
  },
  repoText: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  runStats: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statItemText: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[16],
  },
  emptyStateTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
    marginTop: spacing[4],
  },
  emptyStateText: {
    fontSize: typography.sizes.sm,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: spacing[2],
    maxWidth: 250,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing[4],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.foreground,
  },
  modalContent: {
    padding: spacing[4],
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Inter-Medium',
    color: colors.dark.foreground,
    marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.dark.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    fontSize: typography.sizes.base,
    fontFamily: 'Inter-Regular',
    color: colors.dark.foreground,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  inputHint: {
    fontSize: typography.sizes.xs,
    color: colors.dark.mutedForeground,
    fontFamily: 'Inter-Regular',
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.primary,
    borderRadius: borderRadius.lg,
    height: 48,
    gap: spacing[2],
    ...shadows.primary,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontSize: typography.sizes.base,
    fontFamily: 'Inter-SemiBold',
    color: colors.dark.primaryForeground,
  },
});
