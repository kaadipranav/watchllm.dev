import { describe, expect, it } from 'vitest';
import {
  sanitizeString,
  sanitizeObject,
  sanitizeStep,
  truncateRaw,
  containsSensitiveData,
} from '../sanitizer';
import { AgentStep, DEFAULT_AGENT_DEBUGGER_CONFIG } from '../types';

const config = DEFAULT_AGENT_DEBUGGER_CONFIG;

describe('Sanitizer', () => {
  describe('sanitizeString', () => {
    it('masks API keys', () => {
      const input = 'Using api_key="sk-1234567890abcdefghij" for auth';
      const result = sanitizeString(input, config);
      expect(result).not.toContain('sk-1234567890abcdefghij');
      expect(result).toContain('[API_KEY_REDACTED]');
    });

    it('masks bearer tokens', () => {
      const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz';
      const result = sanitizeString(input, config);
      expect(result).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(result).toContain('[TOKEN_REDACTED]');
    });

    it('masks known API key formats', () => {
      const inputs = [
        'Key: sk-abc123def456ghi789jkl012mno345',
        'Token: lgw_proj_abcdefghij123456',
      ];
      
      for (const input of inputs) {
        const result = sanitizeString(input, config);
        expect(result).toContain('[KEY_REDACTED]');
      }
    });

    it('masks email addresses', () => {
      const input = 'Contact: user@example.com for support';
      const result = sanitizeString(input, config);
      expect(result).not.toContain('user@example.com');
      expect(result).toContain('[EMAIL_REDACTED]');
    });

    it('masks phone numbers', () => {
      const inputs = [
        'Call me at 123-456-7890',
        'Phone: (123) 456-7890',
        'Mobile: +1 123 456 7890',
      ];
      
      for (const input of inputs) {
        const result = sanitizeString(input, config);
        expect(result).toContain('[PHONE_REDACTED]');
      }
    });

    it('masks credit card numbers', () => {
      const input = 'Card: 4111-1111-1111-1111';
      const result = sanitizeString(input, config);
      expect(result).not.toContain('4111');
      expect(result).toContain('[CARD_REDACTED]');
    });

    it('masks SSN', () => {
      const input = 'SSN: 123-45-6789';
      const result = sanitizeString(input, config);
      expect(result).not.toContain('123-45-6789');
      expect(result).toContain('[SSN_REDACTED]');
    });

    it('masks passwords', () => {
      const input = 'password="supersecret123"';
      const result = sanitizeString(input, config);
      expect(result).not.toContain('supersecret123');
      expect(result).toContain('[PASSWORD_REDACTED]');
    });

    it('preserves non-sensitive data', () => {
      const input = 'User requested 3 pizzas for delivery';
      const result = sanitizeString(input, config);
      expect(result).toBe(input);
    });
  });

  describe('sanitizeObject', () => {
    it('sanitizes nested objects', () => {
      const input = {
        user: {
          email: 'user@example.com',
          name: 'John Doe',
        },
      };
      const result = sanitizeObject(input, config) as any;
      expect(result.user.email).toBe('[EMAIL_REDACTED]');
      expect(result.user.name).toBe('John Doe');
    });

    it('sanitizes arrays', () => {
      const input = ['user@example.com', 'other@test.com'];
      const result = sanitizeObject(input, config) as string[];
      expect(result[0]).toBe('[EMAIL_REDACTED]');
      expect(result[1]).toBe('[EMAIL_REDACTED]');
    });

    it('masks sensitive keys', () => {
      const input = {
        api_key: 'very-secret-key-12345678',
        token: 'secret-token-abcdefgh',
        password: 'mypassword123',
        normal_field: 'visible value',
      };
      const result = sanitizeObject(input, config) as any;
      expect(result.api_key).toContain('...');
      expect(result.token).toContain('...');
      expect(result.password).toContain('...');
      expect(result.normal_field).toBe('visible value');
    });
  });

  describe('truncateRaw', () => {
    it('returns original if under max length', () => {
      const input = 'short text';
      const result = truncateRaw(input, 100);
      expect(result.value).toBe(input);
      expect(result.truncated).toBe(false);
    });

    it('truncates long text', () => {
      const input = 'a'.repeat(1000);
      const result = truncateRaw(input, 100);
      expect(result.value?.length).toBeLessThan(input.length);
      expect(result.truncated).toBe(true);
      expect(result.value).toContain('[TRUNCATED]');
    });

    it('handles undefined', () => {
      const result = truncateRaw(undefined, 100);
      expect(result.value).toBeUndefined();
      expect(result.truncated).toBe(false);
    });
  });

  describe('sanitizeStep', () => {
    it('sanitizes all step fields', () => {
      const step: AgentStep = {
        step_index: 0,
        timestamp: '2026-01-01T00:00:00Z',
        type: 'tool_call',
        summary: 'Calling API with key sk-abc123def456ghi789jkl012',
        tool: 'api_call',
        tool_args: {
          api_key: 'secret-key-123456789012',
          query: 'normal query',
        },
        tool_output_summary: 'Response from user@example.com',
        raw: 'Full response with email user@example.com and card 4111-1111-1111-1111',
      };

      const result = sanitizeStep(step, config);
      
      expect(result.summary).toContain('[KEY_REDACTED]');
      expect(result.tool_output_summary).toContain('[EMAIL_REDACTED]');
      expect(result.raw).toContain('[EMAIL_REDACTED]');
      expect(result.raw).toContain('[CARD_REDACTED]');
      expect((result.tool_args as any).query).toBe('normal query');
    });
  });

  describe('containsSensitiveData', () => {
    it('detects sensitive patterns', () => {
      expect(containsSensitiveData('user@example.com')).toBe(true);
      expect(containsSensitiveData('sk-abc123def456ghi789jkl012')).toBe(true);
      expect(containsSensitiveData('123-456-7890')).toBe(true);
    });

    it('returns false for safe strings', () => {
      expect(containsSensitiveData('Hello world')).toBe(false);
      expect(containsSensitiveData('Order 12345')).toBe(false);
    });

    it('handles empty strings', () => {
      expect(containsSensitiveData('')).toBe(false);
    });
  });
});
