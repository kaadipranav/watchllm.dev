/**
 * WatchLLM Self-Hosted License Manager
 * 
 * Handles loading, caching, and monitoring license status.
 * Designed for server-side use in self-hosted deployments.
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  License, 
  LicenseValidationResult, 
  LicenseFeatures,
  parseLicense, 
  validateLicense, 
  getLicenseFeatures,
  formatLicenseInfo,
  getLicenseFingerprint
} from './license';

export interface LicenseManagerConfig {
  licensePath?: string;
  publicKey?: string;
  checkIntervalMs?: number;
  onLicenseChange?: (result: LicenseValidationResult) => void;
  onLicenseWarning?: (message: string) => void;
}

const DEFAULT_LICENSE_PATH = '/etc/watchllm/license.json';
const DEFAULT_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour
const WARNING_DAYS_THRESHOLD = 30;

/**
 * License Manager for self-hosted deployments
 * Handles license loading, validation, and monitoring
 */
export class LicenseManager {
  private config: Required<LicenseManagerConfig>;
  private cachedLicense: License | null = null;
  private cachedResult: LicenseValidationResult | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: Date | null = null;
  
  constructor(config: LicenseManagerConfig = {}) {
    this.config = {
      licensePath: config.licensePath || process.env.WATCHLLM_LICENSE_PATH || DEFAULT_LICENSE_PATH,
      publicKey: config.publicKey || process.env.WATCHLLM_LICENSE_PUBLIC_KEY || '',
      checkIntervalMs: config.checkIntervalMs || DEFAULT_CHECK_INTERVAL,
      onLicenseChange: config.onLicenseChange || (() => {}),
      onLicenseWarning: config.onLicenseWarning || ((msg) => console.warn('[WatchLLM License]', msg)),
    };
  }
  
  /**
   * Initialize the license manager
   * Loads license and starts monitoring
   */
  async initialize(): Promise<LicenseValidationResult> {
    const result = await this.checkLicense();
    this.startMonitoring();
    return result;
  }
  
  /**
   * Load license from file
   */
  private loadLicenseFromFile(): License | null {
    try {
      // Check environment variable first
      const envLicense = process.env.WATCHLLM_LICENSE;
      if (envLicense) {
        return parseLicense(envLicense);
      }
      
      // Check file path
      const licensePath = this.config.licensePath;
      if (!fs.existsSync(licensePath)) {
        return null;
      }
      
      const licenseContent = fs.readFileSync(licensePath, 'utf-8');
      return parseLicense(licenseContent);
    } catch (error) {
      console.error('[WatchLLM License] Error loading license:', error);
      return null;
    }
  }
  
  /**
   * Check and validate the current license
   */
  async checkLicense(): Promise<LicenseValidationResult> {
    const license = this.loadLicenseFromFile();
    const result = validateLicense(license, this.config.publicKey);
    
    this.lastCheckTime = new Date();
    
    // Check if license changed
    const licenseChanged = this.hasLicenseChanged(license);
    
    this.cachedLicense = license;
    this.cachedResult = result;
    
    // Notify on change
    if (licenseChanged) {
      this.config.onLicenseChange(result);
    }
    
    // Check for warnings
    this.checkWarnings(result);
    
    return result;
  }
  
  /**
   * Check if license has changed since last check
   */
  private hasLicenseChanged(newLicense: License | null): boolean {
    if (!this.cachedLicense && !newLicense) return false;
    if (!this.cachedLicense || !newLicense) return true;
    
    return getLicenseFingerprint(this.cachedLicense) !== getLicenseFingerprint(newLicense);
  }
  
  /**
   * Check for license warnings and notify
   */
  private checkWarnings(result: LicenseValidationResult): void {
    if (result.status === 'missing') {
      this.config.onLicenseWarning('No license found. Running in limited mode.');
    } else if (result.status === 'grace_period') {
      this.config.onLicenseWarning(
        `License expired! Grace period: ${result.graceDaysRemaining} days remaining. Please renew.`
      );
    } else if (result.status === 'expired') {
      this.config.onLicenseWarning('License expired. Enterprise features disabled.');
    } else if (result.daysUntilExpiry && result.daysUntilExpiry <= WARNING_DAYS_THRESHOLD) {
      this.config.onLicenseWarning(
        `License expires in ${result.daysUntilExpiry} days. Please renew soon.`
      );
    }
  }
  
  /**
   * Start periodic license monitoring
   */
  private startMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(async () => {
      await this.checkLicense();
    }, this.config.checkIntervalMs);
  }
  
  /**
   * Stop license monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  /**
   * Get cached license validation result
   */
  getValidationResult(): LicenseValidationResult {
    if (!this.cachedResult) {
      // Synchronous fallback if not initialized
      const license = this.loadLicenseFromFile();
      this.cachedLicense = license;
      this.cachedResult = validateLicense(license, this.config.publicKey);
    }
    return this.cachedResult;
  }
  
  /**
   * Get current license
   */
  getLicense(): License | null {
    return this.cachedLicense;
  }
  
  /**
   * Get enabled features
   */
  getFeatures(): LicenseFeatures {
    return getLicenseFeatures(this.cachedLicense);
  }
  
  /**
   * Check if license is valid
   */
  isValid(): boolean {
    return this.getValidationResult().valid;
  }
  
  /**
   * Check if a specific feature is enabled
   */
  hasFeature(feature: keyof LicenseFeatures): boolean {
    const features = this.getFeatures();
    return features[feature];
  }
  
  /**
   * Get formatted license info for display
   */
  getDisplayInfo(): string {
    return formatLicenseInfo(this.getValidationResult());
  }
  
  /**
   * Get license status for API responses
   */
  getStatus(): {
    valid: boolean;
    status: string;
    customer?: string;
    expiresAt?: string;
    daysRemaining?: number;
    features: string[];
  } {
    const result = this.getValidationResult();
    
    return {
      valid: result.valid,
      status: result.status,
      customer: result.license?.customer,
      expiresAt: result.license?.expires_at,
      daysRemaining: result.daysUntilExpiry,
      features: result.license?.features || [],
    };
  }
}

// Singleton instance for convenience
let defaultManager: LicenseManager | null = null;

/**
 * Get the default license manager instance
 */
export function getLicenseManager(): LicenseManager {
  if (!defaultManager) {
    defaultManager = new LicenseManager();
  }
  return defaultManager;
}

/**
 * Initialize the default license manager
 */
export async function initializeLicense(config?: LicenseManagerConfig): Promise<LicenseValidationResult> {
  defaultManager = new LicenseManager(config);
  return defaultManager.initialize();
}
