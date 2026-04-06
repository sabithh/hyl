import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { getGym, getWorkoutPlans } from "@/lib/api";
import { requireOwnerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const session = await requireOwnerSession();
  const [gym, workoutData] = await Promise.all([
    getGym(session.accessToken).catch(() => null),
    getWorkoutPlans(session.accessToken, 1, 200).catch(() => ({
      plans: [],
      pagination: { total: 0, page: 1, limit: 200, totalPages: 0 },
    })),
  ]);

  return (
    <AppShell
      title="Workout Plans"
      subtitle="Real workout templates assigned by trainers in your gym."
      ownerName={session.user.name}
      gymName={gym?.name ?? "HYL"}
    >
      <Panel title="Plan Library" subtitle={`${workoutData.pagination.total} workout plans loaded from backend.`}>
        {workoutData.plans.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No workout plans are available yet.</p>
        ) : (
          <div className="space-y-3">
            {workoutData.plans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-[color:var(--mint)]">{plan.title}</h3>
                  <span className="rounded-full bg-[color:var(--panel)] px-3 py-1 text-xs uppercase tracking-wider text-[color:var(--muted)]">
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[color:var(--muted)] sm:grid-cols-2">
                  <p>Trainer: {plan.trainer?.name || "-"}</p>
                  <p>Trainee: {plan.trainee?.name || "-"}</p>
                  <p>Exercises: {plan.exercises?.length ?? 0}</p>
                  <p>Start: {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
