import formData from "form-data";
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

const mailgun = new Mailgun(formData);
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
  await sendEmail(email, renderWelcomeEmail(props));
}

export async function sendUsageAlertEmail(email: string, payload: UsageAlertEmailProps) {
  const props = buildUsageAlertProps(payload);
  await sendEmail(email, renderUsageAlertEmail(props));
}

export async function sendPaymentFailedEmail(email: string, props: PaymentFailedEmailProps) {
  await sendEmail(email, renderPaymentFailedEmail(props));
}

export async function sendWeeklyReportEmail(email: string, props: WeeklyReportEmailProps) {
  await sendEmail(email, renderWeeklyReportEmail(props));
}