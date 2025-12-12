import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/', (c) => {
  return c.json({ message: 'WatchLLM API Proxy - Worker is running' });
});

export default app;
