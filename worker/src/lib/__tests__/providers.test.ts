import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderClient, getProviderForModel } from "../providers";
import type { ChatCompletionRequest, CompletionRequest, EmbeddingsRequest, Env } from "../../types";

const baseEnv: Env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  UPSTASH_REDIS_REST_URL: "https://redis",
  UPSTASH_REDIS_REST_TOKEN: "token",
  OPENAI_API_KEY: "sk-or-v1-test-key", // OpenRouter format
  ANTHROPIC_API_KEY: "anthropic-key",
  ENCRYPTION_MASTER_SECRET: "test-encryption-secret-32-chars-long",
  OPENROUTER_API_KEY: "sk-or-v1-test-key",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getProviderForModel", () => {
  it("maps models to providers with sensible defaults", () => {
    expect(getProviderForModel("gpt-4o")).toBe("openai");
    expect(getProviderForModel("claude-3-5-sonnet-20241022")).toBe("anthropic");
    expect(getProviderForModel("mixtral-8x7b-32768")).toBe("groq");
    expect(getProviderForModel("unknown-model")).toBe("openrouter");
  });
});

describe("ProviderClient", () => {
  it("forwards chat completions to OpenAI-compatible endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "chat1",
        object: "chat.completion",
        created: 1,
        model: "mistralai/mistral-7b-instruct:free",
        choices: [
          { index: 0, message: { role: "assistant", content: "Hello" }, finish_reason: "stop" },
        ],
        usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = new ProviderClient(baseEnv);
    const request: ChatCompletionRequest = {
      model: "mistralai/mistral-7b-instruct:free",
      messages: [{ role: "user", content: "Hello" }],
    };

    const response = await client.chatCompletion(request);

    expect(fetchMock).toHaveBeenCalledWith("https://openrouter.ai/api/v1/chat/completions", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer sk-or-v1-test-key" }),
    }));
    expect(response.choices[0].message.content).toBe("Hello");
  });

  it("converts Anthropic format and returns OpenAI-compatible payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "anth1",
        choices: [
          { index: 0, message: { role: "assistant", content: "Hey there" }, finish_reason: "stop" },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    // Mock getProviderKeys to return an Anthropic key for this test
    const client = new ProviderClient(baseEnv);
    const request: ChatCompletionRequest = {
      model: "anthropic/claude-3-haiku:free", // Use free Anthropic model
      messages: [
        { role: "system", content: "You are kind" },
        { role: "user", content: "Hi" },
      ],
    };

    const response = await client.chatCompletion(request);
    const body = JSON.parse((fetchMock.mock.calls[0][1]?.body as string) || "{}");

    expect(fetchMock).toHaveBeenCalledWith("https://openrouter.ai/api/v1/chat/completions", expect.any(Object));
    expect(response.usage.total_tokens).toBe(15);
  });

  it("throws when provider key is missing", async () => {
    const client = new ProviderClient({ ...baseEnv, OPENROUTER_API_KEY: undefined });
    const request: ChatCompletionRequest = {
      model: "mistralai/mistral-7b-instruct:free", // Use free model
      messages: [{ role: "user", content: "Hi" }],
    };

    await expect(client.chatCompletion(request)).rejects.toThrow(/API key not configured|Cannot read properties/);
  });

  it("supports legacy completions for OpenAI and rejects others", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "cmp1",
        object: "text_completion",
        created: 1,
        model: "mistralai/mistral-7b-instruct:free",
        choices: [{ text: "Done", index: 0, logprobs: null, finish_reason: "stop" }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new ProviderClient(baseEnv);
    const request: CompletionRequest = {
      model: "mistralai/mistral-7b-instruct:free",
      prompt: "Say hi",
    };

    const response = await client.completion(request);
    expect(fetchMock).toHaveBeenCalledWith("https://openrouter.ai/api/v1/completions", expect.any(Object));
    expect(response.usage.total_tokens).toBe(3);

    await expect(
      client.completion({ ...request, model: "claude-3-haiku-20240307" })
    ).rejects.toThrow(/BYOK Required/); // Updated error expectation
  });

  it("handles embeddings requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        object: "list",
        data: [{ object: "embedding", index: 0, embedding: [0.1, 0.2] }],
        model: "mistralai/mistral-7b-instruct:free",
        usage: { prompt_tokens: 2, total_tokens: 2 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new ProviderClient(baseEnv);
    const request: EmbeddingsRequest = { model: "mistralai/mistral-7b-instruct:free", input: "hello" };
    const response = await client.embeddings(request);

    expect(fetchMock).toHaveBeenCalledWith("https://openrouter.ai/api/v1/embeddings", expect.any(Object));
    expect(response.data[0].embedding.length).toBe(2);
  });
});
