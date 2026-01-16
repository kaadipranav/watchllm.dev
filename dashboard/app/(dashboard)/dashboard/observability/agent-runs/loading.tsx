import LoadingScreen from "@/components/loading-screen";

export default function AgentRunsLoading() {
  return (
    <LoadingScreen
      title="Building agent timelines"
      subtitle="Fetching your latest runs"
      detail="Agent Run logging is being streamed from WatchLLM."
    />
  );
}
