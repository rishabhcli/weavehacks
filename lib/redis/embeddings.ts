/**
 * Embeddings Helper
 *
 * Generates text embeddings using Google's Gemini embedding model.
 * Used for semantic similarity search in the knowledge base.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Singleton Gemini client for embeddings
let geminiClient: GoogleGenerativeAI | null = null;

// Gemini embedding model configuration
export const EMBEDDING_MODEL = 'text-embedding-004';
export const EMBEDDING_DIMENSION = 768; // Gemini text-embedding-004 uses 768 dimensions
export const MAX_INPUT_LENGTH = 8000; // Characters to truncate for token limit

/**
 * Get or create the Gemini client
 */
function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is required for embeddings');
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

/**
 * Generate an embedding vector for the given text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  // Truncate text if too long
  const truncatedText = text.slice(0, MAX_INPUT_LENGTH);

  const result = await model.embedContent(truncatedText);
  return result.embedding.values;
}

/**
 * Generate embeddings for multiple texts (batched)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  // Truncate each text
  const truncatedTexts = texts.map((t) => t.slice(0, MAX_INPUT_LENGTH));

  // Gemini doesn't support batch embedding, so we process sequentially
  const embeddings: number[][] = [];
  for (const text of truncatedTexts) {
    const result = await model.embedContent(text);
    embeddings.push(result.embedding.values);
  }

  return embeddings;
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
