import { auth } from "@/auth";
import { getAnalytics } from "@/app/actions/analytics";
import { AnalyticsCards } from "@/components/dashboard/analytics-cards";
import { StageChart } from "@/components/dashboard/stage-chart";
import { SourceChart } from "@/components/dashboard/source-chart";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";

export const revalidate = 300;

export default async function DashboardPage() {
  const session = await auth();
  const analytics = await getAnalytics();

  return (
    <main className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {session?.user?.name ?? "User"} 👋
          </p>
        </div>
        <Link href="/api/export/csv" target="_blank">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </Link>
      </div>

      <AnalyticsCards stats={analytics.stats} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <StageChart data={analytics.stageBreakdown} />
        <SourceChart data={analytics.sourceBreakdown} />
      </div>
    </main>
  );
}
