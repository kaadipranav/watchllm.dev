import fs from "fs/promises";
import path from "path";

export const metadata = {
  title: "Privacy Policy | WatchLLM",
  description: "Privacy policy describing how WatchLLM handles user data.",
};

export default async function PrivacyPage() {
  const policyPath = path.join(process.cwd(), "policy.html");
  const policyHtml = await fs.readFile(policyPath, "utf-8");

  return (
    <div className="prose mx-auto max-w-4xl px-4 py-16 text-sm text-muted-foreground prose a:text-primary prose a:underline prose a:decoration-dotted prose a:decoration-primary/50 prose table-auto prose th:text-premium-text-primary">
      <div dangerouslySetInnerHTML={{ __html: policyHtml }} />
    </div>
  );
}
