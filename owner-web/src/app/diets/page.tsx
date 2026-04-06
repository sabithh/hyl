import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { getDietPlans, getGym } from "@/lib/api";
import { requireOwnerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DietsPage() {
  const session = await requireOwnerSession();
  const [gym, dietData] = await Promise.all([
    getGym(session.accessToken).catch(() => null),
    getDietPlans(session.accessToken, 1, 200).catch(() => ({
      dietPlans: [],
      pagination: { total: 0, page: 1, limit: 200, totalPages: 0 },
    })),
  ]);

  return (
    <AppShell
      title="Diet Plans"
      subtitle="Live nutrition plans configured by your trainers."
      ownerName={session.user.name}
      gymName={gym?.name ?? "HYL"}
    >
      <Panel title="Diet Templates" subtitle={`${dietData.pagination.total} diet plans from backend.`}>
        {dietData.dietPlans.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No diet plans found yet.</p>
        ) : (
          <div className="space-y-3">
            {dietData.dietPlans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-[color:var(--mint)]">{plan.title}</h3>
                  <p className="text-sm text-[color:var(--muted)]">{plan.isActive ? "Active" : "Inactive"}</p>
                </div>
                <div className="mt-2 grid gap-1 text-sm text-[color:var(--muted)] sm:grid-cols-2">
                  <p>Trainer: {plan.trainer?.name || "-"}</p>
                  <p>Trainee: {plan.trainee?.name || "-"}</p>
                  <p>Calories: {plan.dailyCaloriesTarget ?? "-"}</p>
                  <p>Protein: {plan.dailyProteinTargetG ?? "-"} g</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
