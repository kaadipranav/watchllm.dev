/**
 * WatchLLM License Validation System
 * 
 * Offline license validation for self-hosted/enterprise deployments.
 * Uses simple signature verification without online checks.
 */

import { createHmac, createHash } from 'crypto';

export interface License {
  customer: string;
  license_type: 'trial' | 'standard' | 'enterprise';
  issued_at: string;
  expires_at: string;
  features: string[];
  max_users?: number;
  max_requests_per_month?: number;
  signature: string;
}

export interface LicenseValidationResult {
  valid: boolean;
  license: License | null;
  status: 'valid' | 'expired' | 'grace_period' | 'invalid' | 'missing';
  message: string;
  daysUntilExpiry?: number;
  isGracePeriod?: boolean;
  graceDaysRemaining?: number;
}

export interface LicenseFeatures {
  selfHosted: boolean;
  auditLogs: boolean;
  advancedAnalytics: boolean;
  customIntegrations: boolean;
  prioritySupport: boolean;
  unlimitedUsers: boolean;
  sso: boolean;
}

// Grace period in days after license expiration
const GRACE_PERIOD_DAYS = 30;

// Feature mapping from license features array
const FEATURE_MAP: Record<string, keyof LicenseFeatures> = {
  'self_hosted': 'selfHosted',
  'audit_logs': 'auditLogs',
  'advanced_analytics': 'advancedAnalytics',
  'custom_integrations': 'customIntegrations',
  'priority_support': 'prioritySupport',
  'unlimited_users': 'unlimitedUsers',
  'sso': 'sso',
};

/**
 * Parse and validate a license file
 */
export function parseLicense(licenseJson: string): License | null {
  try {
    const license = JSON.parse(licenseJson) as License;
    
    // Validate required fields
    if (!license.customer || !license.license_type || !license.expires_at || !license.signature) {
      return null;
    }
    
    return license;
  } catch {
    return null;
  }
}

/**
 * Create a license payload for signing (excludes signature field)
 */
function createLicensePayload(license: License): string {
  const { signature, ...payload } = license;
  return JSON.stringify(payload, Object.keys(payload).sort());
}

/**
 * Verify the license signature
 * Uses HMAC-SHA256 with the public key
 */
export function verifyLicenseSignature(license: License, publicKey: string): boolean {
  try {
    const payload = createLicensePayload(license);
    const expectedSignature = createHmac('sha256', publicKey)
      .update(payload)
      .digest('hex');
    
    // Constant-time comparison to prevent timing attacks
    if (license.signature.length !== expectedSignature.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < license.signature.length; i++) {
      result |= license.signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    
    return result === 0;
  } catch {
    return false;
  }
}

/**
 * Calculate days until license expiration
 */
function getDaysUntilExpiry(expiresAt: string): number {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Validate a license and return detailed status
 */
export function validateLicense(
  license: License | null,
  publicKey: string
): LicenseValidationResult {
  // No license provided
  if (!license) {
    return {
      valid: false,
      license: null,
      status: 'missing',
      message: 'No license file found. Running in limited mode.',
    };
  }
  
  // Verify signature
  if (!verifyLicenseSignature(license, publicKey)) {
    return {
      valid: false,
      license,
      status: 'invalid',
      message: 'Invalid license signature. Please contact support.',
    };
  }
  
  const daysUntilExpiry = getDaysUntilExpiry(license.expires_at);
  
  // License is valid and not expired
  if (daysUntilExpiry > 0) {
    return {
      valid: true,
      license,
      status: 'valid',
      message: `License valid for ${license.customer}`,
      daysUntilExpiry,
    };
  }
  
  // License expired but within grace period
  const daysExpired = Math.abs(daysUntilExpiry);
  if (daysExpired <= GRACE_PERIOD_DAYS) {
    return {
      valid: true, // Still functional during grace period
      license,
      status: 'grace_period',
      message: `License expired ${daysExpired} days ago. Grace period: ${GRACE_PERIOD_DAYS - daysExpired} days remaining.`,
      daysUntilExpiry: 0,
      isGracePeriod: true,
      graceDaysRemaining: GRACE_PERIOD_DAYS - daysExpired,
    };
  }
  
  // License fully expired
  return {
    valid: false,
    license,
    status: 'expired',
    message: `License expired on ${license.expires_at}. Please renew to continue using enterprise features.`,
    daysUntilExpiry: daysUntilExpiry,
  };
}

/**
 * Get enabled features from a license
 */
export function getLicenseFeatures(license: License | null): LicenseFeatures {
  const defaultFeatures: LicenseFeatures = {
    selfHosted: false,
    auditLogs: false,
    advancedAnalytics: false,
    customIntegrations: false,
    prioritySupport: false,
    unlimitedUsers: false,
    sso: false,
  };
  
  if (!license || !license.features) {
    return defaultFeatures;
  }
  
  const features = { ...defaultFeatures };
  
  for (const feature of license.features) {
    const mappedFeature = FEATURE_MAP[feature];
    if (mappedFeature) {
      features[mappedFeature] = true;
    }
  }
  
  return features;
}

/**
 * Check if a specific feature is enabled
 */
export function hasFeature(license: License | null, feature: string): boolean {
  if (!license || !license.features) {
    return false;
  }
  
  return license.features.includes(feature);
}

/**
 * Generate a fingerprint for the license (for display purposes)
 */
export function getLicenseFingerprint(license: License): string {
  const payload = createLicensePayload(license);
  return createHash('sha256').update(payload).digest('hex').substring(0, 16).toUpperCase();
}

/**
 * Format license info for display
 */
export function formatLicenseInfo(result: LicenseValidationResult): string {
  if (!result.license) {
    return 'No License';
  }
  
  const lines = [
    `Customer: ${result.license.customer}`,
    `Type: ${result.license.license_type}`,
    `Status: ${result.status}`,
    `Expires: ${result.license.expires_at}`,
  ];
  
  if (result.daysUntilExpiry !== undefined && result.daysUntilExpiry > 0) {
    lines.push(`Days Remaining: ${result.daysUntilExpiry}`);
  }
  
  if (result.isGracePeriod) {
    lines.push(`⚠️ Grace Period: ${result.graceDaysRemaining} days remaining`);
  }
  
  return lines.join('\n');
}
