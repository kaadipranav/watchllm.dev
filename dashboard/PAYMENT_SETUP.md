# Payment Provider Integration Guide

WatchLLM supports two payment providers: **Stripe** and **Whop**. You can switch between them using a single environment variable.

## Quick Setup

1. Set your payment provider in `.env`:
   ```env
   PAYMENT_PROVIDER=stripe  # or "whop"
   ```

2. Configure the corresponding provider's credentials (see below)

3. Set up webhooks for your chosen provider

---

## Stripe Setup

### 1. Get API Keys
1. Go to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** and **Publishable key**
3. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### 2. Create Products & Prices
1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create two products:
   - **Starter Plan**: $29/month
   - **Pro Plan**: $99/month
3. Copy the **Price IDs** and add to `.env`:
   ```env
   STRIPE_STARTER_PRICE_ID=price_...
   STRIPE_PRO_PRICE_ID=price_...
   ```

### 3. Configure Webhooks
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set URL to: `https://your-domain.com/api/webhooks`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Whop Setup

### 1. Get API Keys
1. Go to [Whop Developer Dashboard](https://whop.com/dashboard/developer)
2. Click **Create app** (or use existing app)
3. Copy your **API Key**, **App ID**, and **Company ID**
4. Add to `.env`:
   ```env
   WHOP_API_KEY=your-api-key
   WHOP_APP_ID=app_xxxxxxxxxxxxxx
   WHOP_COMPANY_ID=biz_xxxxxxxxxxxxxx
   ```

### 2. Create Plans (Optional)
You can either:
- **Option A**: Create plans in [Whop Dashboard → Checkout links](https://whop.com/dashboard/links/checkout)
  - Create Starter ($29/month) and Pro ($99/month) plans
  - Copy the Plan IDs to `.env`
  
- **Option B**: Let the app create inline plans automatically via API (recommended)
  - Plans are created on-the-fly when users checkout
  - No manual setup required

If using Option A, add to `.env`:
```env
WHOP_STARTER_PLAN_ID=plan_xxxxxxxxxxxxxx
WHOP_PRO_PLAN_ID=plan_xxxxxxxxxxxxxx
```

### 3. Configure Webhooks
1. In your app dashboard, go to **Webhooks** tab
2. Click **Create Webhook**
3. Set URL to: `https://your-domain.com/api/webhooks`
4. Enable API version `v1`
5. Select these events:
   - `membership.activated`
   - `membership.updated`
   - `membership.deactivated`
   - `payment.succeeded`
   - `payment.failed`
6. Go to **Permissions** tab
7. Add these permissions:
   - `webhook_receive:membership`
   - `webhook_receive:payment`
8. Copy the **Webhook Secret** and add to `.env`:
   ```env
   WHOP_WEBHOOK_SECRET=your-webhook-secret
   ```

---

## Switching Between Providers

To switch from Stripe to Whop (or vice versa):

1. Update `.env`:
   ```env
   PAYMENT_PROVIDER=whop  # Change from "stripe" to "whop"
   ```

2. Ensure you have the new provider's credentials configured

3. Restart your app

That's it! The payment system will automatically use the new provider.

---

## Database Schema

The `subscriptions` table supports both providers with these fields:

**Stripe-specific:**
- `stripe_customer_id`
- `stripe_subscription_id`

**Whop-specific:**
- `whop_membership_id`

The schema enforces that only one provider's fields are populated per subscription using a CHECK constraint.

---

## Testing Webhooks Locally

### Stripe
1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (or download from [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli))
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks`
4. Use the webhook secret from the CLI output

### Whop
1. Use [ngrok](https://ngrok.com/) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
2. Expose your local server:
   ```bash
   ngrok http 3000
   ```
3. Use the ngrok URL in Whop webhook configuration

---

## Differences Between Providers

| Feature | Stripe | Whop |
|---------|--------|------|
| **Setup Complexity** | Medium | Low |
| **Availability** | Global (with verification) | Global |
| **Customer Portal** | Built-in billing portal | Whop Hub |
| **Inline Plans** | Not supported | ✅ Supported |
| **Fee Structure** | 2.9% + $0.30 | Varies by plan |
| **Verification** | Required in some countries (e.g., India) | Less restrictive |

---

## Troubleshooting

### "No Stripe price ID configured for plan"
- Make sure you've created products in Stripe Dashboard
- Verify `STRIPE_STARTER_PRICE_ID` and `STRIPE_PRO_PRICE_ID` are set in `.env`

### "Webhook signature verification failed"
- Check that your webhook secret is correct
- For Stripe, ensure you're using the secret from the specific webhook endpoint
- For Whop, ensure the secret is base64 encoded (automatically handled by SDK)

### Webhooks not received
- Verify your webhook URL is publicly accessible
- Check firewall/security group settings
- Test with webhook testing tools in provider dashboards
