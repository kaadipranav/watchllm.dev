import Link from "next/link";
import Image from "next/image";
import { APP_CONFIG } from "@/lib/config";

export function Footer() {
  const productLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "/docs", label: "Documentation" },
    { href: "/changelog", label: "Changelog" },
  ];

  const companyLinks = [
    // { href: "/about", label: "About" },
    // { href: "/blog", label: "Blog" },
    // { href: "/careers", label: "Careers" },
    { href: `mailto:${APP_CONFIG.supportEmail}`, label: "Contact" },
  ];

  const legalLinks = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/security", label: "Security" },
  ];

  const socialLinks = [
    { href: APP_CONFIG.socials.twitter, label: "Twitter" },
    { href: APP_CONFIG.socials.github, label: "GitHub" },
    { href: APP_CONFIG.socials.discord, label: "Discord" },
  ];

  return (
    <footer className="relative border-t border-white/[0.06] bg-[hsl(222_47%_3%)]">
      <div className="container relative mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Logo & Description */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 text-premium-text-primary">
              <Image
                src="/watchllm_logo.png"
                alt="WatchLLM Logo"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <span className="text-lg font-bold">WatchLLM</span>
            </Link>
            <p className="text-sm text-premium-text-muted leading-relaxed max-w-xs">
              Reduce AI API costs by 40-70% with intelligent semantic caching.
            </p>
            <div className="pt-4">
              <p className="text-xs text-premium-text-muted mb-2 uppercase tracking-widest font-bold">Enterprise Support</p>
              <p className="text-sm text-premium-text-secondary">
                Need help with integration? Contact our engineering team at <a href={`mailto:${APP_CONFIG.supportEmail}`} className="text-text-primary hover:underline underline-offset-4">{APP_CONFIG.supportEmail}</a>.
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-premium-text-primary mb-4">
              Product
            </p>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-premium-text-muted transition-colors duration-150 hover:text-premium-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-premium-text-primary mb-4">
              Company
            </p>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-premium-text-muted transition-colors duration-150 hover:text-premium-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-sm font-semibold text-premium-text-primary mb-4">
              Legal
            </p>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-premium-text-muted transition-colors duration-150 hover:text-premium-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-premium-text-muted">
            © {new Date().getFullYear()} WatchLLM. All rights reserved.
          </p>
          <div className="flex gap-6">
            {socialLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-premium-text-muted transition-colors duration-150 hover:text-premium-text-primary"
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
