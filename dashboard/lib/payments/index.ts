import type { IPaymentProvider, PaymentProvider } from "./types";
import { StripeProvider } from "./stripe-provider";
import { WhopProvider } from "./whop-provider";

/**
 * Get the configured payment provider from environment variable
 */
export function getPaymentProviderType(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER?.toLowerCase();
  
  if (provider === "whop") {
    return "whop";
  }
  
  // Default to Stripe
  return "stripe";
}

/**
 * Factory function to get the active payment provider instance
 */
export function getPaymentProvider(): IPaymentProvider {
  const providerType = getPaymentProviderType();
  
  switch (providerType) {
    case "whop":
      return new WhopProvider();
    case "stripe":
      return new StripeProvider();
    default:
      throw new Error(`Unknown payment provider: ${providerType}`);
  }
}

/**
 * Export provider classes for direct use if needed
 */
export { StripeProvider, WhopProvider };
export type { IPaymentProvider, PaymentProvider };
export * from "./types";
