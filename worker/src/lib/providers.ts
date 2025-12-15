/**
 * AI Provider clients for OpenAI, Anthropic, and Groq
 */

import type {
  Env,
  ChatCompletionRequest,
  ChatCompletionResponse,
  CompletionRequest,
  CompletionResponse,
  EmbeddingsRequest,
  EmbeddingsResponse,
  Provider,
  MODEL_PROVIDER_MAP,
} from '../types';

// Provider API endpoints
const PROVIDER_ENDPOINTS = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
};

/**
 * Get provider for a given model
 */
export function getProviderForModel(model: string): Provider {
  // OpenRouter models usually have a slash (e.g. meta-llama/llama-3-8b-instruct)
  // or explicit mapping for google/anthropic via openrouter if configured.
  // For now, if it looks like a vendor/model string, assume OpenRouter.
  if (model.includes('/')) {
    return 'openrouter';
  }

  // Check if model starts with known prefixes
  if (model.startsWith('gpt-') || model.startsWith('text-embedding')) {
    return 'openai';
  }
  if (model.startsWith('claude-')) {
    return 'anthropic';
  }
  if (
    model.startsWith('llama') ||
    model.startsWith('mixtral') ||
    model.startsWith('gemma')
  ) {
    return 'groq';
  }

  // Default to OpenAI
  return 'openai';
}

/**
 * Get API key for a provider from environment
 */
function getAPIKey(env: Env, provider: Provider): string | null {
  switch (provider) {
    case 'openai':
      return env.OPENAI_API_KEY || null;
    case 'anthropic':
      return env.ANTHROPIC_API_KEY || null;
    case 'groq':
      return env.GROQ_API_KEY || null;
    case 'openrouter':
      // Try explicit OpenRouter key first, fallback to OpenAI key if user wants to reuse
      return env.OPENROUTER_API_KEY || null;
    default:
      return null;
  }
}

/**
 * Convert OpenAI format to Anthropic format
 */
function convertToAnthropicRequest(request: ChatCompletionRequest): Record<string, unknown> {
  // Extract system message if present
  const systemMessage = request.messages.find((m) => m.role === 'system');
  const otherMessages = request.messages.filter((m) => m.role !== 'system');

  return {
    model: request.model,
    max_tokens: request.max_tokens || 4096,
    messages: otherMessages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || '',
    })),
    system: systemMessage?.content || undefined,
    temperature: request.temperature,
    top_p: request.top_p,
    stop_sequences: request.stop
      ? Array.isArray(request.stop)
        ? request.stop
        : [request.stop]
      : undefined,
  };
}

/**
 * Convert Anthropic response to OpenAI format
 */
function convertFromAnthropicResponse(
  response: Record<string, unknown>,
  model: string
): ChatCompletionResponse {
  const content = response.content as Array<{ type: string; text: string }>;
  const textContent = content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('');

  const usage = response.usage as {
    input_tokens: number;
    output_tokens: number;
  };

  return {
    id: response.id as string,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: textContent,
        },
        finish_reason: (response.stop_reason as string) === 'end_turn' ? 'stop' : 'stop',
      },
    ],
    usage: {
      prompt_tokens: usage.input_tokens,
      completion_tokens: usage.output_tokens,
      total_tokens: usage.input_tokens + usage.output_tokens,
    },
  };
}

export class ProviderClient {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Make a chat completion request
   */
  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const provider = getProviderForModel(request.model);
    const apiKey = getAPIKey(this.env, provider);

    if (!apiKey) {
      throw new Error(`API key not configured for provider: ${provider}`);
    }

    // Handle Anthropic separately due to different API format
    if (provider === 'anthropic') {
      return this.anthropicChatCompletion(request, apiKey);
    }

    // OpenAI and Groq use the same format
    const endpoint = PROVIDER_ENDPOINTS[provider];
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Provider ${provider} error:`, error);
      throw new Error(`Provider error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<ChatCompletionResponse>;
  }

  /**
   * Anthropic-specific chat completion
   */
  private async anthropicChatCompletion(
    request: ChatCompletionRequest,
    apiKey: string
  ): Promise<ChatCompletionResponse> {
    const anthropicRequest = convertToAnthropicRequest(request);

    const response = await fetch(`${PROVIDER_ENDPOINTS.anthropic}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(anthropicRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic error:', error);
      throw new Error(`Anthropic error: ${response.status} - ${error}`);
    }

    const anthropicResponse = (await response.json()) as Record<string, unknown>;
    return convertFromAnthropicResponse(anthropicResponse, request.model);
  }

  /**
   * Make a legacy completion request (OpenAI only)
   */
  async completion(request: CompletionRequest): Promise<CompletionResponse> {
    const provider = getProviderForModel(request.model);
    const apiKey = getAPIKey(this.env, provider);

    if (!apiKey) {
      throw new Error(`API key not configured for provider: ${provider}`);
    }

    if (provider !== 'openai') {
      throw new Error('Legacy completions only supported for OpenAI models');
    }

    const endpoint = PROVIDER_ENDPOINTS.openai;
    const response = await fetch(`${endpoint}/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI completion error:', error);
      throw new Error(`OpenAI error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<CompletionResponse>;
  }

  /**
   * Make an embeddings request (OpenAI only)
   */
  async embeddings(request: EmbeddingsRequest): Promise<EmbeddingsResponse> {
    const provider = getProviderForModel(request.model);
    const apiKey = getAPIKey(this.env, provider);

    if (!apiKey) {
      throw new Error(`API key not configured for provider: ${provider}`);
    }

    if (provider !== 'openai') {
      throw new Error('Embeddings only supported for OpenAI models');
    }

    const endpoint = PROVIDER_ENDPOINTS.openai;
    const response = await fetch(`${endpoint}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI embeddings error:', error);
      throw new Error(`OpenAI error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<EmbeddingsResponse>;
  }

  /**
   * Stream a chat completion (returns ReadableStream)
   */
  async streamChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ReadableStream> {
    const provider = getProviderForModel(request.model);
    const apiKey = getAPIKey(this.env, provider);

    if (!apiKey) {
      throw new Error(`API key not configured for provider: ${provider}`);
    }

    // For simplicity, we'll only support OpenAI/Groq streaming for now
    if (provider === 'anthropic') {
      throw new Error('Streaming not yet supported for Anthropic');
    }

    const endpoint = PROVIDER_ENDPOINTS[provider];
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Provider error: ${response.status} - ${error}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    return response.body;
  }
}

/**
 * Create provider client instance
 */
export function createProviderClient(env: Env): ProviderClient {
  return new ProviderClient(env);
}

let sharedProviderClient: ProviderClient | null = null;

export function getSharedProviderClient(env: Env): ProviderClient {
  if (!sharedProviderClient) {
    sharedProviderClient = new ProviderClient(env);
  }
  return sharedProviderClient;
}
