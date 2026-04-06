import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { trainers } from "@/lib/data";

export default function TrainersPage() {
  return (
    <AppShell title="Trainers" subtitle="Coach load, specialty and quality metrics.">
      <section className="grid gap-3 md:grid-cols-2">
        {trainers.map((trainer) => (
          <Panel key={trainer.name}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-[color:var(--mint)]">{trainer.name}</h3>
                <p className="text-sm text-[color:var(--muted)]">{trainer.specialty}</p>
              </div>
              <span className="rounded-full bg-[color:var(--panel-strong)] px-3 py-1 text-sm">{trainer.rating} rating</span>
            </div>
            <div className="mt-4 text-sm text-[color:var(--muted)]">Active trainees</div>
            <div className="mt-1 text-3xl font-bold text-[color:var(--mint)]">{trainer.trainees}</div>
          </Panel>
        ))}
      </section>
    </AppShell>
  );
}
