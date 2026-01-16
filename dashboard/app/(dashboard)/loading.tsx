import LoadingScreen from "@/components/loading-screen";

export default function DashboardLoading() {
  return (
    <LoadingScreen
      title="Dashboard in flight"
      subtitle="Gathering metrics & runs"
      detail="Reading Supabase, ClickHouse, and edge telemetry."
    />
  );
}
