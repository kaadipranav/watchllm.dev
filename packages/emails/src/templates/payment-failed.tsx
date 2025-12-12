import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface PaymentFailedEmailProps {
  name: string;
  amount: number;
  currency?: string;
  plan: string;
  ctaUrl: string;
}

export function PaymentFailedEmail({
  name,
  amount,
  currency = "USD",
  plan,
  ctaUrl,
}: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Update your billing info to keep WatchLLM running.</Preview>
      <Body style={{ backgroundColor: "#020617", margin: 0, padding: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
        <Section style={{ backgroundColor: "#0f172a", padding: "40px 0" }}>
          <Container style={{ backgroundColor: "#020617", borderRadius: 20, padding: "44px 36px", border: "1px solid #1e293b" }}>
            <Text style={{ color: "#fef3c7", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
              Billing alert
            </Text>
            <Heading style={{ margin: 0, fontSize: 30, color: "#f8fafc" }}>Payment failed for your {plan} plan</Heading>
            <Text style={{ color: "#cbd5f5", margin: "16px 0 28px" }}>
              Hi {name}, we weren’t able to process your payment of {currency} {amount.toFixed(2)}. Please update your card to prevent rate limits or usage pauses.
            </Text>
            <Section style={{ borderTop: "1px solid #1e293b", paddingTop: 20 }}>
              <Text style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.7 }}>
                We keep retrying automatically, but a quick update takes seconds and keeps your cached requests running.
              </Text>
            </Section>
            <Section style={{ textAlign: "center", marginTop: 24 }}>
              <Button
                pX={24}
                pY={12}
                href={ctaUrl}
                style={{
                  backgroundColor: "#dc2626",
                  color: "#f8fafc",
                  borderRadius: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                }}
              >
                Update billing
              </Button>
            </Section>
          </Container>
          <Container style={{ marginTop: 24, textAlign: "center" }}>
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>
              Manage notifications at any time by visiting{' '}
              <Link href="%unsubscribe_url%" style={{ color: "#60a5fa" }}>
                notification preferences
              </Link>
              .
            </Text>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}