import { NextResponse } from 'next/server';
import { getAllPatches } from '@/lib/dashboard/patch-store';

// GET /api/patches - List all patches
export async function GET() {
  const allPatches = getAllPatches();

  return NextResponse.json({
    patches: allPatches.map((p) => ({
      id: p.id,
      file: p.file,
      description: p.description,
      diff: p.diff,
      linesAdded: p.metadata.linesAdded,
      linesRemoved: p.metadata.linesRemoved,
      status: p.status,
      runId: p.runId,
      createdAt: p.createdAt,
      prUrl: p.prUrl,
      diagnosis: p.diagnosis,
    })),
  });
}
