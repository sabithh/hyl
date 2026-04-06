import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { getGym, getMembers, getTrainers } from "@/lib/api";
import { requireOwnerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TrainersPage() {
  const session = await requireOwnerSession();
  const [gym, trainers, trainees] = await Promise.all([
    getGym(session.accessToken).catch(() => null),
    getTrainers(session.accessToken).catch(() => []),
    getMembers(session.accessToken, "trainee", 1, 250).catch(() => ({
      members: [],
      pagination: { total: 0, page: 1, limit: 250, totalPages: 0 },
    })),
  ]);

  const traineeCountByTrainer = new Map<string, number>();

  for (const trainee of trainees.members) {
    if (!trainee.assignedTrainerId) {
      continue;
    }

    traineeCountByTrainer.set(trainee.assignedTrainerId, (traineeCountByTrainer.get(trainee.assignedTrainerId) ?? 0) + 1);
  }

  return (
    <AppShell
      title="Trainers"
      subtitle="Live coach roster, specialization, and active trainee load."
      ownerName={session.user.name}
      gymName={gym?.name ?? "HYL"}
    >
      {trainers.length === 0 ? (
        <Panel title="No trainers yet" subtitle="Create trainer accounts to see staffing data here." />
      ) : (
        <section className="grid gap-3 md:grid-cols-2">
          {trainers.map((trainer) => {
            const primarySpecialization = trainer.trainerProfile?.specializations?.[0] || "General Fitness";
            const experience = trainer.trainerProfile?.experienceYears;

            return (
              <Panel key={trainer.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-[color:var(--mint)]">{trainer.name}</h3>
                    <p className="text-sm text-[color:var(--muted)]">{primarySpecialization}</p>
                  </div>
                  <span className="rounded-full bg-[color:var(--panel-strong)] px-3 py-1 text-sm">
                    {typeof experience === "number" ? `${experience} yrs` : "Experience n/a"}
                  </span>
                </div>
                <div className="mt-4 text-sm text-[color:var(--muted)]">Active trainees</div>
                <div className="mt-1 text-3xl font-bold text-[color:var(--mint)]">{traineeCountByTrainer.get(trainer.id) ?? 0}</div>
                <div className="mt-4 text-xs text-[color:var(--muted)]">{trainer.email}</div>
              </Panel>
            );
          })}
        </section>
      )}
    </AppShell>
  );
}
