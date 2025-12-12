// Shared types and utilities

export interface APIKey {
  id: string;
  key: string;
  projectId: string;
  name?: string;
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  plan: 'free' | 'starter' | 'pro';
  createdAt: string;
  updatedAt: string;
}

export interface UsageLog {
  id: string;
  projectId: string;
  apiKeyId: string;
  model: string;
  provider: 'openai' | 'anthropic' | 'groq';
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  costUsd: number;
  cached: boolean;
  latencyMs: number;
  createdAt: string;
}

export type PlanLimits = {
  [key in Project['plan']]: {
    requestsPerMonth: number;
    requestsPerMinute: number;
  };
};

export const PLAN_LIMITS: PlanLimits = {
  free: {
    requestsPerMonth: 50_000,
    requestsPerMinute: 10,
  },
  starter: {
    requestsPerMonth: 250_000,
    requestsPerMinute: 50,
  },
  pro: {
    requestsPerMonth: 1_000_000,
    requestsPerMinute: 200,
  },
};
