import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { Panel } from "@/components/panel";
import { getBackendHealth } from "@/lib/api";
import { attendanceSeries, dashboardKpis, recentActivity } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const backend = await getBackendHealth();
  const max = Math.max(...attendanceSeries);

  return (
    <AppShell title="Dashboard" subtitle="High-level KPIs for membership, revenue and performance.">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardKpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} />
        ))}
      </section>

      <section className="mt-4">
        <Panel title="Connectivity" subtitle="Live status of backend API connection.">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`rounded-full px-3 py-1 font-semibold ${
                backend.online
                  ? "bg-[color:var(--mint)] text-[color:var(--base)]"
                  : "bg-[#f59e0b] text-[color:var(--base)]"
              }`}
            >
              {backend.message}
            </span>
            <span className="text-[color:var(--muted)]">{backend.url}</span>
          </div>
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Panel title="Weekly Attendance Pulse" subtitle="Last 7 days average gym floor load.">
          <div className="flex h-52 items-end gap-2">
            {attendanceSeries.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-md bg-[color:var(--panel-strong)] p-1">
                  <div
                    className="w-full rounded-sm bg-[linear-gradient(180deg,var(--mint),var(--fern))]"
                    style={{ height: `${(value / max) * 140}px` }}
                  />
                </div>
                <span className="text-xs text-[color:var(--muted)]">D{index + 1}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent Activity" subtitle="Operational updates from today.">
          <ul className="space-y-3">
            {recentActivity.map((item) => (
              <li key={item} className="rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-3 text-sm">
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Revenue Mix" subtitle="Current month channels" className="lg:col-span-2">
          <div className="space-y-3">
            {[
              ["Membership", 64],
              ["Personal Training", 21],
              ["Supplements", 10],
              ["Other", 5],
            ].map(([name, share]) => (
              <div key={name as string} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span>{share}%</span>
                </div>
                <div className="h-2 rounded-full bg-[color:var(--panel-strong)]">
                  <div className="h-full rounded-full bg-[color:var(--mint)]" style={{ width: `${share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Risk Watch" subtitle="Members likely to churn">
          <ul className="space-y-2 text-sm">
            {[
              "Mia Khan - renewal in 6 days",
              "Liam Das - paused plan",
              "Anya Roy - low attendance 2 weeks",
            ].map((risk) => (
              <li key={risk} className="rounded-xl bg-[color:var(--panel-strong)] p-3">
                {risk}
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </AppShell>
  );
}
