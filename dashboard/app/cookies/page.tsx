import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy | WatchLLM",
  description:
    "WatchLLM Cookie Policy - Learn about the cookies we use and how to manage your preferences.",
  openGraph: {
    title: "Cookie Policy | WatchLLM",
    description:
      "WatchLLM Cookie Policy - Learn about the cookies we use and how to manage your preferences.",
    type: "website",
    url: "https://watchllm.dev/cookies",
  },
  twitter: {
    card: "summary",
    title: "Cookie Policy | WatchLLM",
    description:
      "WatchLLM Cookie Policy - Learn about the cookies we use and how to manage your preferences.",
    creator: "@kaad_zz",
  },
};

export default function CookiesPage() {
  return (
    <div className="relative min-h-screen bg-premium-bg-primary text-white selection:bg-indigo-500/30">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.06),transparent)]" />
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/5 via-transparent to-transparent blur-3xl opacity-40 mix-blend-screen" />
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-bl from-teal-500/5 via-transparent to-transparent blur-3xl opacity-40 mix-blend-screen" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-premium-text-muted hover:border-white/[0.12] mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <div className="rounded-2xl border border-white/[0.08] bg-premium-bg-elevated/70 p-8 backdrop-blur-xl">
          <h1 className="text-4xl font-bold text-premium-text-primary mb-2">
            Cookie Policy
          </h1>
          <p className="text-premium-text-secondary mb-8">
            Last updated: December 16, 2025
          </p>

          <div className="space-y-8 text-premium-text-secondary leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                1. What Are Cookies?
              </h2>
              <p>
                Cookies are small data files stored on your device when you
                visit a website. They help websites remember your preferences,
                maintain your session, and improve your experience. Cookies can
                be either &quot;persistent&quot; (stored until deleted) or &quot;session&quot;
                (deleted when you close your browser).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                2. Cookies We Use
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    2.1 Essential Cookies (Required)
                  </h3>
                  <p className="mb-3">
                    These cookies are necessary for the website to function
                    properly. You cannot opt-out of these without affecting site
                    functionality.
                  </p>
                  <div className="space-y-3 pl-4 border-l border-white/[0.2]">
                    <div>
                      <p className="font-semibold">Session Cookie (auth-token)</p>
                      <p className="text-sm">
                        Maintains your login session and authentication status.
                        Expires when you log out or close your browser.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">CSRF Protection</p>
                      <p className="text-sm">
                        Protects against cross-site request forgery attacks.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">
                        Preferences Cookie (_nextjs-theme)
                      </p>
                      <p className="text-sm">
                        Remembers your theme preference (dark/light mode).
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    2.2 Analytical Cookies (Privacy-Focused)
                  </h3>
                  <p className="mb-3">
                    We use{" "}
                    <strong>Simple Analytics</strong>, a privacy-first analytics
                    service that does NOT use cookies for tracking.
                  </p>
                  <div className="space-y-3 pl-4 border-l border-white/[0.2]">
                    <div>
                      <p className="font-semibold">Simple Analytics</p>
                      <p className="text-sm">
                        Provides anonymous usage statistics without personally
                        identifiable information, cookies, or cross-site
                        tracking.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    2.3 Third-Party Cookies
                  </h3>
                  <p className="mb-3">
                    Third-party services may set cookies when you interact with
                    them:
                  </p>
                  <div className="space-y-3 pl-4 border-l border-white/[0.2]">
                    <div>
                      <p className="font-semibold">Stripe (Payment Processing)</p>
                      <p className="text-sm">
                        Sets cookies for secure payment processing. See{" "}
                        <a
                          href="https://stripe.com/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline"
                        >
                          Stripe Privacy Policy
                        </a>
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Cloudflare (CDN)</p>
                      <p className="text-sm">
                        May set minimal cookies for performance optimization. See{" "}
                        <a
                          href="https://www.cloudflare.com/privacy/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline"
                        >
                          Cloudflare Privacy
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                3. Cookie Categories
              </h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.1]">
                    <th className="text-left py-3 px-4 text-white font-semibold">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 text-white font-semibold">
                      Purpose
                    </th>
                    <th className="text-left py-3 px-4 text-white font-semibold">
                      Required
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/[0.05]">
                    <td className="py-3 px-4">Essential</td>
                    <td className="py-3 px-4">
                      Site functionality and security
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded text-xs">
                        Yes
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/[0.05]">
                    <td className="py-3 px-4">Analytical</td>
                    <td className="py-3 px-4">
                      Understanding site usage (privacy-focused)
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        Optional
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Preference</td>
                    <td className="py-3 px-4">Remembering your settings</td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        Optional
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                4. How to Manage Cookies
              </h2>
              <div className="space-y-4">
                <p>
                  You can control cookies through your browser settings:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Chrome/Edge:</strong> Settings → Privacy and Security
                    → Cookies and other site data
                  </li>
                  <li>
                    <strong>Firefox:</strong> Preferences → Privacy & Security →
                    Cookies and Site Data
                  </li>
                  <li>
                    <strong>Safari:</strong> Preferences → Privacy → Manage
                    Website Data
                  </li>
                </ul>
                <div className="mt-4 p-4 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                  <p className="text-sm font-semibold text-amber-400">
                    ⚠️ Note: Disabling essential cookies may break site
                    functionality. You must keep essential cookies enabled for
                    login and security.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                5. Privacy by Default
              </h2>
              <p className="mb-4">
                WatchLLM is committed to privacy-first practices:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>No tracking cookies:</strong> We don&apos;t use tools like
                  Google Analytics
                </li>
                <li>
                  <strong>No cross-site tracking:</strong> We don&apos;t follow you
                  across the web
                </li>
                <li>
                  <strong>Privacy-focused analytics:</strong> Simple Analytics
                  provides insights without PII
                </li>
                <li>
                  <strong>No third-party ads:</strong> We don&apos;t sell your data
                  to advertisers
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                6. Cookie Retention
              </h2>
              <p>
                Session cookies are automatically deleted when you close your
                browser. Persistent cookies have varying expiration dates:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                <li>Authentication: 30 days (or until logout)</li>
                <li>Preferences: 1 year</li>
                <li>Analytics: No cookies (privacy-focused)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                7. Changes to This Policy
              </h2>
              <p>
                We may update this Cookie Policy as our practices evolve. We
                will notify you of significant changes by posting the updated
                policy and updating the &quot;Last updated&quot; date above.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                8. Related Policies
              </h2>
              <p className="mb-4">For more information, see our:</p>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-emerald-400 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a
                    href="https://watchllm.dev/docs"
                    className="text-emerald-400 hover:underline"
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">
                9. Contact Us
              </h2>
              <p>
                If you have questions about our cookie practices, please
                contact:
              </p>
              <div className="mt-4 p-4 rounded-lg border border-white/[0.08] bg-white/[0.02]">
                <p className="font-semibold">WatchLLM Privacy Team</p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:privacy@watchllm.dev"
                    className="text-emerald-400 hover:underline"
                  >
                    privacy@watchllm.dev
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
