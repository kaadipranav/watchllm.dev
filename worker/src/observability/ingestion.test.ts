import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObservabilityIngestion } from './ingestion';
import type { Env } from '../types';
import type { ObservabilityEvent } from '../../../packages/shared/src/observability/types';

describe('ObservabilityIngestion Queue Verification', () => {
    let env: Env;
    let ingestion: ObservabilityIngestion;
    const queueSendSpy = vi.fn();

    beforeEach(() => {
        queueSendSpy.mockReset();
        env = {
            OBSERVABILITY_QUEUE: {
                send: queueSendSpy,
            } as any,
            SUPABASE_URL: 'mock-url',
            SUPABASE_ANON_KEY: 'mock-key',
            SUPABASE_SERVICE_ROLE_KEY: 'mock-role-key',
            UPSTASH_REDIS_REST_URL: 'mock-redis',
            UPSTASH_REDIS_REST_TOKEN: 'mock-token',
            OPENAI_API_KEY: 'mock-openai',
            ENCRYPTION_MASTER_SECRET: 'mock-secret',
        } as Env;

        ingestion = new ObservabilityIngestion(env);

        // Mock validateAPIKey to bypass Supabase check
        vi.spyOn(ingestion as any, 'validateAPIKey').mockResolvedValue({
            valid: true,
            project: { id: 'test-project' }
        });
    });

    it('should send event to queue asynchronously', async () => {
        const event: ObservabilityEvent = {
            event_id: 'test-event-1',
            event_type: 'prompt_call',
            project_id: 'test-project',
            run_id: 'test-run',
            timestamp: new Date().toISOString(),
            tags: [],
            env: 'development',
            client: {},
            prompt: 'test',
            model: 'gpt-4',
            tokens_input: 10,
            tokens_output: 20,
            cost_estimate_usd: 0.01,
            response: 'test response',
            response_metadata: {},
            status: 'success',
            latency_ms: 100,
        } as any;

        await ingestion.ingestEvent('test-project', event, 'valid-key');

        expect(queueSendSpy).toHaveBeenCalledTimes(1);
        expect(queueSendSpy).toHaveBeenCalledWith(expect.objectContaining({
            event_id: 'test-event-1',
            event_type: 'prompt_call',
            project_id: 'test-project',
        }));
    });

    it('should handle missing queue binding gracefully (log warning)', async () => {
        // Remove queue binding
        env.OBSERVABILITY_QUEUE = undefined;
        ingestion = new ObservabilityIngestion(env);
        vi.spyOn(ingestion as any, 'validateAPIKey').mockResolvedValue({ valid: true });

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        const event: ObservabilityEvent = {
            event_id: 'test-event-2',
            event_type: 'error',
            project_id: 'test-project',
            run_id: 'test-run',
            timestamp: new Date().toISOString(),
            tags: [],
            env: 'development',
            client: {},
            status: 'error',
            error: { message: 'test error' },
            context: {},
        } as any;

        await ingestion.ingestEvent('test-project', event, 'valid-key');

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('OBSERVABILITY_QUEUE binding not found'));
    });
});
