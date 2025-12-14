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
    <footer className="relative border-t border-white/[0.06] bg-premium-bg-primary">
      <div className="container relative mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Logo & Description */}
          <div className="md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2 text-premium-text-primary">
              <Image
                src="/watchllm_logo.png"
                alt="WatchLLM Logo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="text-base font-semibold">WatchLLM</span>
            </Link>
            <p className="text-sm text-premium-text-muted">
              Reduce AI API costs by 40-70% with intelligent semantic caching.
            </p>
          </div>

          <div>
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.15em] text-premium-text-muted">
              Product
            </p>
            <ul className="mt-4 space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-premium-text-muted transition-colors duration-100 hover:text-premium-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.15em] text-premium-text-muted">
              Company
            </p>
            <ul className="mt-4 space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-premium-text-muted transition-colors duration-100 hover:text-premium-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.15em] text-premium-text-muted">
              Legal
            </p>
            <ul className="mt-4 space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-premium-text-muted transition-colors duration-100 hover:text-premium-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-premium-text-muted">
          <p>© {new Date().getFullYear()} WatchLLM. All rights reserved.</p>
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-premium-text-muted transition-colors duration-100 hover:text-premium-text-primary"
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
