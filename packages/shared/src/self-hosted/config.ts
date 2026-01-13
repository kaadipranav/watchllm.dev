/**
 * WatchLLM Self-Hosted Configuration
 * 
 * Central configuration for self-hosted/enterprise deployments.
 * This module handles mode detection and feature toggling.
 */

export type WatchLLMMode = 'saas' | 'self_hosted';

export interface SelfHostedConfig {
  mode: WatchLLMMode;
  isSelfHosted: boolean;
  isSaaS: boolean;
  
  // Feature flags for self-hosted mode
  features: {
    disableAuth: boolean;
    disableBilling: boolean;
    disableTelemetry: boolean;
    localStorageOnly: boolean;
    offlineLicensing: boolean;
  };
  
  // Allowed outbound hosts (only LLM providers in self-hosted mode)
  allowedOutboundHosts: string[];
}

/**
 * LLM Provider hosts that are always allowed for outbound requests
 */
const LLM_PROVIDER_HOSTS = [
  'api.openai.com',
  'api.anthropic.com',
  'api.groq.com',
  'openrouter.ai',
  'api.cohere.ai',
  'api.together.xyz',
  'api.mistral.ai',
  'api.deepseek.com',
  'api.fireworks.ai',
  'generativelanguage.googleapis.com', // Google AI
  'aiplatform.googleapis.com', // Vertex AI
  // Azure OpenAI (customer-specific endpoints)
  '*.openai.azure.com',
];

/**
 * Hosts allowed only in SaaS mode
 */
const SAAS_ONLY_HOSTS = [
  'watchllm.dev',
  'api.watchllm.com',
  'proxy.watchllm.dev',
  '*.supabase.co',
  '*.stripe.com',
  'api.resend.com',
  'api.sentry.io',
  '*.configcat.com',
];

/**
 * Get the current WatchLLM deployment mode
 */
export function getWatchLLMMode(): WatchLLMMode {
  const mode = process.env.WATCHLLM_MODE || process.env.NEXT_PUBLIC_WATCHLLM_MODE;
  
  if (mode === 'self_hosted') {
    return 'self_hosted';
  }
  
  return 'saas';
}

/**
 * Check if running in self-hosted mode
 */
export function isSelfHostedMode(): boolean {
  return getWatchLLMMode() === 'self_hosted';
}

/**
 * Check if running in SaaS mode
 */
export function isSaaSMode(): boolean {
  return getWatchLLMMode() === 'saas';
}

/**
 * Get the full self-hosted configuration
 */
export function getSelfHostedConfig(): SelfHostedConfig {
  const mode = getWatchLLMMode();
  const isSelfHosted = mode === 'self_hosted';
  
  return {
    mode,
    isSelfHosted,
    isSaaS: !isSelfHosted,
    
    features: {
      // In self-hosted mode, disable external service dependencies
      disableAuth: isSelfHosted,
      disableBilling: isSelfHosted,
      disableTelemetry: isSelfHosted,
      localStorageOnly: isSelfHosted,
      offlineLicensing: isSelfHosted,
    },
    
    // In self-hosted mode, only allow LLM provider hosts
    allowedOutboundHosts: isSelfHosted 
      ? LLM_PROVIDER_HOSTS 
      : [...LLM_PROVIDER_HOSTS, ...SAAS_ONLY_HOSTS],
  };
}

/**
 * Check if an outbound host is allowed based on current mode
 */
export function isOutboundHostAllowed(host: string): boolean {
  const config = getSelfHostedConfig();
  
  return config.allowedOutboundHosts.some(pattern => {
    if (pattern.startsWith('*.')) {
      // Wildcard pattern
      const suffix = pattern.slice(1); // Remove *
      return host.endsWith(suffix);
    }
    return host === pattern;
  });
}

/**
 * Assert that a feature is available in current mode
 * Throws error if feature is disabled
 */
export function assertFeatureAvailable(feature: keyof SelfHostedConfig['features']): void {
  const config = getSelfHostedConfig();
  
  if (config.features[feature]) {
    throw new Error(
      `Feature '${feature}' is not available in ${config.mode} mode. ` +
      `This feature is disabled for self-hosted deployments.`
    );
  }
}

/**
 * Wrap a function to only execute in SaaS mode
 * In self-hosted mode, returns undefined or a fallback value
 */
export function saasOnly<T>(fn: () => T, fallback?: T): T | undefined {
  if (isSaaSMode()) {
    return fn();
  }
  return fallback;
}

/**
 * Wrap a function to only execute in self-hosted mode
 */
export function selfHostedOnly<T>(fn: () => T, fallback?: T): T | undefined {
  if (isSelfHostedMode()) {
    return fn();
  }
  return fallback;
}
