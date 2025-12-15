const liveFlows = [
  { label: "Cache hit ratio", text: "92%", width: 92, accent: "from-emerald-400 via-sky-400 to-blue-500" },
  { label: "Requests/sec", text: "1.2K req/s", width: 74, accent: "from-purple-500 via-blue-500 to-cyan-400" },
  { label: "Cost saved", text: "$34K", width: 82, accent: "from-amber-400 via-orange-400 to-red-500" },
];

export function LiveFlow() {
  const timeLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
  }).format(new Date());

  return (
    <section className="relative px-4 py-16">
      <div className="relative mx-auto max-w-5xl space-y-6 rounded-3xl border border-white/[0.06] bg-[hsl(220_13%_10%)]/80 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/40">
              Live flow
            </p>
            <h3 className="text-2xl font-semibold text-white/90">
              Traffic + semantic cache telemetry
            </h3>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-white/50">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Updated {timeLabel}
          </span>
        </div>

        <div className="space-y-5">
          {liveFlows.map((flow) => (
            <div key={flow.label} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                <span>{flow.label}</span>
                <span className="text-sm text-white/80">{flow.text}</span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${flow.accent}`}
                  style={{ width: `${flow.width}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[0.65rem] uppercase tracking-[0.35em] text-white/50">
          <span>Edge replicas: <strong className="text-white/90">47</strong></span>
          <span>Latency: <strong className="text-white/90">47ms</strong></span>
          <span>Regions: <strong className="text-white/90">24</strong></span>
        </div>
      </div>

      <div className="pointer-events-none absolute left-6 top-6 hidden h-20 w-px bg-gradient-to-b from-white/80 to-transparent lg:block" />
      <div className="pointer-events-none absolute right-10 bottom-6 hidden h-16 w-16 rounded-full bg-gradient-to-b from-transparent via-white/30 to-transparent blur-2xl lg:block" />
    </section>
  );
}
