import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { Panel } from "@/components/panel";
import {
  getAttendanceAnalytics,
  getAttendanceToday,
  getBackendHealth,
  getExpiringSubscriptions,
  getGym,
  getMembers,
  getPaymentSummary,
} from "@/lib/api";
import { requireOwnerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const weekdayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function DashboardPage() {
  const session = await requireOwnerSession();

  const [backend, gym, memberList, paymentSummary, attendanceToday, attendanceAnalytics, expiringSubscriptions] =
    await Promise.all([
      getBackendHealth(),
      getGym(session.accessToken).catch(() => null),
      getMembers(session.accessToken, "trainee", 1, 1).catch(() => null),
      getPaymentSummary(session.accessToken).catch(() => null),
      getAttendanceToday(session.accessToken).catch(() => null),
      getAttendanceAnalytics(session.accessToken).catch(() => null),
      getExpiringSubscriptions(session.accessToken, 7).catch(() => []),
    ]);

  const membersCount = memberList?.pagination.total ?? 0;
  const attendanceCount = attendanceToday?.totalCheckIns ?? 0;
  const currentlyInside = attendanceToday?.currentlyInside ?? 0;
  const pendingInvoices = paymentSummary?.pendingCount ?? 0;
  const monthlyRevenue = paymentSummary?.monthlyRevenue ?? 0;

  const dashboardKpis = [
    {
      label: "Active Members",
      value: membersCount.toLocaleString(),
      delta: `${currentlyInside} inside now`,
      note: "Live occupancy",
    },
    {
      label: "Monthly Revenue",
      value: currencyFormatter.format(monthlyRevenue),
      delta: `${paymentSummary?.monthlyTransactions ?? 0} tx this month`,
      note: "Collected payments",
    },
    {
      label: "Today Check-ins",
      value: attendanceCount.toLocaleString(),
      delta: `${attendanceAnalytics?.averageSessionDuration ?? 0} min avg`,
      note: "Session duration average",
    },
    {
      label: "Expiring in 7 Days",
      value: expiringSubscriptions.length.toLocaleString(),
      delta: `${pendingInvoices} pending invoices`,
      note: "Renewal risk watch",
    },
  ] as const;

  const weekdayCounts = new Map((attendanceAnalytics?.weekdayTrend ?? []).map((item) => [item.day, item.count]));
  const attendanceSeries = weekdayOrder.map((day) => ({ day, count: weekdayCounts.get(day) ?? 0 }));
  const maxAttendance = Math.max(1, ...attendanceSeries.map((item) => item.count));

  const recentActivity = [
    `${attendanceCount} check-ins recorded today.`,
    `${currentlyInside} members are currently inside the gym.`,
    `${expiringSubscriptions.length} subscriptions expire in the next 7 days.`,
    `${pendingInvoices} payments are still marked pending.`,
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Live HYL gym operations at a glance."
      ownerName={session.user.name}
      gymName={gym?.name ?? "HYL"}
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardKpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} note={kpi.note} />
        ))}
      </section>

      <section className="mt-4">
        <Panel title="Connectivity" subtitle="Live status of service connection.">
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
            <span className="text-[color:var(--muted)]">
              {backend.online ? "All core services are reachable." : "Some services are currently unavailable."}
            </span>
          </div>
        </Panel>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Panel title="Weekly Attendance Pulse" subtitle="Last 7 days average gym floor load.">
          <div className="flex h-52 items-end gap-2">
            {attendanceSeries.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-md bg-[color:var(--panel-strong)] p-1">
                  <div
                    className="w-full rounded-sm bg-[linear-gradient(180deg,var(--mint),var(--fern))]"
                    style={{ height: `${(item.count / maxAttendance) * 140}px` }}
                  />
                </div>
                <span className="text-xs text-[color:var(--muted)]">{item.day.slice(0, 3)}</span>
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
          {paymentSummary && paymentSummary.byMethod.length > 0 ? (
            <div className="space-y-3">
              {paymentSummary.byMethod.map((entry) => {
                const amount = entry._sum.amount ?? 0;
                const share = paymentSummary.monthlyRevenue > 0 ? (amount / paymentSummary.monthlyRevenue) * 100 : 0;

                return (
                  <div key={entry.method} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{entry.method}</span>
                      <span>{currencyFormatter.format(amount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[color:var(--panel-strong)]">
                      <div className="h-full rounded-full bg-[color:var(--mint)]" style={{ width: `${Math.min(100, share)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">No payment method data available yet.</p>
          )}
        </Panel>

        <Panel title="Risk Watch" subtitle="Members likely to churn">
          {expiringSubscriptions.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {expiringSubscriptions.slice(0, 5).map((subscription) => (
                <li key={subscription.id} className="rounded-xl bg-[color:var(--panel-strong)] p-3">
                  {subscription.user.name} - {subscription.plan.name} ends on {new Date(subscription.endDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">No immediate renewal risks in the next 7 days.</p>
          )}
        </Panel>
      </section>
    </AppShell>
  );
}
