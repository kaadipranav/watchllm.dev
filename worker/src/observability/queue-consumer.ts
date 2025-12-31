import type { Env, ObservabilityQueueMessage } from '../types';
import { insertEventsBatch } from '../lib/clickhouse';
import type { ObservabilityEvent } from '../../../packages/shared/src/observability/types';

/**
 * Handles Queue messages for observability events
 * Ingests events into ClickHouse in batches
 */
export async function handleQueueBatch(
    batch: MessageBatch<ObservabilityQueueMessage>,
    env: Env,
    ctx: ExecutionContext
): Promise<void> {
    const events: ObservabilityEvent[] = [];
    const validMessages: Message<ObservabilityQueueMessage>[] = [];

    // 1. Unpack messages
    for (const message of batch.messages) {
        try {
            const body = message.body;

            // Reconstruct event object
            // Note: The payload field in ObservabilityQueueMessage contains the full event properties
            // except the top-level keys we extracted. We need to merge them back if needed,
            // or just assume the payload IS the event if we structured it that way.
            // 
            // In ingestion.ts we did:
            // payload: event as unknown as Record<string, unknown>
            // So payload IS the full event data.

            const event = body.payload as unknown as ObservabilityEvent;

            // Basic validation
            if (event && event.event_id && event.project_id) {
                events.push(event);
                validMessages.push(message);
            } else {
                console.error('Invalid event in queue:', body);
                // We ack invalid messages so they don't retry
                message.ack();
            }
        } catch (error) {
            console.error('Failed to parse queue message:', error);
            message.ack(); // Ack to prevent retry of malformed data
        }
    }

    if (events.length === 0) {
        return;
    }

    try {
        // 2. Insert into ClickHouse
        console.log(`Processing batch of ${events.length} events for ClickHouse ingestion`);

        // We wrap this in ctx.waitUntil to ensure it completes even if the function returns early
        // properly, but typically for queue handlers, we await here.
        await insertEventsBatch(env, events);

        // 3. Acknowledge successful messages
        // If insertEventsBatch throws, we won't ack, and Cloudflare will retry
        // or send to DLQ based on configuration.
        for (const message of validMessages) {
            message.ack();
        }

        console.log(`Successfully ingested ${events.length} events`);
    } catch (error) {
        console.error('Failed to insert events into ClickHouse:', error);

        // If insertion failed, we throw so Cloudflare retries the batch
        // Or we explicitly retry specific messages if we could isolate the error
        // For now, let the batch fail and retry
        batch.retryAll();
    }
}
