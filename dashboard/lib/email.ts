import { Resend } from "resend";
import {
  EmailRenderResult,
  PaymentFailedEmailProps,
  renderPaymentFailedEmail,
  renderUsageAlertEmail,
  renderWelcomeEmail,
  renderWeeklyReportEmail,
  UsageAlertEmailProps,
  WeeklyReportEmailProps,
  WelcomeEmailProps,
} from "@watchllm/emails";

const resendApiKey = process.env.RESEND_API_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const fromAddress = process.env.EMAIL_FROM_ADDRESS || "WatchLLM <no-reply@watchllm.dev>";

if (!resendApiKey) {
  console.warn("Resend is not configured. Emails will not be sent.");
}

let resendClient: Resend | null = null;

function getClient(): Resend {
  if (!resendApiKey) {
    throw new Error("Missing Resend API key");
  }
  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }
  return resendClient;
}

async function sendEmail(to: string, renderResult: EmailRenderResult) {
  try {
    const client = getClient();
    await client.emails.send({
      from: fromAddress,
      to,
      subject: renderResult.subject,
      html: renderResult.html,
      text: renderResult.text || renderResult.preview,
      headers: {
        "List-Unsubscribe": `<${appUrl}/settings/notifications>`,
      },
    });
  } catch (error) {
    console.error("Unable to send email", { to, error });
  }
}

function buildUsageAlertProps(payload: UsageAlertEmailProps): UsageAlertEmailProps {
  return {
    ...payload,
    ctaUrl: payload.ctaUrl || `${appUrl}/(dashboard)`,
  };
}

export async function sendWelcomeEmail(email: string, name: string, plan: string = "free") {
  const props: WelcomeEmailProps = {
    name,
    plan,
    ctaUrl: `${appUrl}/(dashboard)`,
  };
  const renderResult = await renderWelcomeEmail(props);
  await sendEmail(email, renderResult);
}

export async function sendUsageAlertEmail(email: string, payload: UsageAlertEmailProps) {
  const props = buildUsageAlertProps(payload);
  const renderResult = await renderUsageAlertEmail(props);
  await sendEmail(email, renderResult);
}

export async function sendPaymentFailedEmail(email: string, props: PaymentFailedEmailProps) {
  const renderResult = await renderPaymentFailedEmail(props);
  await sendEmail(email, renderResult);
}

export async function sendWeeklyReportEmail(email: string, props: WeeklyReportEmailProps) {
  const renderResult = await renderWeeklyReportEmail(props);
  await sendEmail(email, renderResult);
}