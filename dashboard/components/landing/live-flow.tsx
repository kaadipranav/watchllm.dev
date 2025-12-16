const liveFlows = [
  { label: "Cache hit ratio", text: "92%", width: 92, accent: "from-emerald-400 via-cyan-400 to-blue-500" },
  { label: "Requests/sec", text: "1.2K req/s", width: 74, accent: "from-violet-500 via-purple-500 to-pink-500" },
  { label: "Cost saved", text: "$34K", width: 82, accent: "from-amber-400 via-orange-400 to-red-500" },
];

export function LiveFlow() {
  const timeLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
  }).format(new Date());

  return (
    <section className="relative px-4 py-16">
      <div className="relative mx-auto max-w-5xl space-y-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm card-glow">
        {/* Top shine */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent rounded-t-2xl" />
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-400 mb-1">
              Live flow
            </p>
            <h3 className="text-2xl font-bold text-premium-text-primary">
              Traffic + semantic cache telemetry
            </h3>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-premium-text-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Updated {timeLabel}
          </span>
        </div>

        <div className="space-y-5">
          {liveFlows.map((flow) => (
            <div key={flow.label} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.2em] text-premium-text-muted">
                <span>{flow.label}</span>
                <span className="text-sm font-semibold text-premium-text-primary">{flow.text}</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${flow.accent}`}
                  style={{ width: `${flow.width}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-2 text-sm text-premium-text-muted border-t border-white/[0.06]">
          <span>Edge replicas: <strong className="text-premium-text-primary font-semibold">47</strong></span>
          <span>Latency: <strong className="text-premium-text-primary font-semibold">47ms</strong></span>
          <span>Regions: <strong className="text-premium-text-primary font-semibold">24</strong></span>
        </div>
      </div>
    </section>
  );
}
