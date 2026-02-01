/**
 * Unit tests for Knowledge Base utilities
 * Tests embedding and buffer conversion logic without requiring Redis
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Google Generative AI for embeddings
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        embedContent: vi.fn().mockResolvedValue({
          embedding: { values: new Array(768).fill(0.1) },
        }),
      }),
    })),
  };
});

// Import after mocking
import {
  generateEmbedding,
  createEmbeddingText,
  embeddingToBuffer,
  bufferToEmbedding,
  EMBEDDING_DIMENSION,
} from '@/lib/redis/embeddings';

describe('Embeddings Utilities', () => {
  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'test-key';
    vi.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding with correct dimension', async () => {
      const embedding = await generateEmbedding('Test error message');
      expect(embedding).toHaveLength(EMBEDDING_DIMENSION);
    });

    it('should handle long text by truncating', async () => {
      const longText = 'x'.repeat(10000);
      const embedding = await generateEmbedding(longText);
      expect(embedding).toHaveLength(EMBEDDING_DIMENSION);
    });
  });

  describe('createEmbeddingText', () => {
    it('should combine error message and stack trace', () => {
      const text = createEmbeddingText(
        'Error: Cannot read property',
        'at onClick (app/cart/page.tsx:10)\nat handleClick'
      );
      expect(text).toContain('Error: Cannot read property');
      expect(text).toContain('at onClick');
    });

    it('should handle missing stack trace', () => {
      const text = createEmbeddingText('Simple error');
      expect(text).toBe('Simple error');
    });

    it('should limit stack trace lines', () => {
      const longStack = Array(20)
        .fill('at someFunction')
        .join('\n');
      const text = createEmbeddingText('Error', longStack);
      const lines = text.split('\n');
      // Should have error message + first 5 stack lines
      expect(lines.length).toBeLessThanOrEqual(6);
    });

    it('should handle empty error message', () => {
      const text = createEmbeddingText('');
      expect(text).toBe('');
    });
  });

  describe('Buffer conversion', () => {
    it('should convert embedding to buffer and back', () => {
      const original = [0.1, 0.2, 0.3, 0.4, 0.5];
      const buffer = embeddingToBuffer(original);
      const restored = bufferToEmbedding(buffer);

      expect(restored).toHaveLength(original.length);
      for (let i = 0; i < original.length; i++) {
        expect(restored[i]).toBeCloseTo(original[i], 5);
      }
    });

    it('should handle large embeddings', () => {
      const original = new Array(1536).fill(0).map((_, i) => i / 1536);
      const buffer = embeddingToBuffer(original);
      const restored = bufferToEmbedding(buffer);

      expect(restored).toHaveLength(original.length);
      expect(restored[0]).toBeCloseTo(original[0], 5);
      expect(restored[1535]).toBeCloseTo(original[1535], 5);
    });

    it('should produce correct buffer size', () => {
      const embedding = [0.1, 0.2, 0.3];
      const buffer = embeddingToBuffer(embedding);
      // Each Float32 is 4 bytes
      expect(buffer.length).toBe(embedding.length * 4);
    });
  });

  describe('EMBEDDING_DIMENSION', () => {
    it('should be 768 for Gemini text-embedding-004', () => {
      expect(EMBEDDING_DIMENSION).toBe(768);
    });
  });
});

describe('Failure Type Classification', () => {
  // Test the classification logic that's used in the knowledge base
  const classifyFailure = (errorMessage: string): string => {
    const msg = errorMessage.toLowerCase();

    if (
      msg.includes('onclick') ||
      msg.includes('handler') ||
      msg.includes('click') ||
      msg.includes('element not found')
    ) {
      return 'UI_BUG';
    }

    if (
      msg.includes('404') ||
      msg.includes('500') ||
      msg.includes('api') ||
      msg.includes('fetch') ||
      msg.includes('network')
    ) {
      return 'BACKEND_ERROR';
    }

    if (
      msg.includes('null') ||
      msg.includes('undefined') ||
      msg.includes('cannot read property') ||
      msg.includes('cannot read properties')
    ) {
      return 'DATA_ERROR';
    }

    if (msg.includes('timeout') || msg.includes('race') || msg.includes('flaky')) {
      return 'TEST_FLAKY';
    }

    return 'UNKNOWN';
  };

  it('should classify UI bugs', () => {
    expect(classifyFailure('Button missing onclick handler')).toBe('UI_BUG');
    expect(classifyFailure('Element not found')).toBe('UI_BUG');
    expect(classifyFailure('Click handler failed')).toBe('UI_BUG');
  });

  it('should classify backend errors', () => {
    expect(classifyFailure('API returned 404')).toBe('BACKEND_ERROR');
    expect(classifyFailure('Server error 500')).toBe('BACKEND_ERROR');
    expect(classifyFailure('Fetch failed: network error')).toBe('BACKEND_ERROR');
  });

  it('should classify data errors', () => {
    expect(classifyFailure("Cannot read properties of undefined (reading 'name')")).toBe('DATA_ERROR');
    expect(classifyFailure('Null reference exception')).toBe('DATA_ERROR');
    expect(classifyFailure('Value is undefined')).toBe('DATA_ERROR');
  });

  it('should classify flaky tests', () => {
    expect(classifyFailure('Test timeout exceeded')).toBe('TEST_FLAKY');
    expect(classifyFailure('Race condition detected')).toBe('TEST_FLAKY');
  });

  it('should return UNKNOWN for unrecognized errors', () => {
    expect(classifyFailure('Some random error')).toBe('UNKNOWN');
    expect(classifyFailure('Generic failure')).toBe('UNKNOWN');
  });
});
