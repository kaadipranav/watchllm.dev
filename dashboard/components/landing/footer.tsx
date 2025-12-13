import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const productLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "/docs", label: "Documentation" },
    { href: "/changelog", label: "Changelog" },
  ];

  const companyLinks = [
    { href: "/about", label: "About" },
    { href: "/blog", label: "Blog" },
    { href: "/careers", label: "Careers" },
    { href: "mailto:support@watchllm.com", label: "Contact" },
  ];

  const legalLinks = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/security", label: "Security" },
  ];

  const socialLinks = [
    { href: "https://twitter.com/watchllm", label: "Twitter" },
    { href: "https://github.com/watchllm", label: "GitHub" },
    { href: "https://discord.gg/watchllm", label: "Discord" },
  ];

  return (
    <footer className="relative border-t border-premium-border-subtle bg-premium-bg-elevated/90 text-premium-text-secondary">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-premium-bg-elevated/60 via-transparent to-transparent" />
      <div className="container relative mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Logo & Description */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2 text-premium-text-primary">
              <Image
                src="/watchllm_logo.png"
                alt="WatchLLM Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">WatchLLM</span>
            </Link>
            <p className="text-sm text-premium-text-secondary">
              Reduce your AI API costs by 40-70% with intelligent semantic caching.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-premium-text-secondary transition hover:text-premium-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-premium-text-secondary transition hover:text-premium-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Legal</p>
            <ul className="mt-3 space-y-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-premium-text-secondary transition hover:text-premium-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-premium-border-subtle flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-premium-text-muted">
          <p>© {new Date().getFullYear()} WatchLLM. All rights reserved.</p>
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-premium-text-secondary transition hover:text-premium-text-primary"
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
