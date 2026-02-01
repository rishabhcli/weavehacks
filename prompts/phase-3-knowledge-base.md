# Phase 3: Knowledge Base

**Focus:** Redis vector store for learning from past bugs

**Status:** Pending (requires Phase 2 completion)

---

## Overview

Phase 3 adds the learning capability to QAgent by integrating Redis with vector search. This enables the system to remember past failures and their fixes, making it faster at fixing similar bugs in the future. The Triage and Fixer agents will query this knowledge base to improve their accuracy.

---

## Skills to Load

```
.claude/skills/redis-vectorstore/
├── SKILL.md      # Vector concepts, Redis schema
└── reference.md  # Index creation, embedding, search patterns
```

---

## Ralph Loop Template

```
## Ralph Loop - Phase 3 - Iteration [N]

### 1. READ
- [ ] Load CLAUDE.md for project context
- [ ] Check TASKS.md for Phase 3 tasks
- [ ] Load redis-vectorstore skill
- [ ] Review Redis schema in DESIGN.md

### 2. ANALYZE
- Current task: [Task ID and description]
- Redis status: [Connected/Not connected]
- Index status: [Created/Not created]
- Integration status: [List agents integrated]

### 3. PLAN
Increments for this iteration:
1. [Specific task]
2. [Testing task]
3. [Validation task]

### 4. EXECUTE
[Implement one increment at a time]

### 5. VALIDATE
- [ ] Redis connection works
- [ ] Embeddings generated correctly
- [ ] Index accepts documents
- [ ] Search returns relevant results

### 6. LOOP
- [ ] Update TASKS.md with progress
- [ ] Commit working code
- [ ] Continue to next task or end iteration
```

---

## Tasks

### P3.1: Redis Setup
- [ ] Install redis client
- [ ] Configure REDIS_URL connection
- [ ] Test connection
- [ ] Verify Redis Stack (vector search) is available

### P3.2: Vector Index Creation
- [ ] Create failure_idx index
- [ ] Configure HNSW parameters
- [ ] Set vector dimensions (1536 for text-embedding-3-small)
- [ ] Add metadata fields

### P3.3: Embedding Pipeline
- [ ] Install OpenAI SDK (if not present)
- [ ] Create embedding function
- [ ] Test with sample error messages
- [ ] Verify embedding dimensions

### P3.4: Store Failure Traces
- [ ] Create storeFailure function
- [ ] Store on successful fix
- [ ] Include error message, fix diff, metadata
- [ ] Generate unique IDs

### P3.5: Search Similar Failures
- [ ] Create findSimilar function
- [ ] Implement KNN search
- [ ] Return top 3 matches with similarity
- [ ] Filter by relevance threshold

### P3.6: Integrate with Triage Agent
- [ ] Query Redis in diagnose method
- [ ] Include similar issues in diagnosis
- [ ] Use past fixes to improve suggestions
- [ ] Log Redis hit/miss

### P3.7: Integrate with Fixer Agent
- [ ] Query Redis for fix patterns
- [ ] Include past diffs in LLM prompt
- [ ] Weight recent fixes higher
- [ ] Log Redis contribution

### P3.8: Verify Learning
- [ ] Fix Bug 1 and store
- [ ] Introduce similar bug
- [ ] Verify faster fix with Redis hit
- [ ] Measure iteration reduction

---

## Redis Schema

### Index Configuration

```typescript
const INDEX_CONFIG = {
  name: 'failure_idx',
  prefix: 'failure:',
  schema: {
    // Vector field for semantic search
    embedding: {
      type: 'VECTOR',
      algorithm: 'HNSW',
      attributes: {
        TYPE: 'FLOAT32',
        DIM: 1536,                    // text-embedding-3-small
        DISTANCE_METRIC: 'COSINE',
        M: 16,                        // Max connections per node
        EF_CONSTRUCTION: 200          // Build-time quality
      }
    },
    // Metadata fields
    error_message: { type: 'TEXT' },
    failure_type: { type: 'TAG' },
    file_path: { type: 'TAG' },
    fix_description: { type: 'TEXT' },
    fix_diff: { type: 'TEXT' },
    success: { type: 'TAG' },
    created_at: { type: 'NUMERIC', SORTABLE: true }
  }
};
```

### Document Structure

```typescript
interface FailureDocument {
  id: string;                    // failure:{uuid}
  error_message: string;         // Original error
  failure_type: string;          // UI_BUG, BACKEND_ERROR, etc.
  file_path: string;             // src/components/Checkout.tsx
  fix_description: string;       // "Added onClick handler"
  fix_diff: string;              // Git diff of the fix
  success: boolean;              // Whether fix worked
  created_at: number;            // Unix timestamp
  embedding: Float32Array;       // 1536-dim vector
}
```

---

## Key Functions

### Create Index

