import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { getAttendanceAnalytics, getAttendanceToday, getGym } from "@/lib/api";
import { requireOwnerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const weekdayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function AttendancePage() {
  const session = await requireOwnerSession();
  const [gym, today, analytics] = await Promise.all([
    getGym(session.accessToken).catch(() => null),
    getAttendanceToday(session.accessToken).catch(() => ({ totalCheckIns: 0, currentlyInside: 0, records: [] })),
    getAttendanceAnalytics(session.accessToken).catch(() => ({ totalRecords: 0, averageSessionDuration: 0, peakHours: [], weekdayTrend: [] })),
  ]);

  const byDay = new Map(analytics.weekdayTrend.map((item) => [item.day, item.count]));
  const attendanceSeries = weekdayOrder.map((day) => ({ day, count: byDay.get(day) ?? 0 }));
  const peak = Math.max(1, ...attendanceSeries.map((item) => item.count));

  return (
    <AppShell
      title="Attendance"
      subtitle="Live check-in analytics and occupancy patterns."
      ownerName={session.user.name}
      gymName={gym?.name ?? "HYL"}
    >
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Weekly Distribution" subtitle="Percentage occupancy by day.">
          <div className="flex h-56 items-end gap-3">
            {attendanceSeries.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-md bg-[color:var(--panel-strong)] p-1">
                  <div
                    className="w-full rounded-sm bg-[linear-gradient(180deg,var(--mint),var(--fern))]"
                    style={{ height: `${(item.count / peak) * 150}px` }}
                  />
                </div>
                <span className="text-xs text-[color:var(--muted)]">{item.day.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Insights" subtitle="Actionable notes.">
          <ul className="space-y-2 text-sm">
            <li className="rounded-xl bg-[color:var(--panel-strong)] p-3">Total check-ins today: {today.totalCheckIns}</li>
            <li className="rounded-xl bg-[color:var(--panel-strong)] p-3">Currently inside gym: {today.currentlyInside}</li>
            <li className="rounded-xl bg-[color:var(--panel-strong)] p-3">
              Average session: {analytics.averageSessionDuration} minutes
            </li>
            <li className="rounded-xl bg-[color:var(--panel-strong)] p-3">
              Peak hour: {analytics.peakHours[0]?.hour || "No attendance data yet"}
            </li>
          </ul>
        </Panel>
      </section>
    </AppShell>
  );
}
