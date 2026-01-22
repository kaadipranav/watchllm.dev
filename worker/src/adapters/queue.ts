export type QueueHandler<T> = (messages: T[]) => Promise<void>;

export interface QueueAdapter<T> {
  send(message: T): Promise<void>;
  sendBatch(messages: T[]): Promise<void>;
  stop(): void;
}

export interface QueueAdapterOptions {
  batchSize?: number;
  flushIntervalMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

class InMemoryQueueAdapter<T> implements QueueAdapter<T> {
  private buffer: T[] = [];
  private handler: QueueHandler<T>;
  private batchSize: number;
  private flushIntervalMs: number;
  private maxRetries: number;
  private retryDelayMs: number;
  private timer?: NodeJS.Timeout;
  private flushing = false;

  constructor(handler: QueueHandler<T>, options: QueueAdapterOptions = {}) {
    this.handler = handler;
    this.batchSize = options.batchSize ?? 100;
    this.flushIntervalMs = options.flushIntervalMs ?? 1000;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 500;

    this.timer = setInterval(() => {
      void this.flush();
    }, this.flushIntervalMs);
  }

  async send(message: T): Promise<void> {
    this.buffer.push(message);
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  async sendBatch(messages: T[]): Promise<void> {
    this.buffer.push(...messages);
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async flush(): Promise<void> {
    if (this.flushing) return;
    if (this.buffer.length === 0) return;

    this.flushing = true;
    const batch = this.buffer.splice(0, this.buffer.length);

    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        await this.handler(batch);
        break;
      } catch (error) {
        attempt += 1;
        if (attempt > this.maxRetries) {
          console.error('[Queue] Failed to process batch after retries:', error);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
      }
    }

    this.flushing = false;
  }
}

export function createQueueAdapter<T>(
  handler: QueueHandler<T>,
  options?: QueueAdapterOptions
): QueueAdapter<T> {
  return new InMemoryQueueAdapter(handler, options);
}
