import { createClient } from '@clickhouse/client-web';
import type { Env } from '../types';
import type { ObservabilityEvent } from '../../../packages/shared/src/observability/types';

/**
 * Creates a ClickHouse client specific to the environment
 */
export function createClickHouseClient(env: Env) {
    if (!env.CLICKHOUSE_HOST) {
        throw new Error('CLICKHOUSE_HOST is not defined');
    }

    const host = env.CLICKHOUSE_HOST;
    const port = env.CLICKHOUSE_PORT || '8123';
    const protocol = env.CLICKHOUSE_SSL === 'true' ? 'https' : 'http';
    const url = `${protocol}://${host}:${port}`;

    return createClient({
        url,
        username: env.CLICKHOUSE_USER || 'default',
        password: env.CLICKHOUSE_PASSWORD || '',
        database: env.CLICKHOUSE_DATABASE || 'watchllm',
        application: 'watchllm-worker',
    });
}

/**
 * Inserts a batch of observability events into ClickHouse
 * Transforms the nested event structure into flat rows for the database
 */
export async function insertEventsBatch(env: Env, events: ObservabilityEvent[]): Promise<void> {
    const client = createClickHouseClient(env);

    // Prepare data arrays for different tables
    const rowsEvents: any[] = [];
    const rowsToolCalls: any[] = [];
    const rowsAgentSteps: any[] = [];

    for (const event of events) {
        // 1. Prepare main event row
        const row: any = {
            event_id: event.event_id,
            project_id: event.project_id,
            run_id: event.run_id,
            timestamp: new Date(event.timestamp).getTime(), // ClickHouse expects milliseconds/number for DateTime64 or string
            user_id: event.user_id || null,
            tags: event.tags || [],
            release: event.release || null,
            env: event.env,
            client_hostname: event.client.hostname || null,
            client_sdk_version: event.client.sdk_version || null,
            client_platform: event.client.platform || null,
            event_type: event.event_type,
            context: JSON.stringify((event as any).context || {}), // Generic context

            // Default nulls for specific fields
            prompt: null,
            prompt_template_id: null,
            model: null,
            model_version: null,
            tokens_input: null,
            tokens_output: null,
            cost_estimate_usd: null,
            response: null,
            response_metadata: '{}',
            latency_ms: null,
            status: null,

            error_message: null,
            error_type: null,
            error_code: null,
            error_stack: null,
            error_context: '{}',

            step_number: null,
            step_name: null,
            step_type: null,
            step_input_data: '{}',
            step_output_data: '{}',
            step_reasoning: null,
            step_context: '{}',

            assertion_name: null,
            assertion_type: null,
            assertion_expected: '{}',
            assertion_actual: '{}',
            assertion_severity: null,

            hallucination_detection_method: null,
            hallucination_confidence_score: null,
            hallucination_flagged_content: null,
            hallucination_ground_truth: null,
            hallucination_recommendations: [],

            alert_type: null,
            alert_threshold: null,
            alert_actual_value: null,
            alert_window_minutes: null,
            alert_affected_models: [],
        };

        // 2. Fill type-specific fields
        if (event.event_type === 'prompt_call') {
            const e = event as any;
            row.prompt = e.prompt;
            row.prompt_template_id = e.prompt_template_id || null;
            row.model = e.model;
            row.model_version = e.model_version || null;
            row.tokens_input = e.tokens_input;
            row.tokens_output = e.tokens_output;
            row.cost_estimate_usd = e.cost_estimate_usd;
            row.response = e.response;
            row.response_metadata = JSON.stringify(e.response_metadata || {});
            row.latency_ms = e.latency_ms;
            row.status = e.status;

            if (e.error) {
                row.error_message = e.error.message;
                row.error_type = e.error.type || null;
                row.error_code = e.error.code || null;
                row.error_stack = e.error.stack || null;
                row.error_context = JSON.stringify(e.error.context || {});
            }

            // Handle nested tool calls
            if (e.tool_calls && Array.isArray(e.tool_calls)) {
                for (const tc of e.tool_calls) {
                    rowsToolCalls.push({
                        event_id: event.event_id,
                        project_id: event.project_id,
                        timestamp: new Date(event.timestamp).getTime(),
                        tool_name: tc.tool_name,
                        tool_id: tc.tool_id || null,
                        tool_input: JSON.stringify(tc.input || {}),
                        tool_output: JSON.stringify(tc.output || {}),
                        latency_ms: tc.latency_ms,
                        status: tc.status,
                        error_message: tc.error?.message || null,
                        error_type: tc.error?.type || null,
                        error_code: tc.error?.code || null,
                    });
                }
            }
        }
        else if (event.event_type === 'agent_step') {
            const e = event as any;
            row.step_number = e.step_number;
            row.step_name = e.step_name;
            row.step_type = e.step_type;
            row.step_input_data = JSON.stringify(e.input_data || {});
            row.step_output_data = JSON.stringify(e.output_data || {});
            row.step_reasoning = e.reasoning || null;
            row.step_context = JSON.stringify(e.context || {});
            row.latency_ms = e.latency_ms;
            row.status = e.status;

            if (e.error) {
                row.error_message = e.error.message;
            }

            // Also add to detailed agent_steps table
            rowsAgentSteps.push({
                event_id: event.event_id,
                project_id: event.project_id,
                run_id: event.run_id,
                timestamp: new Date(event.timestamp).getTime(),
                step_number: e.step_number,
                step_name: e.step_name,
                step_type: e.step_type,
                input_data: JSON.stringify(e.input_data || {}),
                output_data: JSON.stringify(e.output_data || {}),
                reasoning: e.reasoning || null,
                context: JSON.stringify(e.context || {}),
                latency_ms: e.latency_ms,
                status: e.status,
                error_message: e.error?.message || null,
                error_type: e.error?.type || null
            });
        }
        else if (event.event_type === 'error') {
            const e = event as any;
            row.status = 'error';
            if (e.error) {
                row.error_message = e.error.message;
                row.error_type = e.error.type || null;
                row.error_code = e.error.code || null;
                row.error_stack = e.error.stack || null;
                row.error_context = JSON.stringify(e.error.context || {});
            }
        }
        else if (event.event_type === 'assertion_failed') {
            const e = event as any;
            row.status = 'assertion_failed';
            row.assertion_name = e.assertion_name;
            row.assertion_type = e.assertion_type;
            row.assertion_expected = JSON.stringify(e.expected);
            row.assertion_actual = JSON.stringify(e.actual);
            row.assertion_severity = e.severity;
        }

        rowsEvents.push(row);
    }

    // 3. Bulk insert provided rows
    const inserts: Promise<any>[] = [];

    if (rowsEvents.length > 0) {
        inserts.push(client.insert({
            table: 'events',
            values: rowsEvents,
            format: 'JSONEachRow',
        }));
    }

    if (rowsToolCalls.length > 0) {
        inserts.push(client.insert({
            table: 'tool_calls',
            values: rowsToolCalls,
            format: 'JSONEachRow',
        }));
    }

    if (rowsAgentSteps.length > 0) {
        inserts.push(client.insert({
            table: 'agent_steps',
            values: rowsAgentSteps,
            format: 'JSONEachRow',
        }));
    }

    await Promise.all(inserts);
}
