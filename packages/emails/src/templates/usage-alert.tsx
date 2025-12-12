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
}: UsageAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You are {percentage}% through your {plan} plan.</Preview>
      <Body style={{ backgroundColor: "#020617", margin: 0, padding: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
        <Section style={{ backgroundColor: "#0f172a", padding: "40px 0" }}>
          <Container style={{ backgroundColor: "#05122a", borderRadius: 18, padding: "44px 32px", border: "1px solid #1e293b" }}>
            <Text style={{ color: "#60a5fa", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
              Threshold Alert
            </Text>
            <Heading style={{ margin: 0, fontSize: 28, color: "#f8fafc" }}>Almost at your limit, {name}!</Heading>
            <Text style={{ color: "#cbd5f5", margin: "16px 0 24px" }}>
              Your project <strong>{projectName}</strong> has used {usage.toLocaleString()} of {limit.toLocaleString()} requests ({percentage}% of {plan}) this month.
            </Text>
            <Table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
              <tbody>
                {[
                  ["Current period usage", `${usage.toLocaleString()} requests`],
                  ["Plan limit", `${limit.toLocaleString()} requests`],
                  ["Cache pressure", `${percentage.toFixed(1)}%`],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ padding: "8px 0", color: "#94a3b8", fontSize: 14 }}>{label}</td>
                    <td style={{ padding: "8px 0", textAlign: "right", color: "#e2e8f0", fontWeight: 600 }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
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