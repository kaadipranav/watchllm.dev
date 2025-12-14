export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(220_13%_8%)]">
      <div className="w-full max-w-sm p-6">
        {children}
      </div>
    </div>
  );
}
