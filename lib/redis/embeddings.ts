/**
 * Embeddings Helper
 *
 * Generates text embeddings using OpenAI's embedding model.
 * Used for semantic similarity search in the knowledge base.
 */

import OpenAI from 'openai';

// Singleton OpenAI client for embeddings
let openaiClient: OpenAI | null = null;

// Embedding model configuration
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSION = 1536;
export const MAX_INPUT_LENGTH = 8000; // Characters to truncate for token limit

/**
 * Get or create the OpenAI client
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Generate an embedding vector for the given text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();

  // Truncate text if too long
  const truncatedText = text.slice(0, MAX_INPUT_LENGTH);

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncatedText,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts (batched)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getOpenAIClient();

  // Truncate each text
  const truncatedTexts = texts.map((t) => t.slice(0, MAX_INPUT_LENGTH));

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncatedTexts,
  });

  return response.data.map((d) => d.embedding);
}

/**
 * Create embedding text from failure information
 * Combines error message and stack trace for better semantic matching
 */
export function createEmbeddingText(errorMessage: string, stackTrace?: string): string {
  const parts = [errorMessage];

  if (stackTrace) {
    // Extract just the relevant parts of the stack trace
    const relevantStack = stackTrace
      .split('\n')
      .slice(0, 5) // First 5 lines
      .join('\n');
    parts.push(relevantStack);
  }

  return parts.join('\n');
}

/**
 * Convert embedding array to Buffer for Redis storage
 */
export function embeddingToBuffer(embedding: number[]): Buffer {
  return Buffer.from(new Float32Array(embedding).buffer);
}

/**
 * Convert Buffer back to embedding array
 */
export function bufferToEmbedding(buffer: Buffer): number[] {
  return Array.from(new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4));
}
