import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { notifications } from "@/lib/data";

export default function NotificationsPage() {
  return (
    <AppShell title="Notifications" subtitle="Campaigns, reminders and audience delivery state.">
      <Panel title="Campaign Queue" subtitle="In-app, push and email campaigns.">
        <div className="space-y-3">
          {notifications.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-[color:var(--mint)]">{item.title}</h3>
                <span className="rounded-full bg-[color:var(--panel)] px-3 py-1 text-xs uppercase tracking-wider text-[color:var(--muted)]">
                  {item.state}
                </span>
              </div>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Audience: {item.audience}</p>
              <p className="text-sm text-[color:var(--muted)]">Channel: {item.channel}</p>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
