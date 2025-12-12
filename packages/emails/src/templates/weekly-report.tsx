import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Table,
  Text,
} from "@react-email/components";

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
}: WeeklyReportEmailProps) {
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
            <Table style={{ width: "100%", borderCollapse: "collapse", borderRadius: 12, backgroundColor: "#020617", padding: 16, color: "#e2e8f0" }}>
              <tbody>
                {[
                  ["Total requests", totalRequests.toLocaleString()],
                  ["Cached hits", cachedRequests.toLocaleString()],
                  ["Cache hit rate", `${cacheHitRate.toFixed(1)}%`],
                  ["Avg latency", `${avgLatency.toFixed(0)} ms`],
                  ["Cost", `$${totalCost.toFixed(2)}`],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ padding: "8px 0", color: "#94a3b8", fontSize: 14 }}>{label}</td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Section style={{ marginTop: 24 }}>
              <Text style={{ color: "#f8fafc", fontSize: 14, marginBottom: 8 }}>Top providers this week</Text>
              <Table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {Object.entries(requestsByProvider).map(([provider, count]) => (
                    <tr key={provider}>
                      <td style={{ color: "#94a3b8", fontSize: 14 }}>{provider}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "#f8fafc" }}>{count.toLocaleString()} requests</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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