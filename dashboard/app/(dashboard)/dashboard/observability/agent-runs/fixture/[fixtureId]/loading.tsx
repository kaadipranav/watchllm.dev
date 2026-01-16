import LoadingScreen from "@/components/loading-screen";

export default function AgentRunFixtureLoading() {
  return (
    <LoadingScreen
      title="Loading demo fixture"
      subtitle="Seeding the debugger"
      detail="This preview run is being assembled for you."
    />
  );
}