```typescript
async function createIndex(redis: RedisClient): Promise<void> {
  try {
    await redis.ft.create('failure_idx', {
      '$.embedding': {
        type: SchemaFieldTypes.VECTOR,
        AS: 'embedding',
        ALGORITHM: VectorAlgorithms.HNSW,
        TYPE: 'FLOAT32',
        DIM: 1536,
        DISTANCE_METRIC: 'COSINE'
      },
      '$.error_message': { type: SchemaFieldTypes.TEXT, AS: 'error_message' },
      '$.failure_type': { type: SchemaFieldTypes.TAG, AS: 'failure_type' },
      '$.fix_description': { type: SchemaFieldTypes.TEXT, AS: 'fix_description' },
      '$.success': { type: SchemaFieldTypes.TAG, AS: 'success' }
    }, {
      ON: 'JSON',
      PREFIX: 'failure:'
    });
  } catch (e) {
    if (!e.message.includes('Index already exists')) throw e;
  }
}
```

### Generate Embedding

```typescript
async function embed(text: string, openai: OpenAI): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000)  // Truncate for token limit
  });
  return response.data[0].embedding;
}
```

### Store Failure

```typescript
async function storeFailure(
  redis: RedisClient,
  failure: FailureReport,
  patch: Patch,
  success: boolean,
  openai: OpenAI
): Promise<void> {
  const embedding = await embed(failure.error.message, openai);
  const id = `failure:${uuidv4()}`;

  await redis.json.set(id, '$', {
    error_message: failure.error.message,
    failure_type: classifyError(failure.error.message),
    file_path: patch.file,
    fix_description: patch.description,
    fix_diff: patch.diff,
    success: success.toString(),
    created_at: Date.now(),
    embedding
  });
}
```

### Find Similar

```typescript
async function findSimilar(
  redis: RedisClient,
  errorMessage: string,
  openai: OpenAI,
  limit: number = 3
): Promise<SimilarFailure[]> {
  const embedding = await embed(errorMessage, openai);
  const vectorBuffer = Buffer.from(new Float32Array(embedding).buffer);

  const results = await redis.ft.search(
    'failure_idx',
    '*=>[KNN $k @embedding $vec AS score]',
    {
      PARAMS: { k: limit, vec: vectorBuffer },
      RETURN: ['error_message', 'fix_description', 'fix_diff', 'score'],
      SORTBY: { BY: 'score', DIRECTION: 'ASC' },
      DIALECT: 2
    }
  );

  return results.documents
    .filter(doc => doc.value.success === 'true')
    .map(doc => ({
      id: doc.id,
      similarity: 1 - parseFloat(doc.value.score),
      fix: doc.value.fix_description,
      diff: doc.value.fix_diff
    }));
}
```

---

## Validation Checklist

### Redis Connection
- [ ] Connection establishes successfully
- [ ] Redis Stack is available (FT.* commands work)
- [ ] Index creation succeeds

### Embedding Pipeline
- [ ] OpenAI API key works
- [ ] Embeddings have correct dimensions (1536)
- [ ] Text truncation works for long messages

### Store/Retrieve
- [ ] Documents store correctly
- [ ] Documents retrieve by ID
- [ ] Vector field is searchable

### Similarity Search
- [ ] KNN query returns results
- [ ] Results sorted by similarity
- [ ] Similar errors return similar fixes

### Agent Integration
- [ ] Triage queries Redis on diagnose
- [ ] Fixer uses past fixes in prompt
- [ ] Successful fixes are stored
- [ ] Redis hits are logged

### Learning Verification
- [ ] First fix takes N iterations
- [ ] Similar bug fix takes <N iterations
- [ ] Redis hit contributes to faster fix

---

## Common Issues

### Connection Failed
```
Error: Connection refused to localhost:6379
```
- Check REDIS_URL environment variable
- Verify Redis server is running
- Check network/firewall settings

### Index Creation Failed
```
Error: ERR unknown command 'FT.CREATE'
```
- Redis Stack not installed
- Use Redis Cloud with search module
- Or install redis-stack locally

### Embedding Dimension Mismatch
```
Error: Vector dimension mismatch
```
- Verify using text-embedding-3-small (1536)
- Check index DIM matches embedding model
- Don't mix embedding models

### Search Returns Empty
```
Results: { total: 0, documents: [] }
```
- Index may be empty
- Check documents were stored correctly
- Verify query syntax

---

## Exit Criteria

Phase 3 is complete when:

1. Redis vector index is created
2. Embedding pipeline works
3. Failure storage works
4. Similarity search returns relevant results
5. Triage and Fixer agents use Redis
6. Demonstrable learning improvement
7. All code is committed

---

## Next Phase

Upon completion, proceed to **Phase 4: Logging & Dashboard** where we add Weave tracing and Marimo visualization.

---

## References

- [.claude/skills/redis-vectorstore/SKILL.md](../.claude/skills/redis-vectorstore/SKILL.md)
- [.claude/skills/redis-vectorstore/reference.md](../.claude/skills/redis-vectorstore/reference.md)
- [docs/DESIGN.md](../docs/DESIGN.md) - Redis schema
- [Redis Vector Search Docs](https://redis.io/docs/stack/search/reference/vectors/)
