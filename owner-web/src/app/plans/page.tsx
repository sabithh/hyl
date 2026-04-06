import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { workoutPlans } from "@/lib/data";

export default function PlansPage() {
  return (
    <AppShell title="Workout Plans" subtitle="Template distribution and completion trends.">
      <Panel title="Plan Library" subtitle="Top assigned workout templates.">
        <div className="space-y-3">
          {workoutPlans.map((plan) => (
            <div key={plan.title} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-[color:var(--mint)]">{plan.title}</h3>
                <span className="text-sm text-[color:var(--muted)]">{plan.assigned} assigned</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-[color:var(--line)]">
                  <div className="h-full rounded-full bg-[color:var(--mint)]" style={{ width: plan.completion }} />
                </div>
                <span className="text-sm">{plan.completion} done</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
