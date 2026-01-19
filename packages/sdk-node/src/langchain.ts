import { WatchLLMClient } from './index';

/**
 * Partial interface for LangChain's BaseCallbackHandler
 * We define this locally to avoid a hard dependency on the LangChain package
 */
export interface LangChainCallbackHandlerInput {
    client: WatchLLMClient;
    runName?: string;
}

interface ActiveRun {
    startTime: number;
    prompt: string;
    model: string;
    runId: string; // WatchLLM run ID (trace ID)
    metadata?: any;
}

/**
 * WatchLLM Callback Handler for LangChain
 * 
 * Usage:
 * ```typescript
 * import { WatchLLMCallbackHandler } from 'watchllm-node/langchain';
 * const handler = new WatchLLMCallbackHandler({ client: watchClient });
 * const model = new ChatOpenAI({ callbacks: [handler] });
 * ```
 */
export class WatchLLMCallbackHandler {
    private client: WatchLLMClient;
    private name: string;
    private runs: Map<string, ActiveRun> = new Map();

    constructor(fields: LangChainCallbackHandlerInput) {
        this.client = fields.client;
        this.name = fields.runName || 'langchain_run';
    }

    async handleLLMStart(
        llm: { name: string },
        prompts: string[],
        runId: string,
        parentRunId?: string,
        extraParams?: any,
        tags?: string[],
        metadata?: any
    ): Promise<void> {
        // For now, we only handle the first prompt in the batch
        // In a real production SDK we might want to handle batch calls better
        const prompt = prompts[0] || '';

        // Attempt to extract model name from extraParams or llm object
        const model = extraParams?.invocation_params?.model ||
            extraParams?.invocation_params?.model_name ||
            llm.name;

        this.runs.set(runId, {
            startTime: Date.now(),
            prompt,
            model,
            runId: parentRunId || runId, // If part of a chain, use parent as trace ID, else use this run ID
            metadata: { ...metadata, tags, parentRunId },
        });
    }

    async handleLLMEnd(output: any, runId: string): Promise<void> {
        const run = this.runs.get(runId);
        if (!run) return;

        const endTime = Date.now();
        const duration = endTime - run.startTime;

        // Handle generations
        const generations = output.generations || [];
        const firstGen = generations[0]?.[0];
        const responseText = firstGen?.text || firstGen?.message?.content || JSON.stringify(output);

        // Extract usage if available
        const tokenUsage = output.llmOutput?.tokenUsage || {};
        const promptTokens = tokenUsage.promptTokens || tokenUsage.prompt_tokens || 0;
        const completionTokens = tokenUsage.completionTokens || tokenUsage.completion_tokens || 0;

        this.client.logPromptCall({
            runId: run.runId, // Use the trace ID
            prompt: run.prompt,
            model: run.model,
            response: responseText,
            tokensInput: promptTokens,
            tokensOutput: completionTokens,
            latencyMs: duration,
            status: 'success',
            responseMetadata: { ...run.metadata, ...output.llmOutput },
            userId: run.metadata?.user_id,
            tags: run.metadata?.tags,
        });

        this.runs.delete(runId);
    }

    async handleLLMError(err: any, runId: string): Promise<void> {
        const run = this.runs.get(runId);
        if (!run) return;

        const endTime = Date.now();
        const duration = endTime - run.startTime;

        this.client.logPromptCall({
            runId: run.runId,
            prompt: run.prompt,
            model: run.model,
            response: '',
            tokensInput: 0,
            tokensOutput: 0,
            latencyMs: duration,
            status: 'error',
            error: {
                message: err.message || String(err),
                stack: err.stack,
            },
            responseMetadata: run.metadata,
        });

        this.runs.delete(runId);
    }

    async handleToolStart(
        tool: { name: string },
        input: string,
        runId: string,
        parentRunId?: string,
        tags?: string[],
        metadata?: any
    ): Promise<void> {
        this.runs.set(runId, {
            startTime: Date.now(),
            prompt: input, // Reusing prompt field for tool input
            model: tool.name, // Reusing model field for tool name
            runId: parentRunId || runId,
            metadata: { ...metadata, tags, isTool: true },
        });
    }

    async handleToolEnd(output: string, runId: string): Promise<void> {
        const run = this.runs.get(runId);
        if (!run) return;

        if (run.metadata?.isTool) {
            // Log as Agent Step or Tool Call
            // For simplicity in this v1 adapter, we use logAgentStep
            const duration = Date.now() - run.startTime;

            this.client.logAgentStep({
                runId: run.runId,
                stepNumber: 0, // We don't easily know the step number in a callback without external state
                stepName: run.model, // Tool name
                stepType: 'tool_call',
                inputData: { input: run.prompt },
                outputData: { output },
                latencyMs: duration,
                status: 'success',
            });
        }

        this.runs.delete(runId);
    }

    async handleToolError(err: any, runId: string): Promise<void> {
        const run = this.runs.get(runId);
        if (!run) return;

        if (run.metadata?.isTool) {
            const duration = Date.now() - run.startTime;
            this.client.logAgentStep({
                runId: run.runId,
                stepNumber: 0,
                stepName: run.model,
                stepType: 'tool_call',
                inputData: { input: run.prompt },
                outputData: {},
                latencyMs: duration,
                status: 'error',
                error: { message: err.message || String(err) },
            });
        }
        this.runs.delete(runId);
    }
}
