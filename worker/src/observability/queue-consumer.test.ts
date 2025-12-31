import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleQueueBatch } from './queue-consumer';
import type { Env } from '../types';
import * as clickhouseLib from '../lib/clickhouse';

// Mock clickhouse library
vi.mock('../lib/clickhouse', () => ({
    insertEventsBatch: vi.fn().mockResolvedValue(undefined),
}));

describe('Queue Consumer', () => {
    let env: Env;
    let ctx: ExecutionContext;

    beforeEach(() => {
        env = {
            CLICKHOUSE_HOST: 'localhost',
        } as Env;

        ctx = {
            waitUntil: vi.fn(),
            passThroughOnException: vi.fn(),
        };

        vi.clearAllMocks();
    });

    it('should process batch and insert events', async () => {
        const ackSpy1 = vi.fn();
        const ackSpy2 = vi.fn();

        const batch = {
            queue: 'test-queue',
            messages: [
                {
                    id: 'msg-1',
                    body: {
                        payload: {
                            event_id: 'evt-1',
                            project_id: 'proj-1',
                            event_type: 'prompt_call',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    ack: ackSpy1,
                },
                {
                    id: 'msg-2',
                    body: {
                        payload: {
                            event_id: 'evt-2',
                            project_id: 'proj-1',
                            event_type: 'error',
                            timestamp: new Date().toISOString(),
                        },
                    },
                    ack: ackSpy2,
                },
            ],
            ackAll: vi.fn(),
            retryAll: vi.fn(),
        } as any;

        await handleQueueBatch(batch, env, ctx);

        // Verify insertion
        expect(clickhouseLib.insertEventsBatch).toHaveBeenCalledTimes(1);
        expect(clickhouseLib.insertEventsBatch).toHaveBeenCalledWith(env, expect.arrayContaining([
            expect.objectContaining({ event_id: 'evt-1' }),
            expect.objectContaining({ event_id: 'evt-2' }),
        ]));

        // Verify acks
        expect(ackSpy1).toHaveBeenCalled();
        expect(ackSpy2).toHaveBeenCalled();
    });

    it('should handle invalid messages by acking them without processing', async () => {
        const ackSpy = vi.fn();

        const batch = {
            queue: 'test-queue',
            messages: [
                {
                    id: 'msg-bad',
                    body: {
                        payload: {
                            // Missing required fields
                            event_type: 'unknown'
                        },
                    },
                    ack: ackSpy,
                },
            ],
            retryAll: vi.fn(),
        } as any;

        await handleQueueBatch(batch, env, ctx);

        // Should NOT call insert
        expect(clickhouseLib.insertEventsBatch).not.toHaveBeenCalled();

        // BUT should ack to clear it
        expect(ackSpy).toHaveBeenCalled();
    });

    it('should retry batch on insertion failure', async () => {
        const retryAllSpy = vi.fn();

        // Mock failure
        vi.mocked(clickhouseLib.insertEventsBatch).mockRejectedValueOnce(new Error('ClickHouse Error'));

        const batch = {
            queue: 'test-queue',
            messages: [
                {
                    id: 'msg-1',
                    body: {
                        payload: {
                            event_id: 'evt-1',
                            project_id: 'proj-1',
                        },
                    },
                    ack: vi.fn(),
                },
            ],
            retryAll: retryAllSpy,
        } as any;

        await handleQueueBatch(batch, env, ctx);

        expect(clickhouseLib.insertEventsBatch).toHaveBeenCalled();
        expect(retryAllSpy).toHaveBeenCalled();
    });
});
