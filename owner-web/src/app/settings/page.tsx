import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Gym profile, policy and app-level defaults.">
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Business Identity" subtitle="Public gym profile shown to members.">
          <form className="space-y-3 text-sm">
            <label className="block">
              <span className="mb-1 block text-[color:var(--muted)]">Gym Name</span>
              <input className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-2" defaultValue="Gym Pulse HQ" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[color:var(--muted)]">Support Email</span>
              <input className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-2" defaultValue="owner@gympulse.app" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[color:var(--muted)]">Phone</span>
              <input className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-2" defaultValue="+1 404 555 0112" />
            </label>
            <button type="button" className="rounded-xl bg-[color:var(--mint)] px-4 py-2 font-semibold text-[color:var(--base)]">
              Save Changes
            </button>
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
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
