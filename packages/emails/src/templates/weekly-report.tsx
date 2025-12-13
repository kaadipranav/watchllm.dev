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

export interface WeeklyReportEmailProps {
  name: string;
  projectName: string;
  periodStart: string;
  periodEnd: string;
  totalRequests: number;
  cachedRequests: number;
  cacheHitRate: number;
  totalCost: number;
  avgLatency: number;
  requestsByProvider: Record<string, number>;
  limit: number;
  plan: string;
  ctaUrl: string;
}

export function WeeklyReportEmail({
  name,
  projectName,
  periodStart,
  periodEnd,
  totalRequests,
  cachedRequests,
  cacheHitRate,
  totalCost,
  avgLatency,
  requestsByProvider,
  limit,
  plan,
  ctaUrl,
}: WeeklyReportEmailProps): ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Your weekly WatchLLM digest is ready.</Preview>
      <Body style={{ backgroundColor: "#f8fafc", margin: 0, padding: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
        <Section style={{ backgroundColor: "#fff", padding: "40px 0" }}>
          <Container style={{ backgroundColor: "#0f172a", borderRadius: 22, padding: "44px 40px", border: "1px solid #1e293b" }}>
            <Text style={{ color: "#60a5fa", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
              Weekly report
            </Text>
            <Heading style={{ margin: 0, fontSize: 30, color: "#f8fafc" }}>Hey {name}, here’s how {projectName} performed</Heading>
            <Text style={{ color: "#cbd5f5", margin: "16px 0 28px" }}>
              Covers {new Date(periodStart).toLocaleDateString()} – {new Date(periodEnd).toLocaleDateString()} / {plan.charAt(0).toUpperCase() + plan.slice(1)} tier ({limit.toLocaleString()} requests).
            </Text>
            <Section style={{ backgroundColor: "#020617", borderRadius: 12, padding: "16px", marginBottom: 24 }}>
              <Section style={{ marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1e293b" }}>
                <Text style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>Total requests</Text>
                <Text style={{ margin: 0, marginTop: 4, color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{totalRequests.toLocaleString()}</Text>
              </Section>
              <Section style={{ marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1e293b" }}>
                <Text style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>Cached hits</Text>
                <Text style={{ margin: 0, marginTop: 4, color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{cachedRequests.toLocaleString()}</Text>
              </Section>
              <Section style={{ marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1e293b" }}>
                <Text style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>Cache hit rate</Text>
                <Text style={{ margin: 0, marginTop: 4, color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{cacheHitRate.toFixed(1)}%</Text>
              </Section>
              <Section style={{ marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1e293b" }}>
                <Text style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>Avg latency</Text>
                <Text style={{ margin: 0, marginTop: 4, color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{avgLatency.toFixed(0)} ms</Text>
              </Section>
              <Section style={{ marginBottom: 0 }}>
                <Text style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>Cost</Text>
                <Text style={{ margin: 0, marginTop: 4, color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>${totalCost.toFixed(2)}</Text>
              </Section>
            </Section>
            <Section style={{ marginTop: 24 }}>
              <Text style={{ color: "#f8fafc", fontSize: 14, marginBottom: 8 }}>Top providers this week</Text>
              <Section style={{ backgroundColor: "#020617", borderRadius: 8, padding: "12px 16px" }}>
                {Object.entries(requestsByProvider).map(([provider, count], index) => (
                  <Section
                    key={provider}
                    style={{
                      marginBottom: index < Object.keys(requestsByProvider).length - 1 ? 8 : 0,
                      paddingBottom: index < Object.keys(requestsByProvider).length - 1 ? 8 : 0,
                      borderBottom: index < Object.keys(requestsByProvider).length - 1 ? "1px solid #1e293b" : undefined,
                    }}
                  >
                    <Text style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>{provider}</Text>
                    <Text style={{ margin: 0, marginTop: 4, color: "#f8fafc", fontWeight: 600, fontSize: 14 }}>{count.toLocaleString()} requests</Text>
                  </Section>
                ))}
              </Section>
            </Section>
            <Section style={{ textAlign: "center", marginTop: 32 }}>
              <Link
                href={ctaUrl}
                style={{
                  display: "inline-flex",
                  padding: "12px 22px",
                  borderRadius: 10,
                  backgroundColor: "#2563eb",
                  color: "#f8fafc",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View full analytics
              </Link>
            </Section>
            <Section style={{ marginTop: 24, textAlign: "center" }}>
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                Unsubscribe from alerts at any time via{' '}
                <Link href="%unsubscribe_url%" style={{ color: "#60a5fa" }}>
                  notification preferences
                </Link>
                .
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}