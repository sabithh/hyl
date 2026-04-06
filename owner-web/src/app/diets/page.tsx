import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { dietPlans } from "@/lib/data";

export default function DietsPage() {
  return (
    <AppShell title="Diet Plans" subtitle="Nutrition template adherence and assignment.">
      <Panel title="Diet Templates" subtitle="Monitor adherence by template.">
        <div className="space-y-3">
          {dietPlans.map((plan) => (
            <div key={plan.title} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-[color:var(--mint)]">{plan.title}</h3>
                <p className="text-sm text-[color:var(--muted)]">{plan.assigned} assigned</p>
              </div>
              <p className="mt-2 text-sm">Adherence: {plan.adherence}</p>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
