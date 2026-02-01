/**
 * Weave Feedback for QAgent
 *
 * Captures user feedback on agent runs for quality tracking
 * and self-improvement. Feedback is attached to traces.
 */

import { weave, isWeaveEnabled } from './core';

/**
 * Feedback types for QAgent
 */
export type FeedbackType =
  | 'patch_quality'
  | 'diagnosis_accuracy'
  | 'test_coverage'
  | 'overall_satisfaction';

/**
 * Feedback entry
 */
export interface Feedback {
  runId: string;
  type: FeedbackType;
  score: number; // 0-1
  comment?: string;
  timestamp: string;
  userId?: string;
}

/**
 * Record feedback for a run
 */
export const recordFeedback = isWeaveEnabled()
  ? weave.op(
      async function recordFeedback(feedback: Feedback): Promise<void> {
        weave.withAttributes(
          {
            feedback_run_id: feedback.runId,
            feedback_type: feedback.type,
            feedback_score: feedback.score,
            feedback_comment: feedback.comment || '',
            feedback_timestamp: feedback.timestamp,
            feedback_user: feedback.userId || 'anonymous',
          },
          () => {
            console.log(
              `📝 Recorded ${feedback.type} feedback for run ${feedback.runId}: ${feedback.score}`
            );
          }
        );
      },
      { name: 'Feedback.record' }
    )
  : async (_feedback: Feedback): Promise<void> => {};

/**
 * Record positive feedback (thumbs up)
 */
export async function recordPositiveFeedback(
  runId: string,
  type: FeedbackType = 'overall_satisfaction',
  comment?: string
): Promise<void> {
  await recordFeedback({
    runId,
    type,
    score: 1.0,
    comment,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Record negative feedback (thumbs down)
 */
export async function recordNegativeFeedback(
  runId: string,
  type: FeedbackType = 'overall_satisfaction',
  comment?: string
): Promise<void> {
  await recordFeedback({
    runId,
    type,
    score: 0.0,
    comment,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Record rated feedback (1-5 stars)
 */
export async function recordRatedFeedback(
  runId: string,
  rating: 1 | 2 | 3 | 4 | 5,
  type: FeedbackType = 'overall_satisfaction',
  comment?: string
): Promise<void> {
  await recordFeedback({
    runId,
    type,
    score: (rating - 1) / 4, // Convert 1-5 to 0-1
    comment,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Aggregate feedback for analysis
 */
export interface FeedbackSummary {
  runId: string;
  totalFeedback: number;
  avgScore: number;
  scoresByType: Record<FeedbackType, { count: number; avgScore: number }>;
  recentComments: string[];
}

/**
 * Compute feedback summary for a run
 */
export function computeFeedbackSummary(
  feedbackList: Feedback[],
  runId: string
): FeedbackSummary {
  const runFeedback = feedbackList.filter((f) => f.runId === runId);

  const scoresByType: Record<
    FeedbackType,
    { count: number; totalScore: number }
  > = {
    patch_quality: { count: 0, totalScore: 0 },
    diagnosis_accuracy: { count: 0, totalScore: 0 },
    test_coverage: { count: 0, totalScore: 0 },
    overall_satisfaction: { count: 0, totalScore: 0 },
  };

  let totalScore = 0;
  const comments: string[] = [];

  for (const f of runFeedback) {
    totalScore += f.score;
    scoresByType[f.type].count += 1;
    scoresByType[f.type].totalScore += f.score;
    if (f.comment) {
      comments.push(f.comment);
    }
  }

  const avgScoresByType: Record<
    FeedbackType,
    { count: number; avgScore: number }
  > = {
    patch_quality: {
      count: scoresByType.patch_quality.count,
      avgScore:
        scoresByType.patch_quality.count > 0
          ? scoresByType.patch_quality.totalScore /
            scoresByType.patch_quality.count
          : 0,
    },
    diagnosis_accuracy: {
      count: scoresByType.diagnosis_accuracy.count,
      avgScore:
        scoresByType.diagnosis_accuracy.count > 0
          ? scoresByType.diagnosis_accuracy.totalScore /
            scoresByType.diagnosis_accuracy.count
          : 0,
    },
    test_coverage: {
      count: scoresByType.test_coverage.count,
      avgScore:
        scoresByType.test_coverage.count > 0
          ? scoresByType.test_coverage.totalScore /
            scoresByType.test_coverage.count
          : 0,
    },
    overall_satisfaction: {
      count: scoresByType.overall_satisfaction.count,
      avgScore:
        scoresByType.overall_satisfaction.count > 0
          ? scoresByType.overall_satisfaction.totalScore /
            scoresByType.overall_satisfaction.count
          : 0,
    },
  };

  return {
    runId,
    totalFeedback: runFeedback.length,
    avgScore: runFeedback.length > 0 ? totalScore / runFeedback.length : 0,
    scoresByType: avgScoresByType,
    recentComments: comments.slice(-5),
  };
}

/**
 * Log feedback summary to Weave
 */
export const logFeedbackSummary = isWeaveEnabled()
  ? weave.op(
      async function logFeedbackSummary(summary: FeedbackSummary): Promise<void> {
        weave.withAttributes(
          {
            feedback_summary_run_id: summary.runId,
            feedback_total: summary.totalFeedback,
            feedback_avg_score: summary.avgScore,
            feedback_patch_quality: summary.scoresByType.patch_quality.avgScore,
            feedback_diagnosis_accuracy:
              summary.scoresByType.diagnosis_accuracy.avgScore,
            feedback_test_coverage: summary.scoresByType.test_coverage.avgScore,
            feedback_satisfaction:
              summary.scoresByType.overall_satisfaction.avgScore,
          },
          () => {
            console.log(
              `📊 Logged feedback summary for run ${summary.runId}: avg=${summary.avgScore.toFixed(2)}`
            );
          }
        );
      },
      { name: 'Feedback.logSummary' }
    )
  : async (_summary: FeedbackSummary): Promise<void> => {};
