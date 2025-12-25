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
} from '../types';
import { MODEL_PROVIDER_MAP } from '../types';

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
/**
 * Get provider for a given model
 */
export function getProviderForModel(model: string): Provider {
  // Check the model map first
  if (MODEL_PROVIDER_MAP[model]) {
    return MODEL_PROVIDER_MAP[model];
  }

  // Handle common prefixes if model not explicitly in map
  if (model.startsWith('gpt-')) {
    return 'openai';
  }
  if (model.startsWith('text-embedding-')) {
    return 'openrouter'; // Route embeddings to OpenRouter by default
  }
  if (model.startsWith('claude-')) {
    return 'anthropic';
  }
  if (model.startsWith('llama') || model.startsWith('mixtral') || model.startsWith('gemma')) {
    return 'groq';
  }

  // Default to openrouter for unknown models
  return 'openrouter';
}

/**
 * Models that are allowed to run on the global OpenRouter key (Free models)
 */
const FREE_MODELS = [
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-7b-it:free',
  'openchat/openchat-7b:free',
  'huggingfaceh4/zephyr-7b-beta:free',
];

/**
 * Get API key and provider info
 * Priority: User's BYOK key > Global OpenRouter key (Free models only)
 */
async function getAPIKeyAndProvider(
  env: Env,
  provider: Provider,
  model: string,
  projectId?: string
): Promise<{ apiKey: string | null; effectiveProvider: Provider; isUserKey: boolean; isFreeModel: boolean }> {
  const isFreeModel = FREE_MODELS.includes(model) || model.endsWith(':free');

  // If we have a project ID, check for user-provided keys (BYOK)
  if (projectId) {
    const { createSupabaseClient } = await import('./supabase');
    const { decryptProviderKey } = await import('./crypto');

    const supabase = createSupabaseClient(env);
    const providerKeys = await supabase.getProviderKeys(projectId);

    // Find the key for the requested provider
    const userKey = providerKeys.find(k => k.provider === provider && k.is_active);

    if (userKey && env.ENCRYPTION_MASTER_SECRET) {
      try {
        // Decrypt the user's key
        const decryptedKey = await decryptProviderKey(
          userKey.encrypted_key,
          userKey.encryption_iv,
          env.ENCRYPTION_MASTER_SECRET
        );

        console.log(`Using BYOK key for provider: ${provider}`);
        return {
          apiKey: decryptedKey,
          effectiveProvider: provider,
          isUserKey: true,
          isFreeModel
        };
      } catch (error) {
        console.error(`Failed to decrypt user key for ${provider}:`, error);
      }
    }
  }

  // No user key found. Only allow if it's a free model.
  if (!isFreeModel) {
    throw new Error(
      `BYOK Required: The model "${model}" is a paid model. To use paid models, please add your own API key in the WatchLLM dashboard (Bring Your Own Key). For free testing, use "mistralai/mistral-7b-instruct:free".`
    );
  }

  // Fallback to global OpenRouter key for free models
  return {
    apiKey: env.OPENROUTER_API_KEY || (env.OPENAI_API_KEY?.startsWith('sk-or-') ? env.OPENAI_API_KEY : null),
    effectiveProvider: 'openrouter',
    isUserKey: false,
    isFreeModel
  };
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
    request: ChatCompletionRequest,
    projectId?: string
  ): Promise<ChatCompletionResponse & { _isFreeModel?: boolean }> {
    const provider = getProviderForModel(request.model);
    const { apiKey, effectiveProvider, isFreeModel } = await getAPIKeyAndProvider(this.env, provider, request.model, projectId);

    if (!apiKey) {
      throw new Error(`API key not configured for provider: ${provider}`);
    }

    // Handle Anthropic separately due to different API format
    if (effectiveProvider === 'anthropic') {
      const resp = await this.anthropicChatCompletion(request, apiKey);
      return { ...resp, _isFreeModel: isFreeModel };
    }

    // OpenAI and Groq use the same format
    const endpoint = PROVIDER_ENDPOINTS[effectiveProvider];
    const payload = { ...request };

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Provider ${provider} error:`, error);
      throw new Error(`Provider error: ${response.status} - ${error} (Target: ${endpoint})`);
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
  async completion(request: CompletionRequest, projectId?: string): Promise<CompletionResponse & { _isFreeModel?: boolean }> {
    const provider = getProviderForModel(request.model);
    const { apiKey, effectiveProvider, isFreeModel } = await getAPIKeyAndProvider(this.env, provider, request.model, projectId);

    if (!apiKey) {
      throw new Error(`API key not configured for provider: ${provider}`);
    }

    if (effectiveProvider !== 'openai' && effectiveProvider !== 'openrouter') {
      throw new Error('Legacy completions only supported for OpenAI models');
    }

    const endpoint = PROVIDER_ENDPOINTS[effectiveProvider];
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

    const data = await response.json() as CompletionResponse;
    return { ...data, _isFreeModel: isFreeModel };
  }

  /**
   * Make an embeddings request (OpenAI only)
   */
  async embeddings(request: EmbeddingsRequest, projectId?: string): Promise<EmbeddingsResponse & { _isFreeModel?: boolean }> {
    const provider = getProviderForModel(request.model);
    const { apiKey, effectiveProvider, isFreeModel } = await getAPIKeyAndProvider(this.env, provider, request.model, projectId);

    if (!apiKey) {
      throw new Error(`API key not configured for provider: ${provider}`);
    }

    if (effectiveProvider !== 'openai' && effectiveProvider !== 'openrouter') {
      throw new Error('Embeddings only supported for OpenAI or OpenRouter models');
    }

    const endpoint = PROVIDER_ENDPOINTS[effectiveProvider] || PROVIDER_ENDPOINTS.openai;
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

    const data = await response.json() as EmbeddingsResponse;
    return { ...data, _isFreeModel: isFreeModel };
  }

  /**
   * Stream a chat completion (returns ReadableStream)
   */
  async streamChatCompletion(
    request: ChatCompletionRequest,
    projectId?: string
  ): Promise<{ stream: ReadableStream; isFreeModel: boolean }> {
    const provider = getProviderForModel(request.model);
    const { apiKey, effectiveProvider, isFreeModel } = await getAPIKeyAndProvider(this.env, provider, request.model, projectId);

    if (!apiKey) {
      throw new Error(`API key not configured for provider: ${provider}`);
    }

    // For simplicity, we'll only support OpenAI/Groq streaming for now
    if (effectiveProvider === 'anthropic') {
      throw new Error('Streaming not yet supported for Anthropic');
    }

    const endpoint = PROVIDER_ENDPOINTS[effectiveProvider];
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

    return { stream: response.body, isFreeModel };
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
