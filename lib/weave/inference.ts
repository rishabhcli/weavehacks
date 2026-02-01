/**
 * Weave Inference Client
 * Routes LLM calls through a traced path for Weave observability and cost tracking.
 * Uses OpenAI/Gemini when Weave Inference API is not available.
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { isWeaveEnabled, op } from './core';

export interface InferenceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

async function callLLMUntraced(
  prompt: string,
  systemPrompt?: string,
  options: InferenceOptions = {}
): Promise<string> {
  const useGemini = !!process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (useGemini && process.env.GOOGLE_API_KEY) {
    const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = gemini.getGenerativeModel({
      model: options.model || 'gemini-2.0-flash',
    });
    const parts = [
      ...(systemPrompt ? [{ text: systemPrompt }] : []),
      { text: prompt },
    ];
    const result = await model.generateContent(parts);
    return result.response.text();
  }

  if (openaiKey) {
    const client = new OpenAI({ apiKey: openaiKey });
    const response = await client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      response_format: options.jsonMode ? { type: 'json_object' as const } : undefined,
    });
    return response.choices[0]?.message?.content ?? '';
  }

  throw new Error('Either GOOGLE_API_KEY or OPENAI_API_KEY is required');
}

const tracedInferenceFn = isWeaveEnabled()
  ? op(
      async (
        prompt: string,
        systemPrompt?: string,
        options: InferenceOptions = {}
      ): Promise<string> => {
        return callLLMUntraced(prompt, systemPrompt, options);
      },
      { name: 'WeaveInference.call' }
    )
  : async (
      prompt: string,
      systemPrompt?: string,
      options: InferenceOptions = {}
    ): Promise<string> => callLLMUntraced(prompt, systemPrompt, options);

/**
 * Run LLM inference with Weave tracing for cost and usage visibility.
 */
export async function weaveInference(
  prompt: string,
  systemPrompt?: string,
  options: InferenceOptions = {}
): Promise<string> {
  return tracedInferenceFn(prompt, systemPrompt, options);
}

/**
 * Run inference and parse response as JSON. Extracts JSON from markdown code blocks if present.
 */
export async function weaveInferenceWithJson<T>(
  prompt: string,
  systemPrompt?: string,
  options: InferenceOptions = {}
): Promise<T> {
  const response = await weaveInference(prompt, systemPrompt, {
    ...options,
    jsonMode: true,
  });

  const jsonMatch =
    response.match(/```json\n?([\s\S]*?)\n?```/) || response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const raw = jsonMatch[1] ?? jsonMatch[0];
  return JSON.parse(raw) as T;
}
