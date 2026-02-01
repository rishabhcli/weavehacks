/**
 * Weave MCP Client
 * Enables PatchPilot to query its own traces for self-improvement
 */

import { Client } from '@modelcontextprotocol/sdk/client';

const WEAVE_MCP_URL = 'https://mcp.withwandb.com/mcp';

export async function createWeaveMCPClient(): Promise<Client> {
  const { StreamableHTTPClientTransport } = await import(
    '@modelcontextprotocol/sdk/client/streamableHttp'
  );
  const transport = new StreamableHTTPClientTransport(new URL(WEAVE_MCP_URL), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${process.env.WANDB_API_KEY ?? ''}`,
        Accept: 'application/json, text/event-stream',
      },
    },
  });
  const client = new Client(
    { name: 'patchpilot-weave', version: '0.1.0' },
    { capabilities: {} }
  );
  await client.connect(transport);
  return client;
}

export interface TraceSummary {
  id: string;
  status: string;
  created_at?: string;
  [key: string]: unknown;
}

function parseToolResult(result: { content?: Array<{ type: string; text?: string }> }): unknown {
  const content = result?.content;
  if (!content?.length || content[0].type !== 'text') return [];
  try {
    return JSON.parse(content[0].text ?? '[]');
  } catch {
    return [];
  }
}

export async function queryRecentFailures(
  projectName: string = 'patchpilot'
): Promise<TraceSummary[]> {
  const client = await createWeaveMCPClient();
  try {
    const result = await client.callTool({
      name: 'search_traces',
      arguments: {
        project: projectName,
        filter: 'status:error',
        limit: 10,
        sort: 'created_at:desc',
      },
    });
    const parsed = parseToolResult(result as { content?: Array<{ type: string; text?: string }> });
    return Array.isArray(parsed) ? parsed : [];
  } finally {
    await client.close();
  }
}

export async function getTraceDetails(traceId: string): Promise<unknown> {
  const client = await createWeaveMCPClient();
  try {
    const result = await client.callTool({
      name: 'get_trace',
      arguments: { trace_id: traceId },
    });
    return parseToolResult(result as { content?: Array<{ type: string; text?: string }> });
  } finally {
    await client.close();
  }
}

export async function analyzeFailurePatterns(
  projectName: string = 'patchpilot'
): Promise<unknown> {
  const client = await createWeaveMCPClient();
  try {
    const result = await client.callTool({
      name: 'analyze_runs',
      arguments: {
        project: projectName,
        query: 'What are the most common failure patterns in the last 24 hours?',
      },
    });
    return parseToolResult(result as { content?: Array<{ type: string; text?: string }> });
  } finally {
    await client.close();
  }
}
