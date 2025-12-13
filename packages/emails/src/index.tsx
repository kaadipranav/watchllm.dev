import { render } from "@react-email/render";
import {
  PaymentFailedEmail,
  PaymentFailedEmailProps,
} from "./templates/payment-failed";
import { UsageAlertEmail, UsageAlertEmailProps } from "./templates/usage-alert";
import { WelcomeEmail, WelcomeEmailProps } from "./templates/welcome";
import { WeeklyReportEmail, WeeklyReportEmailProps } from "./templates/weekly-report";

export interface EmailRenderResult {
  subject: string;
  preview: string;
  html: string;
  text: string;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function renderWelcomeEmail(props: WelcomeEmailProps): Promise<EmailRenderResult> {
  const html = await render(<WelcomeEmail {...props} />);
  const preview = `Welcome to WatchLLM, ${props.name}!`;
  return {
    subject: `You’re live on the ${props.plan} plan`,
    preview,
    html,
    text: stripTags(preview + " " + html).slice(0, 800),
  };
}

export async function renderUsageAlertEmail(props: UsageAlertEmailProps): Promise<EmailRenderResult> {
  const html = await render(<UsageAlertEmail {...props} />);
  const preview = `${props.projectName} is ${props.percentage}% through the ${props.plan} plan.`;
  return {
    subject: `${props.projectName} is approaching ${props.plan} limits`,
    preview,
    html,
    text: stripTags(preview + " " + html).slice(0, 800),
  };
}

export async function renderPaymentFailedEmail(props: PaymentFailedEmailProps): Promise<EmailRenderResult> {
  const html = await render(<PaymentFailedEmail {...props} />);
  const preview = `Payment failed for your ${props.plan} plan.`;
  return {
    subject: `Payment issue detected: ${props.plan} plan`,
    preview,
    html,
    text: stripTags(preview + " " + html).slice(0, 800),
  };
}

export async function renderWeeklyReportEmail(props: WeeklyReportEmailProps): Promise<EmailRenderResult> {
  const html = await render(<WeeklyReportEmail {...props} />);
  const preview = `${props.projectName} used ${props.totalRequests.toLocaleString()} requests this week.`;
  return {
    subject: `${props.projectName} weekly usage report`,
    preview,
    html,
    text: stripTags(preview + " " + html).slice(0, 800),
  };
}

export type { WelcomeEmailProps, UsageAlertEmailProps, PaymentFailedEmailProps, WeeklyReportEmailProps };