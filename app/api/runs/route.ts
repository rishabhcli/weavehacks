import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  createRun, 
  getAllRuns, 
  getRunStats, 
  updateRunStatus, 
  updateRunAgent, 
  addRunPatch, 
} from '@/lib/dashboard/run-store';
import { 
  emitRunStarted, 
  emitAgentStarted, 
  emitAgentCompleted,
  emitPatchGenerated,
  emitRunCompleted,
  emitRunError,
  sseEmitter,
} from '@/lib/dashboard/sse-emitter';
import { Orchestrator } from '@/agents/orchestrator';
import { triggerVercelDeployment, createPatchPR } from '@/lib/github/patches';
import type { AgentType, Patch, DiagnosisReport } from '@/lib/types';

// GET /api/runs - List all runs
export async function GET() {
  const runs = getAllRuns();
  const stats = getRunStats();

  return NextResponse.json({
    runs: runs.map((run) => ({
      id: run.id,
      repoId: run.repoId,
      repoName: run.repoName,
      status: run.status,
      currentAgent: run.currentAgent,
      iteration: run.iteration,
      maxIterations: run.maxIterations,
      testsTotal: run.testSpecs.length,
      testsPassed: run.testResults.filter((r) => r.passed).length,
      patchesApplied: run.patches.length,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
    })),
    stats,
  });
}

// POST /api/runs - Start a new run
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { 
      repoId, 
      repoName, 
      testSpecs, 
      maxIterations = 5, 
      targetUrl,
      cloudMode = false 
    } = body;

    if (!testSpecs || !Array.isArray(testSpecs) || testSpecs.length === 0) {
      return NextResponse.json(
        { error: 'At least one test spec is required' },
        { status: 400 }
      );
    }

    // In cloud mode, require a repository
    if (cloudMode && !repoName) {
      return NextResponse.json(
        { error: 'Repository is required for cloud mode' },
        { status: 400 }
      );
    }

    // Get GitHub access token from session for cloud mode
    let githubToken: string | undefined;
    if (cloudMode) {
      const cookieStore = await cookies();
      const session = cookieStore.get('patchpilot_session');
      if (session) {
        try {
          const sessionData = JSON.parse(session.value);
          githubToken = sessionData.accessToken;
        } catch {
          // Session parse error
        }
      }
    }

    const run = createRun({
      repoId: repoId || 'local',
      repoName: repoName || 'Demo App',
      testSpecs,
      maxIterations,
    });

    // Emit SSE event - run starting
    emitRunStarted(run.id);
    updateRunStatus(run.id, 'running');

    // Start the orchestrator in the background
    if (cloudMode && repoName && githubToken) {
      runCloudOrchestrator(run.id, repoName, testSpecs, maxIterations, githubToken);
    } else {
      // Fallback to local mode with target URL
      runLocalOrchestrator(run.id, testSpecs, maxIterations, targetUrl);
    }

    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating run:', error);
    return NextResponse.json(
      { error: 'Failed to create run' },
      { status: 500 }
    );
  }
}

/**
 * Run the orchestrator in cloud mode:
 * 1. Deploy repo to Vercel Preview
 * 2. Run tests against preview URL
 * 3. On failure, create PR with fix
 */
