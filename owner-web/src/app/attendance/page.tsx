import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { attendanceSeries } from "@/lib/data";

export default function AttendancePage() {
  const peak = Math.max(...attendanceSeries);

  return (
    <AppShell title="Attendance" subtitle="Session check-ins and consistency patterns.">
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Weekly Distribution" subtitle="Percentage occupancy by day.">
          <div className="flex h-56 items-end gap-3">
            {attendanceSeries.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-md bg-[color:var(--panel-strong)] p-1">
                  <div
                    className="w-full rounded-sm bg-[linear-gradient(180deg,var(--mint),var(--fern))]"
                    style={{ height: `${(value / peak) * 150}px` }}
                  />
                </div>
                <span className="text-xs text-[color:var(--muted)]">D{index + 1}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Insights" subtitle="Actionable notes.">
          <ul className="space-y-2 text-sm">
            <li className="rounded-xl bg-[color:var(--panel-strong)] p-3">Peak window: 6:00 PM to 8:00 PM</li>
            <li className="rounded-xl bg-[color:var(--panel-strong)] p-3">Morning slot retention improved 9%</li>
            <li className="rounded-xl bg-[color:var(--panel-strong)] p-3">Recommend adding one extra trainer in evenings</li>
          </ul>
        </Panel>
      </section>
    </AppShell>
  );
}
