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

export interface WelcomeEmailProps {
  name: string;
  plan: string;
  ctaUrl: string;
}

export function WelcomeEmail({ name, plan, ctaUrl }: WelcomeEmailProps) {
  const friendlyName = name?.trim() ? name : "Creator";
  return (
    <Html>
      <Head />
      <Preview>Welcome to WatchLLM — your AI costs just got smaller.</Preview>
      <Body style={{ backgroundColor: "#0f172a", margin: 0, padding: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
        <Section style={{ backgroundColor: "#0f172a", padding: "40px 0" }}>
          <Container style={{ backgroundColor: "#020617", borderRadius: 16, padding: "48px 32px", border: "1px solid #1e293b" }}>
            <Text style={{ color: "#60a5fa", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
              WatchLLM
            </Text>
            <Heading style={{ margin: 0, fontSize: 32, color: "#f8fafc" }}>Welcome aboard, {friendlyName}!</Heading>
            <Text style={{ color: "#cbd5f5", margin: "16px 0 24px" }}>
              Your {plan.charAt(0).toUpperCase() + plan.slice(1)} plan keeps your AI costs predictable while flushing redundant requests straight to the cache.
            </Text>
            <Button
              pX={24}
              pY={12}
              style={{
                backgroundColor: "#2563eb",
                color: "#f8fafc",
                borderRadius: 10,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
              }}
              href={ctaUrl}
            >
              Explore your dashboard
            </Button>
            <Section style={{ marginTop: 32 }}>
              <Text style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.6 }}>
                Need any help? Our concierge support is ready for you — reply directly to this email and we will respond fast.
              </Text>
            </Section>
          </Container>
          <Container style={{ marginTop: 24, textAlign: "center" }}>
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>
              You can unsubscribe from alerts and newsletters at any time by visiting our{' '}
              <Link href="%unsubscribe_url%" style={{ color: "#60a5fa" }}>
                notification settings
              </Link>
              .
            </Text>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}