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

export function renderWelcomeEmail(props: WelcomeEmailProps): EmailRenderResult {
  const html = render(<WelcomeEmail {...props} />);
  const preview = `Welcome to WatchLLM, ${props.name}!`;
  return {
    subject: `You’re live on the ${props.plan} plan`,
    preview,
    html,
    text: stripTags(preview + " " + html).slice(0, 800),
  };
}

export function renderUsageAlertEmail(props: UsageAlertEmailProps): EmailRenderResult {
  const html = render(<UsageAlertEmail {...props} />);
  const preview = `${props.projectName} is ${props.percentage}% through the ${props.plan} plan.`;
  return {
    subject: `${props.projectName} is approaching ${props.plan} limits`,
    preview,
    html,
    text: stripTags(preview + " " + html).slice(0, 800),
  };
}

export function renderPaymentFailedEmail(props: PaymentFailedEmailProps): EmailRenderResult {
  const html = render(<PaymentFailedEmail {...props} />);
  const preview = `Payment failed for your ${props.plan} plan.`;
  return {
    subject: `Payment issue detected: ${props.plan} plan`,
    preview,
    html,
    text: stripTags(preview + " " + html).slice(0, 800),
  };
}

export function renderWeeklyReportEmail(props: WeeklyReportEmailProps): EmailRenderResult {
  const html = render(<WeeklyReportEmail {...props} />);
  const preview = `${props.projectName} used ${props.totalRequests.toLocaleString()} requests this week.`;
  return {
    subject: `${props.projectName} weekly usage report`,
    preview,
    html,
    text: stripTags(preview + " " + html).slice(0, 800),
  };
}

export type { EmailRenderResult, WelcomeEmailProps, UsageAlertEmailProps, PaymentFailedEmailProps, WeeklyReportEmailProps };