import LoadingScreen from "@/components/loading-screen";

export default function AgentRunDebugLoading() {
  return (
    <LoadingScreen
      title="Rendering run detail"
      subtitle="Replaying each decision"
      detail="Step-by-step telemetry and cost attribution is warming up."
    />
  );
}
