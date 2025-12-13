import Mailgun from "mailgun.js";
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

const mailgunApiKey = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.MAILGUN_DOMAIN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const fromAddress = process.env.EMAIL_FROM_ADDRESS || `WatchLLM <no-reply@${mailgunDomain ?? "watchllm.dev"}>`;

if (!mailgunApiKey || !mailgunDomain) {
  console.warn("Mailgun is not fully configured. Emails will not be sent.");
}

// Import FormData appropriately for Node.js environment
const FormData = require("form-data");
const mailgun = new Mailgun(FormData);
let mgClient: ReturnType<Mailgun["client"]> | null = null;

function getClient() {
  if (!mailgunApiKey || !mailgunDomain) {
    throw new Error("Missing Mailgun credentials");
  }
  if (!mgClient) {
    mgClient = mailgun.client({ username: "api", key: mailgunApiKey });
  }
  return mgClient;
}

async function sendEmail(to: string, renderResult: EmailRenderResult) {
  try {
    const client = getClient();
    await client.messages.create(mailgunDomain!, {
      from: fromAddress,
      to,
      subject: renderResult.subject,
      html: renderResult.html,
      text: renderResult.text || renderResult.preview,
      "h:List-Unsubscribe": `<${appUrl}/settings/notifications>`,
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