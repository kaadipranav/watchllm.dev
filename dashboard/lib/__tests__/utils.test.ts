import { describe, expect, it, vi } from "vitest";
import {
  PLAN_LIMITS,
  cn,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentage,
  formatRelativeTime,
  generateAPIKey,
  maskAPIKey,
  sleep,
} from "../utils";

describe("utility formatters", () => {
  it("merges class names with cn", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("formats numbers and currency", () => {
    expect(formatNumber(123456)).toBe("123,456");
    expect(formatCompactNumber(12500)).toBe("13K");
    expect(formatCurrency(12.3456)).toBe("$12.3456");
    expect(formatPercentage(0.456)).toBe("0.5%");
  });

  it("formats dates and relative time", () => {
    vi.useFakeTimers();
    const fixed = new Date("2024-01-01T12:00:00Z");
    vi.setSystemTime(new Date("2024-01-01T12:00:30Z"));
    expect(formatRelativeTime(fixed)).toBe("just now");

    vi.setSystemTime(new Date("2024-01-01T12:02:00Z"));
    expect(formatRelativeTime(fixed)).toBe("2m ago");

    vi.useRealTimers();
    expect(formatDate(fixed)).toContain("2024");
  });
});

describe("API key helpers", () => {
  it("generates and masks keys", () => {
    const key = generateAPIKey("test");
    expect(key.startsWith("lgw_test_")).toBe(true);
    expect(maskAPIKey(key)).toContain("•");
  });

  it("respects plan limits", () => {
    expect(PLAN_LIMITS.free.requestsPerMonth).toBeGreaterThan(0);
    expect(PLAN_LIMITS.pro.requestsPerMinute).toBeGreaterThan(PLAN_LIMITS.free.requestsPerMinute);
  });

  it("sleep resolves after duration", async () => {
    const start = Date.now();
    await sleep(10);
    expect(Date.now() - start).toBeGreaterThanOrEqual(9);
  });
});
