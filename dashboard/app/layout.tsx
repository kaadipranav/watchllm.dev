import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WatchLLM - Cut Your AI API Costs by 40-70%",
  description:
    "WatchLLM is a drop-in proxy that reduces your OpenAI, Claude, and Groq API costs through intelligent semantic caching.",
  keywords: ["AI", "OpenAI", "API", "proxy", "caching", "cost reduction", "LLM"],
  authors: [{ name: "WatchLLM" }],
  openGraph: {
    title: "WatchLLM - Cut Your AI API Costs by 40-70%",
    description:
      "Drop-in proxy that reduces your OpenAI, Claude, and Groq API costs through intelligent semantic caching.",
    type: "website",
    url: "https://watchllm.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchLLM - Cut Your AI API Costs by 40-70%",
    description:
      "Drop-in proxy that reduces your OpenAI, Claude, and Groq API costs through intelligent semantic caching.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
