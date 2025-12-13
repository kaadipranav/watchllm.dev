import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactElement } from "react";

export interface UsageAlertEmailProps {
  name: string;
  projectName: string;
  usage: number;
  limit: number;
  percentage: number;
  plan: string;
  ctaUrl: string;
}

export function UsageAlertEmail({
  name,
  projectName,
  usage,
  limit,
  percentage,
  plan,
  ctaUrl,
}: UsageAlertEmailProps): ReactElement {
  return (
    <Html>
      <Head />
      <Preview>You are {percentage.toFixed(0)}% through your {plan} plan.</Preview>
      <Body style={{ backgroundColor: "#020617", margin: 0, padding: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
        <Section style={{ backgroundColor: "#0f172a", padding: "40px 0" }}>
          <Container style={{ backgroundColor: "#05122a", borderRadius: 18, padding: "44px 32px", border: "1px solid #1e293b" }}>
            <Text style={{ color: "#60a5fa", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
              Threshold Alert
            </Text>
            <Heading style={{ margin: 0, fontSize: 28, color: "#f8fafc" }}>Almost at your limit, {name}!</Heading>
            <Text style={{ color: "#cbd5f5", margin: "16px 0 24px" }}>
              Your project <strong>{projectName}</strong> has used {usage.toLocaleString()} of {limit.toLocaleString()} requests ({percentage.toFixed(0)}% of {plan}) this month.
            </Text>
            <Section style={{ backgroundColor: "#020617", borderRadius: 8, padding: "16px", marginBottom: 24 }}>
              <Section style={{ marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1e293b" }}>
                <Text style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>Current period usage</Text>
                <Text style={{ margin: 0, marginTop: 4, color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{usage.toLocaleString()} requests</Text>
              </Section>
              <Section style={{ marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1e293b" }}>
                <Text style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>Plan limit</Text>
                <Text style={{ margin: 0, marginTop: 4, color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{limit.toLocaleString()} requests</Text>
              </Section>
              <Section style={{ marginBottom: 0 }}>
                <Text style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>Cache pressure</Text>
                <Text style={{ margin: 0, marginTop: 4, color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{percentage.toFixed(1)}%</Text>
              </Section>
            </Section>
            <Section style={{ marginBottom: 20 }}>
              <Text style={{ color: "#e2e8f0", fontSize: 15, lineHeight: 1.7 }}>
                We already cache your similar requests, but you may want to upgrade or review inactive keys to keep performance predictable.
              </Text>
            </Section>
            <Section style={{ textAlign: "center" }}>
              <Link
                href={ctaUrl}
                style={{
                  display: "inline-flex",
                  padding: "12px 22px",
                  borderRadius: 10,
                  backgroundColor: "#16a34a",
                  color: "#f8fafc",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Review usage plans
              </Link>
            </Section>
          </Container>
          <Container style={{ marginTop: 24, textAlign: "center" }}>
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>
              Manage notifications anytime in your{' '}
              <Link href="%unsubscribe_url%" style={{ color: "#60a5fa" }}>
                preferences
              </Link>
              .
            </Text>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}