async function runCloudOrchestrator(
  runId: string,
  repoFullName: string,
  testSpecs: Array<{ id: string; name: string; url: string; steps: Array<{ action: string; expected?: string }> }>,
  maxIterations: number,
  githubToken: string
) {
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID;

  try {
    // Emit deployment status
    sseEmitter.emit({
      type: 'status',
      timestamp: new Date(),
      runId,
      data: { status: 'deploying', message: 'Deploying to Vercel Preview...' },
    });

    // 1. Deploy to Vercel (if configured)
    let targetUrl = process.env.TARGET_URL || 'http://localhost:3002';
    
    if (vercelToken && vercelProjectId) {
      // eslint-disable-next-line no-console
      console.log(`\n☁️ Cloud Mode: Deploying ${repoFullName} to Vercel...`);
      
      const deployment = await triggerVercelDeployment(vercelToken, vercelProjectId, 'main');
      if (deployment) {
        targetUrl = deployment.url;
        // eslint-disable-next-line no-console
        console.log(`✓ Deployed to: ${targetUrl}`);
        
        sseEmitter.emit({
          type: 'status',
          timestamp: new Date(),
          runId,
          data: { status: 'deployed', deploymentUrl: targetUrl },
        });
      } else {
        // eslint-disable-next-line no-console
        console.log('⚠ Vercel deployment failed, using fallback URL');
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('⚠ Vercel not configured, using TARGET_URL');
    }

    // eslint-disable-next-line no-console
    console.log(`\n🚀 Starting PatchPilot cloud run ${runId}`);
    // eslint-disable-next-line no-console
    console.log(`   Repo: ${repoFullName}`);
    // eslint-disable-next-line no-console
    console.log(`   Target: ${targetUrl}`);
    // eslint-disable-next-line no-console
    console.log(`   Tests: ${testSpecs.length}`);
    // eslint-disable-next-line no-console
    console.log(`   Max iterations: ${maxIterations}\n`);

    // Update test spec URLs to use deployment URL
    const updatedTestSpecs = testSpecs.map(spec => ({
      ...spec,
      url: spec.url.replace(/https?:\/\/[^/]+/, targetUrl),
    }));

    // Start with tester
    emitAgentStarted(runId, 'tester');
    updateRunAgent(runId, 'tester');

    // 2. Run orchestrator
    const orchestrator = new Orchestrator();
    
    // Set up callback to create PRs when patches are generated
    orchestrator.onPatchGenerated = async (patch: Patch, diagnosis: DiagnosisReport) => {
      try {
        // eslint-disable-next-line no-console
        console.log(`\n📝 Creating PR for fix: ${patch.description}`);
        
        const result = await createPatchPR(
          githubToken,
          repoFullName,
          patch,
          {
            rootCause: diagnosis.rootCause,
            confidence: diagnosis.confidence,
            suggestedFix: diagnosis.suggestedFix,
          }
        );

        // eslint-disable-next-line no-console
        console.log(`✓ PR created: ${result.prUrl}`);
        
        // Emit PR creation event
        sseEmitter.emit({
          type: 'patch',
          timestamp: new Date(),
          runId,
          data: { 
            patch, 
            prUrl: result.prUrl,
            prNumber: result.prNumber,
            status: 'pr_created',
          },
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to create PR:', error);
      }
    };

    const result = await orchestrator.run({
      maxIterations,
      testSpecs: updatedTestSpecs,
      targetUrl,
    });

    // Update run with results
    if (result.success) {
      updateRunStatus(runId, 'completed');
      emitRunCompleted(runId, true);
    } else {
      updateRunStatus(runId, 'failed');
      emitRunCompleted(runId, false);
    }

    // Add patches to run store
    if (result.patches && result.patches.length > 0) {
      for (const patch of result.patches) {
        addRunPatch(runId, patch);
        emitPatchGenerated(runId, patch);
      }
    }

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error in cloud orchestrator run ${runId}:`, error);
    updateRunStatus(runId, 'failed');
    emitRunError(runId, error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Run the orchestrator locally (original mode)
 */
async function runLocalOrchestrator(
  runId: string, 
  testSpecs: Array<{ id: string; name: string; url: string; steps: Array<{ action: string; expected?: string }> }>,
  maxIterations: number,
  targetUrl?: string
) {
  const appTargetUrl = targetUrl || process.env.TARGET_URL || 'http://localhost:3002';
  
  try {
    // eslint-disable-next-line no-console
    console.log(`\n🚀 Starting PatchPilot local run ${runId}\n   Target: ${appTargetUrl}\n   Tests: ${testSpecs.length}\n   Max iterations: ${maxIterations}\n`);
    
    const emitAgentProgress = (agent: AgentType, status: 'started' | 'completed') => {
      if (status === 'started') {
        updateRunAgent(runId, agent);
        emitAgentStarted(runId, agent);
      } else {
        emitAgentCompleted(runId, agent);
      }
    };

    // Start with tester
    emitAgentProgress('tester', 'started');
    
    // Create and run orchestrator
    const orchestrator = new Orchestrator();
    
    const result = await orchestrator.run({
      maxIterations,
      testSpecs,
      targetUrl: appTargetUrl,
    });

    // Update run with results
    if (result.success) {
      updateRunStatus(runId, 'completed');
      emitRunCompleted(runId, true);
    } else {
      updateRunStatus(runId, 'failed');
      emitRunCompleted(runId, false);
    }

    // Add patches to run store
    if (result.patches && result.patches.length > 0) {
      for (const patch of result.patches) {
        addRunPatch(runId, patch);
        emitPatchGenerated(runId, patch);
      }
    }

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error in orchestrator run ${runId}:`, error);
    updateRunStatus(runId, 'failed');
    emitRunError(runId, error instanceof Error ? error.message : 'Unknown error');
  }
}
