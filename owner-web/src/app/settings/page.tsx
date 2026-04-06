import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { getGym } from "@/lib/api";
import { requireOwnerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireOwnerSession();
  const gym = await getGym(session.accessToken).catch(() => null);

  return (
    <AppShell
      title="Settings"
      subtitle="Live HYL gym profile and policy controls from backend data."
      ownerName={session.user.name}
      gymName={gym?.name ?? "HYL"}
    >
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Business Identity" subtitle="Public gym profile shown to members.">
          <form className="space-y-3 text-sm">
            <label className="block">
              <span className="mb-1 block text-[color:var(--muted)]">Gym Name</span>
              <input
                className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-2"
                value={gym?.name || ""}
                readOnly
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[color:var(--muted)]">Support Email</span>
              <input
                className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-2"
                value={gym?.email || ""}
                readOnly
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[color:var(--muted)]">Phone</span>
              <input
                className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-2"
                value={gym?.phone || ""}
                readOnly
              />
            </label>
            <p className="rounded-xl bg-[color:var(--panel-strong)] px-4 py-2 text-xs text-[color:var(--muted)]">
              Editing profile fields from owner-web UI will be enabled in the next release. This panel now shows live stored values.
            </p>
          </form>
        </Panel>

        <Panel title="Policy Controls" subtitle="Renewals, notifications and reminders.">
          <div className="space-y-3 text-sm">
            {["Auto-renew membership reminders", "Weekly inactive member report", "Trainer workload alert threshold", "Referral reward auto-issue"].map((label) => (
              <label key={label} className="flex items-center justify-between rounded-xl bg-[color:var(--panel-strong)] p-3">
                <span>{label}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-[color:var(--mint)]" />
              </label>
            ))}
            <div className="rounded-xl bg-[color:var(--panel-strong)] p-3 text-xs text-[color:var(--muted)]">
              Owner account: {session.user.email}
            </div>
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
