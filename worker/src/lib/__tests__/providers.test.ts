import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderClient, getProviderForModel } from "../providers";
import type { ChatCompletionRequest, CompletionRequest, EmbeddingsRequest, Env } from "../../types";

const baseEnv: Env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  UPSTASH_REDIS_REST_URL: "https://redis",
  UPSTASH_REDIS_REST_TOKEN: "token",
  OPENAI_API_KEY: "openai-key",
  ANTHROPIC_API_KEY: "anthropic-key",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getProviderForModel", () => {
  it("maps models to providers with sensible defaults", () => {
    expect(getProviderForModel("gpt-4o")).toBe("openai");
    expect(getProviderForModel("claude-3-5-sonnet-20241022")).toBe("anthropic");
    expect(getProviderForModel("mixtral-8x7b-32768")).toBe("groq");
    expect(getProviderForModel("unknown-model")) .toBe("openai");
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
        model: "gpt-4o",
        choices: [
          { index: 0, message: { role: "assistant", content: "Hello" }, finish_reason: "stop" },
        ],
        usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = new ProviderClient(baseEnv);
    const request: ChatCompletionRequest = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello" }],
    };

    const response = await client.chatCompletion(request);

    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.com/v1/chat/completions", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer openai-key" }),
    }));
    expect(response.choices[0].message.content).toBe("Hello");
  });

  it("converts Anthropic format and returns OpenAI-compatible payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "anth1",
        content: [{ type: "text", text: "Hey there" }],
        usage: { input_tokens: 10, output_tokens: 5 },
        stop_reason: "end_turn",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new ProviderClient({ ...baseEnv, ANTHROPIC_API_KEY: "anth-key" });
    const request: ChatCompletionRequest = {
      model: "claude-3-opus-20240229",
      messages: [
        { role: "system", content: "You are kind" },
        { role: "user", content: "Hi" },
      ],
    };

    const response = await client.chatCompletion(request);
    const body = JSON.parse((fetchMock.mock.calls[0][1]?.body as string) || "{}");

    expect(fetchMock).toHaveBeenCalledWith("https://api.anthropic.com/v1/messages", expect.any(Object));
    expect(body.system).toBe("You are kind");
    expect(body.messages[0]).toEqual({ role: "user", content: "Hi" });
    expect(response.usage.total_tokens).toBe(15);
  });

  it("throws when provider key is missing", async () => {
    const client = new ProviderClient({ ...baseEnv, ANTHROPIC_API_KEY: undefined });
    const request: ChatCompletionRequest = {
      model: "claude-3-5-sonnet-20241022",
      messages: [{ role: "user", content: "Hi" }],
    };

    await expect(client.chatCompletion(request)).rejects.toThrow(/API key not configured/);
  });

  it("supports legacy completions for OpenAI and rejects others", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "cmp1",
        object: "text_completion",
        created: 1,
        model: "gpt-3.5-turbo",
        choices: [{ text: "Done", index: 0, logprobs: null, finish_reason: "stop" }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new ProviderClient(baseEnv);
    const request: CompletionRequest = {
      model: "gpt-3.5-turbo",
      prompt: "Say hi",
    };

    const response = await client.completion(request);
    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.com/v1/completions", expect.any(Object));
    expect(response.usage.total_tokens).toBe(3);

    await expect(
      client.completion({ ...request, model: "claude-3-haiku-20240307" })
    ).rejects.toThrow(/only supported for OpenAI/);
  });

  it("handles embeddings requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        object: "list",
        data: [{ object: "embedding", index: 0, embedding: [0.1, 0.2] }],
        model: "text-embedding-3-small",
        usage: { prompt_tokens: 2, total_tokens: 2 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new ProviderClient(baseEnv);
    const request: EmbeddingsRequest = { model: "text-embedding-3-small", input: "hello" };
    const response = await client.embeddings(request);

    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.com/v1/embeddings", expect.any(Object));
    expect(response.data[0].embedding.length).toBe(2);
  });
});
